"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Layer = { id: string; slug: string; nameJa: string };
type Term = { id: string; layerId: string; term: string; weight: number; isNegation: boolean; layer: { slug: string; nameJa: string } };

export default function AdminDictionaryPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [filterLayerId, setFilterLayerId] = useState("");
  const [form, setForm] = useState({ layerId: "", term: "", weight: "1", isNegation: false });
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    const url = filterLayerId ? `/api/dictionary?layerId=${filterLayerId}` : "/api/dictionary";
    fetch(url).then((r) => r.json()).then(setTerms);
  }

  useEffect(() => {
    fetch("/api/layers").then((r) => r.json()).then((ls) => {
      setLayers(ls);
      if (ls.length > 0) setForm((f) => ({ ...f, layerId: ls[0].id }));
    });
  }, []);

  useEffect(() => { load(); }, [filterLayerId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layerId: form.layerId, term: form.term, weight: parseFloat(form.weight), isNegation: form.isNegation }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "作成失敗"); }
      setShowNew(false);
      setForm((f) => ({ ...f, term: "", weight: "1", isNegation: false }));
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, term: string) {
    if (!confirm(`「${term}」を削除しますか？`)) return;
    await fetch(`/api/dictionary/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-violet-400 hover:underline text-sm">← 管理トップ</Link>
            <h1 className="text-2xl font-bold text-white mt-1">辞書管理</h1>
          </div>
          <button onClick={() => setShowNew(!showNew)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors">
            + 新規追加
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterLayerId("")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filterLayerId ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
            すべて
          </button>
          {layers.map((l) => (
            <button key={l.id} onClick={() => setFilterLayerId(l.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterLayerId === l.id ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
              {l.slug.toUpperCase()}: {l.nameJa}
            </button>
          ))}
        </div>

        {showNew && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 space-y-4">
            <h2 className="text-white font-semibold text-sm">新しい辞書用語</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">層</label>
                <select value={form.layerId} onChange={(e) => setForm((f) => ({ ...f, layerId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm">
                  {layers.map((l) => <option key={l.id} value={l.id}>{l.slug.toUpperCase()}: {l.nameJa}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">用語</label>
                <input value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))} required
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">重み（0.1〜3.0）</label>
                <input type="number" step="0.1" min="0.1" max="3" value={form.weight}
                  onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" checked={form.isNegation} onChange={(e) => setForm((f) => ({ ...f, isNegation: e.target.checked }))}
                    className="w-4 h-4 accent-violet-600" />
                  <span className="text-sm text-gray-300">否定語として扱う</span>
                </label>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors">
                {saving ? "保存中..." : "追加"}
              </button>
              <button type="button" onClick={() => setShowNew(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs transition-colors">
                キャンセル
              </button>
            </div>
          </form>
        )}

        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">用語</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">層</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">重み</th>
                <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">否定語</th>
                <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {terms.map((t) => (
                <tr key={t.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-mono">{t.term}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-violet-900 text-violet-300 rounded text-xs font-mono">
                      {t.layer.slug.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{t.weight}</td>
                  <td className="px-4 py-3 text-sm">{t.isNegation ? <span className="text-red-400">否定</span> : <span className="text-gray-500">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(t.id, t.term)}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-xs transition-colors">
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
