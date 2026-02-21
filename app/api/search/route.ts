import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import YahooFinance from 'yahoo-finance2'; // 1. 导入类

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || q.length < 1) return NextResponse.json([]);
  
  // 2. 实例化 (关键修复)
  const yf = new (YahooFinance as any)();

  try {
    const agent = new HttpsProxyAgent('http://127.0.0.1:7890');
    
    // 3. 使用实例调用 search
    const searchResults = await yf.search(q, {}, { fetchOptions: { agent } });
    
    const formatted = searchResults.quotes
      .filter((item: any) => item.symbol)
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.shortname || item.longname || item.symbol,
        exch: item.exchDisp,
        type: item.quoteType
      }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([]);
  }
}