"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuditLog = {
  id: string; action: string; entityType: string; entityId: string;
  diff: unknown; createdAt: string;
  user: { name: string | null; email: string } | null;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 30;

  useEffect(() => {
    fetch(`/api/audit?page=${page}&limit=${LIMIT}`)
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs ?? []); setTotal(d.total ?? 0); });
  }, [page]);

  const ACTION_COLORS: Record<string, string> = {
    create: "bg-green-900 text-green-300",
    update: "bg-blue-900 text-blue-300",
    delete: "bg-red-900 text-red-300",
    patch: "bg-yellow-900 text-yellow-300",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/admin" className="text-violet-400 hover:underline text-sm">← 管理トップ</Link>
        <div className="mt-1 mb-8">
          <h1 className="text-2xl font-bold text-white">監査ログ</h1>
          <p className="text-gray-400 text-sm">全 {total} 件</p>
        </div>

        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">日時</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">操作</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">対象</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">ユーザー</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">ログがありません</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${ACTION_COLORS[log.action] ?? "bg-gray-700 text-gray-300"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-xs">{log.entityType}</span>
                    <span className="text-gray-500 text-xs ml-2 font-mono">{log.entityId.slice(0, 8)}...</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {log.user ? (log.user.name ?? log.user.email) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {Math.ceil(total / LIMIT) > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-sm transition-colors">前へ</button>
            <span className="px-4 py-2 text-gray-400 text-sm">{page} / {Math.ceil(total / LIMIT)}</span>
            <button onClick={() => setPage((p) => Math.min(Math.ceil(total / LIMIT), p + 1))} disabled={page === Math.ceil(total / LIMIT)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 rounded-lg text-sm transition-colors">次へ</button>
          </div>
        )}
      </div>
    </div>
  );
}
