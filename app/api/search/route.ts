import { NextResponse } from 'next/server';

const ASSET_DICTIONARY: Record<string, { symbol: string, name: string }> = {
    // --- 贵金属 & 大宗商品 ---
    '黄金': { symbol: 'GC=F', name: 'Gold (黄金期货主连)' },
    '白银': { symbol: 'SI=F', name: 'Silver (白银期货主连)' },
    '原油': { symbol: 'CL=F', name: 'Crude Oil (WTI原油)' },
    '布伦特原油': { symbol: 'BZ=F', name: 'Brent Crude (布伦特原油)' },
    '铜': { symbol: 'HG=F', name: 'Copper (铜期货)' },
    '天然气': { symbol: 'NG=F', name: 'Natural Gas (天然气)' },
    
    // --- 全球核心宏观指数 ---
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
    const lowerQ = q.toLowerCase();

    // 1. 本地极速字典匹配
    for (const key in ASSET_DICTIONARY) {
        if (key.includes(lowerQ) || lowerQ.includes(key)) {
            results.push(ASSET_DICTIONARY[key]);
        }
    }

    // 🌟 2. 核心修复：引入腾讯财经超强智能联想 API (完美解决江淮汽车、A股拼音缩写问题)
    try {
        const txRes = await fetch(`https://smartbox.tencent.com/get/?v=2&q=${encodeURIComponent(q)}&t=all`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (txRes.ok) {
            const txData = await txRes.json();
            if (txData && txData.data) {
                const parseTx = (list: string[], suffix: string, marketName: string) => {
                    if (!list) return [];
                    return list.map(item => {
                        const parts = item.split('~'); // 腾讯的数据格式是 "名字~代码~拼音"
                        return { symbol: `${parts[1]}${suffix}`, name: `${parts[0]} (${marketName})` };
                    });
                };
                // 自动组装 A股、港股和美股
                results = [
                    ...results,
                    ...parseTx(txData.data.sh, '.SS', '沪股'),
                    ...parseTx(txData.data.sz, '.SZ', '深股'),
                    ...parseTx(txData.data.hk, '.HK', '港股'),
                    ...parseTx(txData.data.us, '', '美股')
                ];
            }
        }
    } catch (e) {
        console.error("Tencent Search API Error:", e);
    }

    // 3. 雅虎金融在线数据库兜底
    try {
        const yfRes = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=6`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (yfRes.ok) {
            const data = await yfRes.json();
            if (data.quotes && data.quotes.length > 0) {
                const yfResults = data.quotes
                    .filter((quote: any) => quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF')
                    .map((quote: any) => ({
                        symbol: quote.symbol,
                        name: quote.shortname || quote.longname || quote.symbol
                    }));
                results = [...results, ...yfResults];
            }
        }
    } catch (e) {
        console.error("Search API Error:", e);
    }

    // 去重，保留唯一 symbol
    const uniqueResults = Array.from(new Map(results.map(item => [item.symbol, item])).values());
    return NextResponse.json(uniqueResults.slice(0, 8));
}