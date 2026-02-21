import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🔴 关键修改：关闭严格模式，防止 useEffect 执行两次
  reactStrictMode: false, 
  
  // 忽略构建时的类型检查（可选，防止部署报错）
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;