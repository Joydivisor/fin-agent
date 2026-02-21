import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import YahooFinance from 'yahoo-finance2';

export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolsStr = searchParams.get('symbols') || '000001.SS,AAPL,BTC-USD,GC=F';
  const symbols = symbolsStr.split(',').filter(s => s.trim() !== '');

  const yf = new (YahooFinance as any)();

  try {
    // 替换为你的代理地址，如果没有请注释掉
    const agent = new HttpsProxyAgent('http://127.0.0.1:7890');
    
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote = await yf.quote(symbol, {}, { fetchOptions: { agent } });
          
          // 获取迷你走势图 (Sparkline) - 取最近1天数据
          // 注意：为了速度，这里我们不取大量历史数据，前端可以用简单的昨收和现价画直线，
          // 或者如果需要精确 sparkline，可以使用 yf.chart(symbol, {range: '1d', interval: '15m'})
          // 这里为了响应速度，我们只返回基础 Quote，详情页再加载大图。
          
          return {
            symbol: symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice,
            prevClose: quote.regularMarketPreviousClose,
            change: quote.regularMarketChangePercent,
            isUp: (quote.regularMarketChangePercent || 0) >= 0,
            market: quote.fullExchangeName,
          };
        } catch (e) {
          console.error(`Fetch error for ${symbol}:`, e);
          return null;
        }
      })
    );

    return NextResponse.json(results.filter(r => r !== null));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}