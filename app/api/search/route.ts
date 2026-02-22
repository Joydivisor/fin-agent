import { NextResponse } from 'next/server';

// 🌟 核心升级：超级本地极速缓存字典 (专注覆盖期货、外汇、指数与A股俗称)
// 提示：普通的股票如“中国平安”，即使不写在这里，底层的在线 API 也能自动搜出来！
const ASSET_DICTIONARY: Record<string, { symbol: string, name: string }> = {
    // --- 贵金属 & 大宗商品 (期货) ---
    '黄金': { symbol: 'GC=F', name: 'Gold (黄金期货主连)' },
    '白银': { symbol: 'SI=F', name: 'Silver (白银期货主连)' },
    '原油': { symbol: 'CL=F', name: 'Crude Oil (WTI原油)' },
    '布伦特原油': { symbol: 'BZ=F', name: 'Brent Crude (布伦特原油)' },
    '铜': { symbol: 'HG=F', name: 'Copper (铜期货)' },
    '天然气': { symbol: 'NG=F', name: 'Natural Gas (天然气)' },
    '玉米': { symbol: 'ZC=F', name: 'Corn (玉米)' },
    '大豆': { symbol: 'ZS=F', name: 'Soybean (大豆)' },
    '小麦': { symbol: 'ZW=F', name: 'Wheat (小麦)' },

    // --- 全球核心宏观指数 ---
    '标普': { symbol: '^GSPC', name: 'S&P 500 (标普500指数)' },
    '标普500': { symbol: '^GSPC', name: 'S&P 500 (标普500指数)' },
    '纳指': { symbol: '^IXIC', name: 'NASDAQ (纳斯达克综合指数)' },
    '纳斯达克': { symbol: '^IXIC', name: 'NASDAQ (纳斯达克综合指数)' },
    '道指': { symbol: '^DJI', name: 'Dow Jones (道琼斯工业指数)' },
    '罗素2000': { symbol: '^RUT', name: 'Russell 2000 (罗素2000小盘股)' },
    '恐慌指数': { symbol: '^VIX', name: 'VIX (CBOE恐慌指数)' },
    '恒指': { symbol: '^HSI', name: 'Hang Seng (恒生指数)' },
    '恒生科技': { symbol: '^HSTECH', name: 'Hang Seng Tech (恒生科技指数)' },
    '日经': { symbol: '^N225', name: 'Nikkei 225 (日经225指数)' },
    '上证': { symbol: '000001.SS', name: 'SSE Composite (上证指数)' },
    '深证': { symbol: '399001.SZ', name: 'SZSE Component (深证成指)' },
    '创业板': { symbol: '399006.SZ', name: 'ChiNext (创业板指)' },
    '沪深300': { symbol: '000300.SS', name: 'CSI 300 (沪深300指数)' },
    '科创50': { symbol: '399808.SS', name: 'STAR 50 (科创50指数)' },

    // --- 核心外汇汇率 ---
    '美元人民币': { symbol: 'CNY=X', name: 'USD/CNY (美元兑人民币)' },
    '离岸人民币': { symbol: 'CNH=X', name: 'USD/CNH (美元兑离岸人民币)' },
    '欧元美元': { symbol: 'EURUSD=X', name: 'EUR/USD (欧元兑美元)' },
    '美元日元': { symbol: 'JPY=X', name: 'USD/JPY (美元兑日元)' },
    '英镑美元': { symbol: 'GBPUSD=X', name: 'GBP/USD (英镑兑美元)' },
    '美元指数': { symbol: 'DX-Y.NYB', name: 'U.S. Dollar Index (美元指数)' },

    // --- 顶级加密货币 ---
    '比特币': { symbol: 'BTC-USD', name: 'Bitcoin (比特币)' },
    '以太坊': { symbol: 'ETH-USD', name: 'Ethereum (以太坊)' },
    '狗狗币': { symbol: 'DOGE-USD', name: 'Dogecoin (狗狗币)' },
    '索拉纳': { symbol: 'SOL-USD', name: 'Solana (SOL)' },

    // --- 极高频中文俗称映射 (兜底) ---
    '腾讯': { symbol: '0700.HK', name: 'Tencent (腾讯控股)' },
    '阿里': { symbol: 'BABA', name: 'Alibaba (阿里巴巴)' },
    '拼多多': { symbol: 'PDD', name: 'Pinduoduo (拼多多)' },
    '网易': { symbol: 'NTES', name: 'NetEase (网易)' },
    '苹果': { symbol: 'AAPL', name: 'Apple (苹果)' },
    '英伟达': { symbol: 'NVDA', name: 'NVIDIA (英伟达)' },
    '微软': { symbol: 'MSFT', name: 'Microsoft (微软)' },
    '特斯拉': { symbol: 'TSLA', name: 'Tesla (特斯拉)' },
    '茅台': { symbol: '600519.SS', name: 'Kweichow Moutai (贵州茅台)' },
    '宁王': { symbol: '300750.SZ', name: 'CATL (宁德时代)' },
    '比亚迪': { symbol: '002594.SZ', name: 'BYD (比亚迪)' }
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    if (!q) return NextResponse.json([]);

    let results: any[] = [];
    const lowerQ = q.toLowerCase();

    // 🌟 第一层拦截：秒级匹配本地极速字典 (支持模糊搜索，如输入"原油"会匹配"布伦特原油")
    for (const key in ASSET_DICTIONARY) {
        if (key.includes(lowerQ) || lowerQ.includes(key)) {
            results.push(ASSET_DICTIONARY[key]);
        }
    }

    // 🌟 第二层拦截：A股代码智能推断 (全自动补全沪深后缀)
    if (/^\d{6}$/.test(lowerQ)) {
        if (lowerQ.startsWith('6')) {
            results.push({ symbol: `${lowerQ}.SS`, name: 'Shanghai A-Share (沪市 A 股)' });
        } else if (lowerQ.startsWith('0') || lowerQ.startsWith('3')) {
            results.push({ symbol: `${lowerQ}.SZ`, name: 'Shenzhen A-Share (深市 A 股)' });
        }
    }

    // 🌟 第三层拦截：雅虎金融在线数据库兜底 (处理字典外的所有几万只普通股票)
    try {
        const yfRes = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=6`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (yfRes.ok) {
            const data = await yfRes.json();
            if (data.quotes && data.quotes.length > 0) {
                const yfResults = data.quotes
                    .filter((quote: any) => quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF') // 过滤掉无关的垃圾结果
                    .map((quote: any) => ({
                        symbol: quote.symbol,
                        name: quote.shortname || quote.longname || quote.symbol
                    }));
                // 将在线结果追加到字典结果之后
                results = [...results, ...yfResults];
            }
        }
    } catch (e) {
        console.error("Search API Error:", e);
    }

    // 🌟 结果清洗：去重，防止字典和雅虎搜出重复的代码
    const uniqueResults = Array.from(new Map(results.map(item => [item.symbol, item])).values());

    // 限制最多返回 8 条提示，保持 UI 优雅
    return NextResponse.json(uniqueResults.slice(0, 8));
}