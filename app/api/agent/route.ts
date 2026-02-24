import { NextResponse } from 'next/server';

export const maxDuration = 60; 

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, history = [], context = {}, mode = 'chat', provider = 'zhipu', userProfile = '', useThinking = true } = body;

        const currentRealTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

        let systemPrompt = `你是一个名为 FIN-AGENT 的多模态 AI 金融终端核心。
你的语气应该极其专业、冰冷、精准，像一个华尔街的高级量化分析师。
【重要系统时间注入】：当前真实世界的系统时间是 ${currentRealTime}。请在所有的分析、预测和判断中，严格以此时间为基准！绝不能说错当前年份或日期！
`;

        if (userProfile) {
            systemPrompt += `\n【用户专属身份档案】：\n${userProfile}\n请在回答时迎合该用户的投资风格和偏好。`;
        }

        // 🌟 核心修复：强制 AI 根据【纯标题】进行推演，禁止回答“无正文”
        if (mode === 'stock_chat' && context.symbol) {
            systemPrompt += `\n【当前上下文】：用户正在查看 ${context.symbol}，当前价格为 ${context.price}。请围绕该标的进行深度解答。`;
        } else if (mode === 'tactical' && context.news) {
            systemPrompt += `\n【核心任务】：用户传入了一篇新闻。注意：因系统风控，你目前只拿到了新闻的【标题】（${context.news.title}）和【来源】（${context.news.source || '未知'}）。\n绝不允许因为缺乏新闻正文而拒绝回答！你必须凭借你强大的全球金融知识库，直接基于该【标题】推演该事件对产业链、大盘及相关个股的战术影响，给出机构级的盘面推演。`;
        } else if (mode === 'translation' && context.news) {
            systemPrompt += `\n【核心任务】：用户请求阅读并解析一篇新闻。注意：你目前只拿到了新闻的【标题】（${context.news.title}）。\n绝不允许回答“无具体内容可摘要或翻译”！你必须直接翻译该标题，并以专业分析师的口吻，凭借该标题的信息拓展延伸，深度剖析该事件对行业的深远影响和潜在的投资机会。`;
        } else if (mode === 'weekly_report') {
            systemPrompt += `\n【任务】：生成本周投资周报。用户的自选股列表为：${context.watchlist}。请结合本周全球宏观经济数据，给出下一周的建仓和避险建议。`;
        }

        // 🌟 极速模式的硬核约束
        if (!useThinking) {
            systemPrompt += `\n【紧急指令】：用户当前开启了【极速模式】！绝对禁止输出任何思考过程或内心戏，请用最精炼的语言直接输出最终结论，越快越好。`;
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
            // 🌟 真实的心智切换：思考模式用 R1 引擎，极速模式直接切换为 V3 对话引擎！
            model = useThinking ? 'deepseek-reasoner' : 'deepseek-chat'; 
        } else {
            apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
            apiKey = process.env.ZHIPU_API_KEY || '';
            model = 'glm-4-plus'; 
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
                max_tokens: 8192, 
                temperature: 0.6
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`API 请求失败: ${res.status} ${errorText}`);
        }

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
                                    
                                    if (reasoning) {
                                        controller.enqueue(new TextEncoder().encode(`> **🧠 深度思考中...**\n${reasoning}\n\n---\n\n`));
                                    }
                                    if (content) {
                                        controller.enqueue(new TextEncoder().encode(content));
                                    }
                                } catch (e) {}
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