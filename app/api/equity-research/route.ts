import { NextResponse } from 'next/server';
import { ResearchEngine } from '../../lib/research-engine';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { symbol, companyName, currentPrice, marketCap, sector, financials, rawDocumentText, reportType = 'full_report', provider = 'zhipu', useThinking = true } = body;

        // 1. Generate structured report data
        const reportStructure = ResearchEngine.generateReportStructure({
            symbol,
            companyName,
            currentPrice,
            marketCap,
            sector,
            financials,
            rawDocumentText,
            reportType
        });

        // 2. For guidance extraction, return structured data directly
        if (reportType === 'guidance_extract' && rawDocumentText) {
            const guidance = ResearchEngine.extractGuidance(rawDocumentText);
            return NextResponse.json({
                success: true,
                type: 'guidance_extract',
                result: {
                    guidance,
                    reportStructure
                }
            });
        }

        // 3. For full report, stream AI-generated content
        const prompt = ResearchEngine.buildResearchPrompt(reportStructure);
        const currentRealTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

        const systemPrompt = `你是一个顶级投行的高级股票研究分析师（Senior Equity Research Analyst）。
你的报告将直接呈递给机构投资者的投资委员会（IC）。
【系统时间】：${currentRealTime}
请用极其专业、严谨、有深度的语言撰写，引用具体财务数据支撑每一个论点。
${!useThinking ? '【紧急指令】：极速模式！省略思考过程，直接输出最终报告。' : ''}`;

        let apiUrl = '';
        let apiKey = '';
        let model = '';

        if (provider === 'deepseek') {
            apiUrl = 'https://api.deepseek.com/v1/chat/completions';
            apiKey = process.env.DEEPSEEK_API_KEY || '';
            model = useThinking ? 'deepseek-reasoner' : 'deepseek-chat';
        } else {
            apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
            apiKey = process.env.ZHIPU_API_KEY || '';
            model = 'glm-4-plus';
        }

        if (!apiKey) {
            // Return structured data only (no AI generation)
            return NextResponse.json({
                success: true,
                type: reportType,
                result: reportStructure,
                note: 'AI API key not configured — returning structured data only.'
            });
        }

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                stream: true,
                max_tokens: 8192,
                temperature: 0.4
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`AI API failed: ${res.status} ${errorText}`);
        }

        // Stream the response
        const stream = new ReadableStream({
            async start(controller) {
                const reader = res.body?.getReader();
                if (!reader) { controller.close(); return; }
                const decoder = new TextDecoder();

                // Prepend structured metadata as JSON header
                const metaHeader = `<!--REPORT_META:${JSON.stringify({
                    symbol: reportStructure.symbol,
                    rating: reportStructure.rating,
                    priceTarget: reportStructure.priceTarget,
                    upside: reportStructure.upside,
                    guidanceItems: reportStructure.guidanceItems,
                    riskFactors: reportStructure.riskFactors.length
                })}-->\n\n`;
                controller.enqueue(new TextEncoder().encode(metaHeader));

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
                                    if (reasoning) controller.enqueue(new TextEncoder().encode(`> **🧠 深度思考中...**\n${reasoning}\n\n---\n\n`));
                                    if (content) controller.enqueue(new TextEncoder().encode(content));
                                } catch (e) { }
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
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
        });

    } catch (error: any) {
        console.error('Equity Research API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
