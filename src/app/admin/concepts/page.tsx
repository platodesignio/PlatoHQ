"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Concept = {
  id: string;
  slug: string;
  titleJa: string;
  isPublished: boolean;
  tags: string[];
  createdAt: string;
};

export default function AdminConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ slug: "", titleJa: "", summary: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const LIMIT = 20;

  function load() {
    setLoading(true);
    fetch(`/api/concepts?page=${page}&limit=${LIMIT}`)
      .then((r) => r.json())
      .then((d) => { setConcepts(d.concepts ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          titleJa: form.titleJa,
          summary: form.summary || undefined,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "作成失敗"); }
      setShowNew(false);
      setForm({ slug: "", titleJa: "", summary: "", tags: "" });
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    await fetch(`/api/concepts/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePublish(concept: Concept) {
    await fetch(`/api/concepts/${concept.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !concept.isPublished }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-violet-400 hover:underline text-sm">← 管理トップ</Link>
            <h1 className="text-2xl font-bold text-white mt-1">概念管理</h1>
            <p className="text-gray-400 text-sm">全 {total} 件</p>
          </div>
          <button
            onClick={() => setShowNew(!showNew)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            + 新規作成
          </button>
        </div>

        {showNew && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="text-white font-semibold">新しい概念</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">スラッグ（英数字・ハイフン）</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">日本語タイトル</label>
                <input value={form.titleJa} onChange={(e) => setForm((f) => ({ ...f, titleJa: e.target.value }))} required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">サマリー（任意）</label>
              <textarea value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} rows={2}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">タグ（カンマ区切り）</label>
              <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="倫理, 哲学, 社会"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors">
                {saving ? "保存中..." : "作成"}
              </button>
              <button type="button" onClick={() => setShowNew(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors">
                キャンセル
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="border border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">タイトル</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">スラッグ</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">タグ</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">公開</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {concepts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="px-4 py-3 text-white text-sm font-medium">{c.titleJa}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{c.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => togglePublish(c)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${c.isPublished ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                        {c.isPublished ? "公開中" : "非公開"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/concepts/${c.id}`}
                          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors">
                          編集
                        </Link>
                        <button onClick={() => handleDelete(c.id, c.titleJa)}
                          className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-xs transition-colors">
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
