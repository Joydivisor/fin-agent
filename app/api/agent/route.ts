import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

export const maxDuration = 60; 

const PROXY_URL = process.env.PROXY_URL; 
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const ZHIPU_KEY = process.env.ZHIPU_API_KEY; 

const agent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined;

function returnErrorStream(msg: string) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`⚠️ 系统提示: ${msg}`));
        controller.close();
      }
    });
    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

async function fetchFullArticle(url: string) {
  if (!url) return null;
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(jinaUrl, {
        headers: { 'X-Return-Format': 'markdown', 'User-Agent': 'Mozilla/5.0' },
        agent: agent, 
        timeout: 8000 
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.length < 100 || text.includes("Access Denied")) return null;
    return text;
  } catch (e) { 
    return null; 
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], context, mode, provider = 'zhipu', userProfile, chatArchives = [] } = body; 

    let openai: OpenAI;
    let modelName = '';
    let isReasoningModel = false;
    
    const isFastPath = (mode === 'translation' || mode === 'tactical');
    // 🌟 将周报加入深度思考轨道
    const isDeepPath = (mode === 'translation_deep' || mode === 'tactical_deep' || mode === 'weekly_report');

    if (provider === 'zhipu') {
        if (!ZHIPU_KEY) return returnErrorStream("未检测到 ZHIPU_API_KEY，请在后台环境变量中配置。");
        openai = new OpenAI({ apiKey: ZHIPU_KEY, baseURL: 'https://open.bigmodel.cn/api/paas/v4/' });
        modelName = 'glm-5'; 
        isReasoningModel = !isFastPath; 
    } else if (provider === 'deepseek') {
        if (!DEEPSEEK_KEY) return returnErrorStream("未检测到 DEEPSEEK_API_KEY，请在后台环境变量中配置。");
        openai = new OpenAI({ apiKey: DEEPSEEK_KEY, baseURL: 'https://api.deepseek.com' });
        modelName = isFastPath ? 'deepseek-chat' : 'deepseek-reasoner'; 
        isReasoningModel = modelName === 'deepseek-reasoner';
    } else {
        if (!GEMINI_KEY) return returnErrorStream("未检测到 GEMINI_API_KEY，请在后台环境变量中配置。");
        openai = new OpenAI({ apiKey: GEMINI_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/', httpAgent: agent });
        modelName = isFastPath ? 'gemini-1.5-flash' : 'gemini-1.5-pro'; 
        isReasoningModel = !isFastPath;
    }

    let systemPrompt = "";
    let userContent = "";
    let temperature = isReasoningModel ? 0.7 : 0.2; 

    // 🌟 新增：智能周报处理逻辑
    if (mode === 'weekly_report') {
        const dynamicTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        systemPrompt = `身份：FIN-AGENT 首席智能投资顾问。时间：${dynamicTime}。
任务：根据用户提供的【历史记忆档案】和【自选股列表】，生成一份专属的《本周财经周报与战术推演》。
包含板块：
1. 🔍 核心关注点复盘（结合记忆库分析用户的投资偏好与焦虑点）。
2. 📊 资产异动与宏观市场洞察。
3. 💡 下周战术推演与操作建议。
风格：专业、数据驱动、有深度。使用清晰的 Markdown 排版。`;
        const archiveContext = chatArchives.length > 0 ? chatArchives.map((a:any) => `- ${a.date}: ${a.title}`).join('\n') : "本周暂无深度对话记录。";
        userContent = `【历史记忆档案】\n${archiveContext}\n\n【用户自选股】\n${context?.watchlist || '暂无'}\n\n【用户设定偏好】\n${userProfile || '未设置'}`;
    }
    // 其他原有的处理逻辑
    else if (mode.includes('tactical')) {
        let fullArticleText = (!isDeepPath && context?.news?.link) ? await fetchFullArticle(context.news.link) : null;
        systemPrompt = isDeepPath 
            ? `身份：华尔街资深量化策略师。\n任务：基于初步分析，启动深度博弈论推演、隐藏风险拆解及主力资金意图探测。`
            : `身份：华尔街策略师。\n任务：快速总结此新闻对标的资产的直接影响。保持冷峻简练。`;
        const content = fullArticleText || `标题：${context.news.title}`;
        userContent = `目标标的：${context.symbol || "宏观市场"}\n情报内容：\n${content}\n\n${message || ''}`;
    } 
    else if (mode.includes('translation')) {
        let fullArticleText = (!isDeepPath && context?.news?.link) ? await fetchFullArticle(context.news.link) : null;
        systemPrompt = isDeepPath
            ? `身份：资深行业研究员。\n任务：跳出字面翻译，深度剖析该事件对全球宏观或行业生态的深远影响。`
            : `身份：金融情报官。任务：极速提炼核心逻辑。输出：1.中文核心标题 2.三句执行摘要(Bullet Points)。`;
        const content = fullArticleText || `标题：${context.news.title}`;
        userContent = `原文：\n${content}\n\n${message || ''}`;
    } 
    else {
        const dynamicTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const tickerContext = context?.symbol ? `用户聚焦资产: ${context.symbol} (最新现价: ${context.price})。` : `全局宏观工作台。`;
        const memoryContext = userProfile ? `\n【用户专属偏好】\n${userProfile}` : "";
        const archiveContext = chatArchives.length > 0 ? `\n【历史记忆摘要】\n${chatArchives.map((a:any) => `- ${a.title}`).join('\n')}` : "";

        systemPrompt = `你是 FIN-AGENT。引擎: ${modelName}。
【全局上下文】
时间: ${dynamicTime}
状态: ${tickerContext}${memoryContext}${archiveContext}
【准则】专业、极简、数据驱动。结合历史记忆提供连贯顾问服务。`;
        userContent = message;
    }

    const messagesPayload: any[] = [{ role: "system", content: systemPrompt }];
    if (history && history.length > 0) messagesPayload.push(...history);
    messagesPayload.push({ role: "user", content: userContent });

    const requestPayload: any = {
      messages: messagesPayload,
      model: modelName, 
      stream: true, 
      temperature: temperature,
      max_tokens: 8000, 
    };

    if (provider === 'zhipu' && isReasoningModel) {
        requestPayload.thinking = { type: "enabled" }; 
    }

    const completion = await openai.chat.completions.create(requestPayload);

    const stream = new ReadableStream({
      async start(controller) {
        let hasStartedThinking = false;
        let hasFinishedThinking = false;

        for await (const chunk of completion) {
          const delta: any = chunk.choices[0]?.delta || {};
          const reasoningContent = delta.reasoning_content || ''; 
          const content = delta.content || '';

          if (reasoningContent) {
             if (!hasStartedThinking) {
                 hasStartedThinking = true;
                 controller.enqueue(new TextEncoder().encode("> **🧠 深度思考中...**\n> \n> "));
             }
             const formattedReasoning = reasoningContent.replace(/\n/g, '\n> ');
             controller.enqueue(new TextEncoder().encode(formattedReasoning));
          }
          if (content) {
             if (hasStartedThinking && !hasFinishedThinking) {
                 hasFinishedThinking = true;
                 controller.enqueue(new TextEncoder().encode("\n\n---\n\n"));
             }
             controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (error: any) {
    if (error.message?.includes('abort')) {
        return returnErrorStream("生成已由用户手动停止。");
    }
    return returnErrorStream(error.message);
  }
}