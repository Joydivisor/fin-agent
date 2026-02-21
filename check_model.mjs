import { GoogleGenerativeAI } from "@google/generative-ai";
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import path from 'path';

// 1. 读取 .env.local 里的 Key
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envFile.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
  console.error("❌ 没找到 Key，请检查 .env.local");
  process.exit(1);
}

// 2. 配置代理 (和 route.ts 一样)
const proxyUrl = 'http://127.0.0.1:7890';
const agent = new HttpsProxyAgent(proxyUrl);

console.log(`🔍 正在通过代理 ${proxyUrl} 查询可用模型...`);

async function listModels() {
  try {
    // 直接用 fetch 请求列表
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { agent: agent }
    );

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log("\n✅ 你的 API Key 支持以下模型 (请复制粗体部分的 ID):");
    console.log("===================================================");
    
    // 过滤出生成式模型
    const models = data.models || [];
    const chatModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    
    chatModels.forEach(m => {
      // 提取纯 ID (去掉 models/ 前缀)
      const id = m.name.replace('models/', '');
      console.log(`📦 名称: ${m.displayName}`);
      console.log(`🔑 ID:   ${id}`); // <--- 这一行是你需要的！
      console.log("---------------------------------------------------");
    });

    if (chatModels.length === 0) {
      console.log("⚠️ 奇怪，没有找到支持聊天的模型。");
    }

  } catch (error) {
    console.error("❌ 查询失败:", error.message);
    console.error("原因可能是：1. 代理不通 2. Key 无效");
  }
}

listModels();