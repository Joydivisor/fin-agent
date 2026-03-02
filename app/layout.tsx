import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIN-AGENT | Institutional AI Financial Terminal",
  description: "Next-Generation Multi-Modal AI Financial Analysis Platform — Equity Research, Portfolio Optimization, DCF Valuation, LBO Modeling & Investment Banking Tools.",
  keywords: "financial terminal, AI investing, equity research, DCF, LBO, portfolio optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}