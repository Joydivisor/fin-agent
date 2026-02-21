import type { Metadata } from "next";
import "./globals.css";

// 设置网页的标题和描述
export const metadata: Metadata = {
  title: "FinAgent - 散户金融脱水机",
  description: "基于 Gemini 的实时金融信息降噪工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      {/* 移除了字体变量，直接使用系统的 antialiased 抗锯齿渲染 */}
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}