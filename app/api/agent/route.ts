import { NextResponse } from 'next/server';

// 🌟 强行告诉 Vercel：允许这个函数运行最长的时间，防止大模型思考太久被掐断线
export const maxDuration = 10; 

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, history = [], context = {}, mode = 'chat', provider = 'zhipu', userProfile = '' } = body;

        // 获取真实的当前时间（东八区北京时间）作为时间锚点
        const currentRealTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

        let systemPrompt = `你是一个名为 FIN-AGENT 的多模态 AI 金融终端核心。
你的语气应该极其专业、冰冷、精准，像一个华尔街的高级量化分析师。
【重要系统时间注入】：当前真实世界的系统时间是 ${currentRealTime}。请在所有的分析、预测和判断中，严格以此时间为基准！绝不能说错当前年份或日期！
`;

        if (userProfile) {
            systemPrompt += `\n【用户专属身份档案】：\n${userProfile}\n请在回答时迎合该用户的投资风格和偏好。`;
        }

        if (mode === 'stock_chat' && context.symbol) {
            systemPrompt += `\n【当前上下文】：用户正在查看 ${context.symbol}，当前价格为 ${context.price}。请围绕该标的进行深度解答。`;
        } else if (mode === 'tactical' && context.news) {
            systemPrompt += `\n【任务】：用户传入了一篇新闻情报，请给出极具战术指导意义的机构级盘面推演。新闻标题：${context.news.title}`;
        } else if (mode === 'weekly_report') {
            systemPrompt += `\n【任务】：生成本周投资周报。用户的自选股列表为：${context.watchlist}。请结合本周全球宏观经济数据，给出下一周的建仓和避险建议。`;
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map((m: any) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];

        let apiUrl = '';
        let apiKey = '';
        let model = '';

        if (provider === 'deepseek') {
            apiUrl = 'https://api.deepseek.com/v1/chat/completions';
            apiKey = process.env.DEEPSEEK_API_KEY || '';
            model = 'deepseek-reasoner'; // 使用 R1 推理模型
        } else {
            apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
            apiKey = process.env.ZHIPU_API_KEY || '';
            model = 'glm-4-plus'; // 使用智谱最新模型
        }

        if (!apiKey) {
            throw new Error(`系统未检测到 ${provider.toUpperCase()}_API_KEY，请在 Vercel 环境变量中配置。`);
        }

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true,
                // 🌟 核心修复 2：将大模型允许输出的最大字数拉满，防止中途断气！
                max_tokens: 8192, 
                temperature: 0.6
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`API 请求失败: ${res.status} ${errorText}`);
        }

        // 极简且安全的流式转发
        const stream = new ReadableStream({
            async start(controller) {
                const reader = res.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }
                const decoder = new TextDecoder();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split('\n').filter(line => line.trim() !== '');
                        
                        for (const line of lines) {
                            if (line === 'data: [DONE]') continue;
                            if (line.startsWith('data: ')) {
                                try {
                                    const parsed = JSON.parse(line.slice(6));
                                    const content = parsed.choices[0]?.delta?.content || '';
                                    const reasoning = parsed.choices[0]?.delta?.reasoning_content || '';
                                    
                                    // 完美兼容深度思考标签
                                    if (reasoning) {
                                        controller.enqueue(new TextEncoder().encode(`> **🧠 深度思考中...**\n${reasoning}\n\n---\n\n`));
                                    }
                                    if (content) {
                                        controller.enqueue(new TextEncoder().encode(content));
                                    }
                                } catch (e) {
                                    // 忽略解析失败的脏数据块
                                }
                            }
                        }
                    }
                } finally {
                    controller.close();
                    reader.releaseLock();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error: any) {
        console.error("Agent Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}