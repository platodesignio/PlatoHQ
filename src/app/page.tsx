import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-violet-400 text-sm font-mono tracking-widest uppercase mb-4">
            AI非依存・完全決定論的
          </p>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Layered Concept Atlas
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            概念を6つの層から多面的に分解・分析するシステム。
            テキストに含まれる概念的構造を可視化します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/analysis"
              className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors"
            >
              テキストを分析する
            </Link>
            <Link
              href="/concepts"
              className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-lg transition-colors"
            >
              概念一覧を見る
            </Link>
          </div>
        </div>
      </section>

      {/* Layer Overview */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-12">6つの概念層</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAYERS.map((layer) => (
              <div
                key={layer.slug}
                className="rounded-xl border border-gray-700 bg-gray-800 p-5 hover:border-violet-500 transition-colors"
              >
                <div className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold mb-3 ${layer.color}`}>
                  {layer.slug.toUpperCase()}
                </div>
                <h3 className="text-white font-semibold mb-1">{layer.name}</h3>
                <p className="text-gray-400 text-sm">{layer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-12">機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="block rounded-xl border border-gray-700 bg-gray-900 p-6 hover:border-violet-500 hover:bg-gray-800 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 text-center text-gray-500 text-sm">
        Layered Concept Atlas — AI非依存・完全決定論的 概念層分解システム
      </footer>
    </main>
  );
}

const LAYERS = [
  { slug: "l0", name: "生成位相", desc: "存在の根源的な発生・創出", color: "bg-purple-900 text-purple-300" },
  { slug: "l1", name: "可能性空間", desc: "選択肢・分岐・確率的構造", color: "bg-cyan-900 text-cyan-300" },
  { slug: "l2", name: "時間因果", desc: "原因・結果・プロセスの連鎖", color: "bg-orange-900 text-orange-300" },
  { slug: "l3", name: "主体心理", desc: "感情・動機・意図・欲望", color: "bg-green-900 text-green-300" },
  { slug: "l4", name: "社会評価", desc: "規範・価値判断・倫理", color: "bg-yellow-900 text-yellow-300" },
  { slug: "l5", name: "制度形式", desc: "法律・手続き・制度的構造", color: "bg-blue-900 text-blue-300" },
];

const FEATURES = [
  {
    icon: "🔬",
    title: "テキスト分析",
    desc: "任意のテキストを6層に分解し、スコア・ハイライト・分解ヒントを表示します。",
    href: "/analysis",
  },
  {
    icon: "📚",
    title: "概念ライブラリ",
    desc: "登録済みの概念を層ごとのテキストとともに閲覧できます。",
    href: "/concepts",
  },
  {
    icon: "⚖️",
    title: "概念比較",
    desc: "複数の概念を並べて層スコアを比較します。",
    href: "/compare",
  },
];
