"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Layer = { id: string; slug: string; nameJa: string };
type Rule = {
  id: string; fromLayerId: string; toLayerId: string; pattern: string;
  replacement: string; condition: string | null; priority: number;
  fromLayer: { slug: string; nameJa: string }; toLayer: { slug: string; nameJa: string };
};

export default function AdminMappingRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ fromLayerId: "", toLayerId: "", pattern: "", replacement: "", condition: "", priority: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/mapping-rules").then((r) => r.json()).then(setRules);
  }

  useEffect(() => {
    fetch("/api/layers").then((r) => r.json()).then((ls) => {
      setLayers(ls);
      if (ls.length >= 2) setForm((f) => ({ ...f, fromLayerId: ls[0].id, toLayerId: ls[1].id }));
    });
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/mapping-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromLayerId: form.fromLayerId, toLayerId: form.toLayerId,
          pattern: form.pattern, replacement: form.replacement,
          condition: form.condition || undefined, priority: parseInt(form.priority),
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "作成失敗"); }
      setShowNew(false);
      setForm((f) => ({ ...f, pattern: "", replacement: "", condition: "", priority: "0" }));
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラー");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このルールを削除しますか？")) return;
    await fetch(`/api/mapping-rules/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-violet-400 hover:underline text-sm">← 管理トップ</Link>
            <h1 className="text-2xl font-bold text-white mt-1">マッピングルール管理</h1>
          </div>
          <button onClick={() => setShowNew(!showNew)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors">
            + 新規追加
          </button>
        </div>

        {showNew && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6 space-y-4">
            <h2 className="text-white font-semibold text-sm">新しいマッピングルール</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">変換元の層</label>
                <select value={form.fromLayerId} onChange={(e) => setForm((f) => ({ ...f, fromLayerId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm">
                  {layers.map((l) => <option key={l.id} value={l.id}>{l.slug.toUpperCase()}: {l.nameJa}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">変換先の層</label>
                <select value={form.toLayerId} onChange={(e) => setForm((f) => ({ ...f, toLayerId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm">
                  {layers.map((l) => <option key={l.id} value={l.id}>{l.slug.toUpperCase()}: {l.nameJa}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">パターン（正規表現）</label>
                <input value={form.pattern} onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))} required
                  placeholder="例: 感情|動機"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">置換テキスト</label>
                <input value={form.replacement} onChange={(e) => setForm((f) => ({ ...f, replacement: e.target.value }))} required
                  placeholder="例: 社会的表現"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">条件（任意）</label>
                <input value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                  placeholder="例: score_l3 > 0.5"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">優先度</label>
                <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-violet-500 text-sm" />
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

        <div className="space-y-3">
          {rules.length === 0 ? (
            <p className="text-gray-500 text-center py-10">マッピングルールが登録されていません</p>
          ) : rules.map((r) => (
            <div key={r.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-0.5 bg-violet-900 text-violet-300 rounded text-xs font-mono">{r.fromLayer.slug.toUpperCase()}</span>
                  <span className="text-gray-400 text-xs">→</span>
                  <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-xs font-mono">{r.toLayer.slug.toUpperCase()}</span>
                  <span className="text-gray-500 text-xs">優先度: {r.priority}</span>
                </div>
                <button onClick={() => handleDelete(r.id)}
                  className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-xs transition-colors">
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">パターン</span>
                  <code className="text-gray-200 bg-gray-800 px-2 py-1 rounded text-xs">{r.pattern}</code>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">置換</span>
                  <code className="text-gray-200 bg-gray-800 px-2 py-1 rounded text-xs">{r.replacement}</code>
                </div>
                {r.condition && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">条件</span>
                    <code className="text-yellow-300 bg-gray-800 px-2 py-1 rounded text-xs">{r.condition}</code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
