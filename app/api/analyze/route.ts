import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { marketData, config } = await req.json();

    // 1. 验证用户输入的配置（边界条件检查）
    if (!config || !config.apiKey || !config.baseUrl) {
      return NextResponse.json({ error: "API 配置不完整" }, { status: 400 });
    }

    // 2. 格式化上下文 (保持不变)
    const contextText = marketData.map((item: any) => {
      return `【${item.name}】: ${item.price} (${item.change}), 新闻: ${item.news?.join(';')}`;
    }).join('\n');

    // 3. 调用“用户自定义”的接口
    // 大部分现代 AI (DeepSeek, OpenAI, Anthropic, Gemini-OpenAI-Adapter) 都兼容这个格式
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: "你是一个金融脱水专家，请输出 HTML 格式的简评。" },
          { role: "user", content: `请分析：\n${contextText}` }
        ]
      })
    });

    const data = await response.json();
    return NextResponse.json({ content: data.choices[0].message.content });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}