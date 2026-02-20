"use client";

import Link from "next/link";

const ADMIN_LINKS = [
  { href: "/admin/concepts", label: "概念管理", desc: "概念の作成・編集・削除・公開管理", icon: "📝" },
  { href: "/admin/dictionary", label: "辞書管理", desc: "層ごとのキーワード辞書を管理", icon: "📖" },
  { href: "/admin/mapping-rules", label: "マッピングルール", desc: "層間の写像ルールを管理", icon: "🔀" },
  { href: "/admin/feedback", label: "フィードバック", desc: "ユーザーからのフィードバック一覧", icon: "💬" },
  { href: "/admin/audit", label: "監査ログ", desc: "概念変更の履歴を確認", icon: "🔍" },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">管理ダッシュボード</h1>
        <p className="text-gray-400 mb-10">Layered Concept Atlas の管理機能</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ADMIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex gap-4 items-start bg-gray-900 border border-gray-700 hover:border-violet-500 rounded-xl p-6 transition-colors"
            >
              <span className="text-3xl">{link.icon}</span>
              <div>
                <h2 className="text-white font-semibold">{link.label}</h2>
                <p className="text-gray-400 text-sm mt-1">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
