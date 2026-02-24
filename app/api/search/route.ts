import { NextResponse } from 'next/server';

const ASSET_DICTIONARY: Record<string, { symbol: string, name: string }> = {
    // --- 贵金属 & 大宗商品 ---
    '黄金': { symbol: 'GC=F', name: 'Gold (黄金期货主连)' },
    '白银': { symbol: 'SI=F', name: 'Silver (白银期货主连)' },
    '原油': { symbol: 'CL=F', name: 'Crude Oil (WTI原油)' },
    '布伦特原油': { symbol: 'BZ=F', name: 'Brent Crude (布伦特原油)' },
    '铜': { symbol: 'HG=F', name: 'Copper (铜期货)' },
    '天然气': { symbol: 'NG=F', name: 'Natural Gas (天然气)' },
    
    // --- 核心宏观指数 ---
    '标普': { symbol: '^GSPC', name: 'S&P 500 (标普500指数)' },
    '标普500': { symbol: '^GSPC', name: 'S&P 500 (标普500指数)' },
    '纳指': { symbol: '^IXIC', name: 'NASDAQ (纳斯达克综合指数)' },
    '纳斯达克': { symbol: '^IXIC', name: 'NASDAQ (纳斯达克综合指数)' },
    '道指': { symbol: '^DJI', name: 'Dow Jones (道琼斯工业指数)' },
    '恐慌指数': { symbol: '^VIX', name: 'VIX (CBOE恐慌指数)' },
    '恒指': { symbol: '^HSI', name: 'Hang Seng (恒生指数)' },
    '上证': { symbol: '000001.SS', name: 'SSE Composite (上证指数)' },
    '深证': { symbol: '399001.SZ', name: 'SZSE Component (深证成指)' },
    '创业板': { symbol: '399006.SZ', name: 'ChiNext (创业板指)' },
    '沪深300': { symbol: '000300.SS', name: 'CSI 300 (沪深300指数)' },
    
    // --- 核心外汇汇率 ---
    '美元人民币': { symbol: 'CNY=X', name: 'USD/CNY (美元兑人民币)' },
    '离岸人民币': { symbol: 'CNH=X', name: 'USD/CNH (美元兑离岸人民币)' },
    '欧元美元': { symbol: 'EURUSD=X', name: 'EUR/USD (欧元兑美元)' },
    '美元日元': { symbol: 'JPY=X', name: 'USD/JPY (美元兑日元)' },
    
    // --- 顶级加密货币 ---
    '比特币': { symbol: 'BTC-USD', name: 'Bitcoin (比特币)' },
    '以太坊': { symbol: 'ETH-USD', name: 'Ethereum (以太坊)' },
    '狗狗币': { symbol: 'DOGE-USD', name: 'Dogecoin (狗狗币)' },
    '索拉纳': { symbol: 'SOL-USD', name: 'Solana (SOL)' }
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q) return NextResponse.json([]);

    let results: any[] = [];
    const lowerQ = q.toLowerCase().trim();

    // 🌟 1. 本地极速字典匹配 (处理宏观、外汇、期货)
    for (const key in ASSET_DICTIONARY) {
        if (key.includes(lowerQ) || lowerQ.includes(key)) {
            results.push(ASSET_DICTIONARY[key]);
        }
    }

    // 🌟 2. 终极杀器：东方财富 (EastMoney) 智能联想 API 
    // 完美支持 A股、港股、美股的中文、拼音缩写和数字代码，且不拦截云端 IP
    try {
        const emToken = 'D43BF722C8E33BDC906FB84D85E326E8'; // 东方财富公共只读 Token
        const emRes = await fetch(`https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(lowerQ)}&type=14&token=${emToken}&count=6`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            cache: 'no-store'
        });
        
        if (emRes.ok) {
            const data = await emRes.json();
            const items = data?.QuotationCodeTable?.Data || [];
            
            const parsedEmResults = items.map((item: any) => {
                let symbol = '';
                let marketName = '';
                
                // 东方财富 MarketType 映射字典: 1=沪市, 2=深市, 3=港股, 4=美股
                if (item.MarketType === '1') {
                    symbol = `${item.Code}.SS`;
                    marketName = '沪股';
                } else if (item.MarketType === '2') {
                    symbol = `${item.Code}.SZ`;
                    marketName = '深股';
                } else if (item.MarketType === '3') {
                    symbol = `${item.Code}.HK`;
                    marketName = '港股';
                } else if (item.MarketType === '4') {
                    symbol = item.Code; // 美股直接用代码
                    marketName = '美股';
                }

                if (symbol) {
                    return { symbol, name: `${item.Name} (${marketName})` };
                }
                return null;
            }).filter(Boolean);

            results = [...results, ...parsedEmResults];
        }
    } catch (e) {
        console.error("EastMoney Search API Error:", e);
    }

    // 🌟 3. 雅虎金融官方 API 兜底 (专门用于弥补东方财富可能搜不到的冷门美股或加密币)
    try {
        const yfRes = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(lowerQ)}&quotesCount=4`, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            cache: 'no-store' 
        });
        
        if (yfRes.ok) {
            const data = await yfRes.json();
            if (data.quotes && data.quotes.length > 0) {
                const yfResults = data.quotes
                    .filter((quote: any) => quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF' || quote.quoteType === 'CRYPTOCURRENCY')
                    .map((quote: any) => ({
                        symbol: quote.symbol,
                        name: quote.shortname || quote.longname || quote.symbol
                    }));
                results = [...results, ...yfResults];
            }
        }
    } catch (e) {
        console.error("Yahoo Search API Error:", e);
    }

    // 🌟 清洗与去重：根据 symbol 过滤掉重复项，保证下拉列表的高级感
    const uniqueResults = Array.from(new Map(results.map(item => [item.symbol, item])).values());
    
    return NextResponse.json(uniqueResults.slice(0, 8));
}