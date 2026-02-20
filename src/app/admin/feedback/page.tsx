"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Feedback = {
  id: string; rating: number; comment: string | null; createdAt: string;
  user: { name: string | null; email: string } | null;
  run: { id: string } | null;
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    fetch(`/api/feedback?page=${page}&limit=${LIMIT}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.feedbacks ?? []); setTotal(d.total ?? 0); });
  }, [page]);

  const avgRating = items.length ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : "-";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/admin" className="text-violet-400 hover:underline text-sm">← 管理トップ</Link>
        <div className="flex items-center justify-between mt-1 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">フィードバック</h1>
            <p className="text-gray-400 text-sm">全 {total} 件 / 平均評価 ⭐ {avgRating}</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-10">フィードバックがありません</p>
          ) : items.map((f) => (
            <div key={f.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < f.rating ? "text-yellow-400" : "text-gray-600"}>★</span>
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">
                    {f.user ? (f.user.name ?? f.user.email) : "匿名"}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">{new Date(f.createdAt).toLocaleString("ja-JP")}</span>
              </div>
              {f.comment && <p className="text-gray-300 text-sm">{f.comment}</p>}
              {f.run && <p className="text-gray-500 text-xs mt-2">Run: {f.run.id}</p>}
            </div>
          ))}
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
