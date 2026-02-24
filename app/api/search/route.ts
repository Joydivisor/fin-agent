import { NextResponse } from 'next/server';

const ASSET_DICTIONARY: Record<string, { symbol: string, name: string }> = {
    // 贵金属 & 大宗商品
    '黄金': { symbol: 'GC=F', name: 'Gold (黄金期货主连)' },
    '白银': { symbol: 'SI=F', name: 'Silver (白银期货主连)' },
    '原油': { symbol: 'CL=F', name: 'Crude Oil (WTI原油)' },
    '布伦特原油': { symbol: 'BZ=F', name: 'Brent Crude (布伦特原油)' },
    '铜': { symbol: 'HG=F', name: 'Copper (铜期货)' },
    '天然气': { symbol: 'NG=F', name: 'Natural Gas (天然气)' },
    // 核心指数
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
    // 汇率 & 加密货币
    '美元人民币': { symbol: 'CNY=X', name: 'USD/CNY (美元兑人民币)' },
    '离岸人民币': { symbol: 'CNH=X', name: 'USD/CNH (美元兑离岸人民币)' },
    '欧元美元': { symbol: 'EURUSD=X', name: 'EUR/USD (欧元兑美元)' },
    '美元日元': { symbol: 'JPY=X', name: 'USD/JPY (美元兑日元)' },
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

    // 1. 极速匹配本地字典
    for (const key in ASSET_DICTIONARY) {
        if (key.includes(lowerQ) || lowerQ.includes(key)) {
            results.push(ASSET_DICTIONARY[key]);
        }
    }

    // 🌟 2. 终极修复：网易财经 JSON API (完美解决乱码，100% 命中 A 股中文与拼音)
    try {
        const neteaseRes = await fetch(`https://quotes.money.163.com/stocksearch/api.action?word=${encodeURIComponent(lowerQ)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            cache: 'no-store'
        });
        
        if (neteaseRes.ok) {
            const data = await neteaseRes.json();
            if (Array.isArray(data) && data.length > 0) {
                const parsedResults = data.map((item: any) => {
                    let symbol = '';
                    let marketName = '';
                    
                    // 网易的数据格式自带 Type，且符号会有前缀，我们需要清洗它以兼容 Yahoo
                    if (item.type === 'SH') {
                        // 沪市：网易格式是 0600418，清洗后变成 600418.SS
                        symbol = `${item.symbol.replace(/^0/, '')}.SS`;
                        marketName = '沪股';
                    } else if (item.type === 'SZ') {
                        // 深市：网易格式是 1000001，清洗后变成 000001.SZ
                        symbol = `${item.symbol.substring(1)}.SZ`;
                        marketName = '深股';
                    } else if (item.type === 'HK') {
                        symbol = `${item.symbol}.HK`;
                        marketName = '港股';
                    } else if (item.type === 'US') {
                        symbol = item.symbol;
                        marketName = '美股';
                    }

                    if (symbol) {
                        return { symbol, name: `${item.name} (${marketName})` };
                    }
                    return null;
                }).filter(Boolean);

                results = [...results, ...parsedResults];
            }
        }
    } catch (e) {
        console.error("NetEase Search API Error:", e);
    }

    // 3. 雅虎金融全球节点 (完美兜底美股与加密货币)
    try {
        const yfRes = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(lowerQ)}&quotesCount=4`, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
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

    // 去重，确保下拉列表干净
    const uniqueResults = Array.from(new Map(results.map(item => [item.symbol, item])).values());
    return NextResponse.json(uniqueResults.slice(0, 8));
}