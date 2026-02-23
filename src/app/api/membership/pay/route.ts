/**
 * POST /api/membership/pay
 * MetaMask でネットワーク会費を支払った後、txHash をサーバーに送信して会員登録を行う。
 * サーバーは viem で Base mainnet の tx を検証し、宛先・金額・チェーンIDを確認してから
 * NetworkMembership を有効化する。
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPublicClient, http, parseEther, formatEther } from "viem";
import { base } from "viem/chains";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";

const PaySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  chainId: z.number().int().positive(),
});

// Base mainnet public client
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? "https://mainnet.base.org"),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.walletAddress) return NextResponse.json({ error: "ウォレット接続が必要です" }, { status: 403 });
  if (user.isFrozen) return NextResponse.json({ error: "アカウントが凍結されています" }, { status: 403 });

  const body = await req.json();
  const parsed = PaySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { txHash, chainId } = parsed.data;
  const expectedChainId = 8453; // Base mainnet
  if (chainId !== expectedChainId) {
    return NextResponse.json({ error: "Base mainnet (chainId=8453) のみ対応しています" }, { status: 400 });
  }

  // 冪等性チェック — 同じtxHashが既に処理済みなら拒否
  const existingPayment = await prisma.membershipPayment.findUnique({ where: { txHash } });
  if (existingPayment) {
    return NextResponse.json({ error: "このトランザクションは既に処理済みです" }, { status: 409 });
  }

  // ── tx 検証 ────────────────────────────────────────────────────
  const receiptAddress = (process.env.MEMBERSHIP_RECEIPT_ADDRESS ?? "").toLowerCase();
  const requiredAmountWei = BigInt(process.env.MEMBERSHIP_AMOUNT_WEI ?? "0");

  let txReceipt;
  try {
    txReceipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
  } catch {
    return NextResponse.json({ error: "トランザクションが見つかりません。Base mainnet で確認してください。" }, { status: 400 });
  }

  if (txReceipt.status !== "success") {
    return NextResponse.json({ error: "トランザクションが失敗しています" }, { status: 400 });
  }

  // tx の詳細取得
  let tx;
  try {
    tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
  } catch {
    return NextResponse.json({ error: "トランザクション詳細の取得に失敗しました" }, { status: 400 });
  }

  // 宛先チェック
  if (!tx.to || tx.to.toLowerCase() !== receiptAddress) {
    return NextResponse.json({
      error: `送金先が正しくありません。正しい会費アドレス: ${receiptAddress}`,
    }, { status: 400 });
  }

  // 送信者がユーザーのウォレットと一致するか
  if (tx.from.toLowerCase() !== user.walletAddress.toLowerCase()) {
    return NextResponse.json({
      error: "送信元ウォレットがあなたの登録ウォレットと一致しません",
    }, { status: 400 });
  }

  // 金額チェック
  if (requiredAmountWei > BigInt(0) && tx.value < requiredAmountWei) {
    return NextResponse.json({
      error: `送金額が不足しています。必要額: ${formatEther(requiredAmountWei)} ETH`,
    }, { status: 400 });
  }

  // ── 会員登録処理 ────────────────────────────────────────────────
  // 有効期限: 支払日から365日
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  const amountWei = tx.value.toString();

  await prisma.$transaction(async (dbTx) => {
    // 支払い履歴記録
    await dbTx.membershipPayment.create({
      data: {
        userId: user.id,
        txHash,
        amountWei,
        chainId,
        fromAddress: tx.from.toLowerCase(),
        status: "confirmed",
        processedAt: new Date(),
      },
    });

    // NetworkMembership upsert
    await dbTx.networkMembership.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        txHash,
        amountWei,
        chainId,
        fromAddress: tx.from.toLowerCase(),
        status: "active",
        validFrom: new Date(),
        validUntil,
      },
      update: {
        txHash,
        amountWei,
        chainId,
        fromAddress: tx.from.toLowerCase(),
        status: "active",
        validFrom: new Date(),
        validUntil,
      },
    });

    // 監査ログ
    await dbTx.auditLog.create({
      data: {
        userId: user.id,
        action: "MEMBERSHIP_PAID",
        entityType: "membership",
        entityId: user.id,
        metadata: { txHash, amountWei, chainId, validUntil: validUntil.toISOString() },
      },
    });

    // タイムラインイベント
    await dbTx.timelineEvent.create({
      data: {
        kind: "MEMBERSHIP_PAID",
        actorId: user.id,
        visibility: "PRIVATE",
        metadata: { txHash, amountWei },
      },
    });

    // 通知
    await dbTx.notification.create({
      data: {
        userId: user.id,
        kind: "MEMBERSHIP_ACTIVATED",
        title: "ネットワーク会費が有効になりました",
        body: `有効期限: ${validUntil.toLocaleDateString("ja-JP")} まで`,
        linkUrl: "/billing",
      },
    });
  });

  return NextResponse.json({
    ok: true,
    validUntil: validUntil.toISOString(),
    amountEth: formatEther(tx.value),
  }, { status: 201 });
}
