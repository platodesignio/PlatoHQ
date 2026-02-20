import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Layered Concept Atlas",
  description: "概念の多層構造を可視化・分析するツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
