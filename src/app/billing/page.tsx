"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import Link from "next/link";

interface PaymentInfo {
  receiptAddress: string;
  requiredAmountEth: string | null;
  chainId: number;
  chainName: string;
}

interface MembershipData {
  status: string;
  validUntil: string;
  validFrom: string;
  txHash: string;
  amountEth: string;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const { address, isConnected, chainId } = useAccount();

  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // wagmi — ETH送金
  const { data: txHash, sendTransaction, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const fetchStatus = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/membership/status");
      const d = await res.json();
      setMembership(d.membership);
      setPaymentInfo(d.paymentInfo);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // txHash確定 → サーバーに報告して会員登録
  useEffect(() => {
    if (!isConfirmed || !txHash) return;
    (async () => {
      setSubmitting(true);
      setError("");
      try {
        const res = await fetch("/api/membership/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash, chainId: chainId ?? 8453 }),
        });
        const d = await res.json();
        if (!res.ok) {
          setError(d.error ?? "登録に失敗しました");
        } else {
          setSuccess(`会員登録が完了しました。有効期限: ${new Date(d.validUntil).toLocaleDateString("ja-JP")}`);
          await fetchStatus();
        }
      } catch {
        setError("サーバーへの接続に失敗しました");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [isConfirmed, txHash, chainId, fetchStatus]);

  const handlePay = () => {
    if (!paymentInfo?.receiptAddress) return;
    setError("");
    const amountEth = paymentInfo.requiredAmountEth ?? "0.01";
    sendTransaction({
      to: paymentInfo.receiptAddress as `0x${string}`,
      value: parseEther(amountEth),
    });
  };

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <p className="text-sm">ログインが必要です。</p>
      </div>
    );
  }

  const isActive = membership?.status === "active";
  const isExpired = membership?.status === "expired";
  const wrongChain = isConnected && chainId !== 8453;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">ネットワーク会費</h1>

      {/* 現在のステータス */}
      <div className="border border-black p-4 mb-6">
        <h2 className="font-bold mb-3">会員ステータス</h2>
        {loading ? (
          <p className="text-sm text-gray-400">読み込み中...</p>
        ) : isActive ? (
          <div className="text-sm space-y-1">
            <p>ステータス: <strong className="text-black">有効</strong></p>
            <p>有効期限: <strong>{new Date(membership!.validUntil).toLocaleDateString("ja-JP")}</strong></p>
            <p>支払額: {membership!.amountEth} ETH</p>
            <p className="text-xs text-gray-400 mt-1">
              Tx:{" "}
              <a
                href={`https://basescan.org/tx/${membership!.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {membership!.txHash.slice(0, 10)}…
              </a>
            </p>
          </div>
        ) : isExpired ? (
          <p className="text-sm text-red-600">期限切れ — 再度支払いが必要です</p>
        ) : (
          <p className="text-sm text-gray-500">未加入</p>
        )}
      </div>

      {/* 支払いセクション */}
      {!isActive && (
        <div className="border border-black p-4 mb-6">
          <h2 className="font-bold mb-3">会費を支払う（MetaMask / Base Mainnet）</h2>

          {paymentInfo && (
            <div className="text-sm space-y-1 mb-4">
              <p>ネットワーク: <strong>Base Mainnet</strong> (chainId=8453)</p>
              <p>送金先:
                <code className="ml-1 text-xs bg-gray-100 px-1 py-0.5 break-all">
                  {paymentInfo.receiptAddress || "（管理者未設定）"}
                </code>
              </p>
              {paymentInfo.requiredAmountEth && (
                <p>必要金額: <strong>{paymentInfo.requiredAmountEth} ETH</strong></p>
              )}
              <p className="text-xs text-gray-400">有効期間: 1年間</p>
            </div>
          )}

          {!isConnected ? (
            <div className="text-sm">
              <p className="text-gray-500 mb-2">ウォレットを接続してください。</p>
              <Link href="/wallet" className="no-underline bg-black text-white px-3 py-1 text-sm inline-block">
                ウォレット接続 →
              </Link>
            </div>
          ) : wrongChain ? (
            <div className="text-sm text-red-600">
              <p>Base Mainnet (chainId=8453) に切り替えてください。</p>
              <p className="text-xs mt-1">現在: chainId={chainId}</p>
            </div>
          ) : !paymentInfo?.receiptAddress ? (
            <p className="text-sm text-gray-400">管理者が会費アドレスを設定中です。</p>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                接続中: <code>{address?.slice(0, 6)}…{address?.slice(-4)}</code>
              </p>

              {isSending || isConfirming || submitting ? (
                <div className="text-sm text-gray-600">
                  {isSending && "MetaMask で承認してください…"}
                  {isConfirming && "Base Mainnet で確認中…"}
                  {submitting && "会員登録処理中…"}
                </div>
              ) : (
                <button
                  onClick={handlePay}
                  disabled={!paymentInfo.receiptAddress}
                  className="bg-black text-white px-4 py-2 text-sm disabled:opacity-40"
                >
                  MetaMask で支払う（{paymentInfo.requiredAmountEth ?? "??"} ETH）
                </button>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-700">{success}</p>}
        </div>
      )}

      {/* 説明 */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>会費はネットワーク運営費として使われます。収益分配・利回りは提供しません。</p>
        <p>支払い完了後、自動的に会員ステータスが有効になります。</p>
        <p>有効期間は支払日から1年間です。</p>
      </div>
    </div>
  );
}
