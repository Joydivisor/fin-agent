import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const range = searchParams.get('range') || '1D';

    if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });

    try {
        // 1. 获取 K 线图表数据 (动态周期)
        let interval = '5m';
        let yfRange = '1d';
        if (range === '5D') { yfRange = '5d'; interval = '15m'; }
        else if (range === '1M') { yfRange = '1mo'; interval = '1d'; }
        else if (range === '6M') { yfRange = '6mo'; interval = '1d'; }
        else if (range === 'YTD') { yfRange = 'ytd'; interval = '1d'; }
        else if (range === '1Y') { yfRange = '1y'; interval = '1d'; }
        else if (range === '5Y') { yfRange = '5y'; interval = '1wk'; }
        else if (range === 'All') { yfRange = 'max'; interval = '1mo'; }

        const chartRes = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=${yfRange}&interval=${interval}`, { cache: 'no-store' });
        const chartDataRaw = await chartRes.json();
        
        let chart = [];
        let prevClose = 0;
        if (chartDataRaw.chart?.result?.[0]) {
            const result = chartDataRaw.chart.result[0];
            prevClose = result.meta.chartPreviousClose || result.meta.previousClose || 0;
            const timestamps = result.timestamp || [];
            const closePrices = result.indicators?.quote?.[0]?.close || [];
            
            chart = timestamps.map((t: number, i: number) => ({
                normalizedTime: t * 1000,
                price: closePrices[i] || null
            })).filter((item: any) => item.price !== null);
        }

        // 2. 获取股东持仓与核心机构数据
        const summaryRes = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=institutionOwnership,majorHoldersBreakdown,summaryDetail`, { cache: 'no-store' });
        const summaryDataRaw = await summaryRes.json();
        const summary = summaryDataRaw.quoteSummary?.result?.[0] || {};

        // 解析总体股东结构饼图
        const breakdown = summary.majorHoldersBreakdown || {};
        const instPct = breakdown.institutionsPercentHeld?.raw || 0;
        const insiderPct = breakdown.insidersPercentHeld?.raw || 0;
        const retailPct = Math.max(0, 1 - instPct - insiderPct);

        const ownership = [
            { name: 'Institutions', value: (instPct * 100).toFixed(2), color: '#6366f1' },
            { name: 'Insiders', value: (insiderPct * 100).toFixed(2), color: '#eab308' },
            { name: 'Retail/Public', value: (retailPct * 100).toFixed(2), color: '#10b981' }
        ];

        // 🌟 核心修复：解析十大核心持仓机构，并加入【动态精度自适应引擎】
        const instList = summary.institutionOwnership?.ownershipList || [];
        const topInstitutions = instList.slice(0, 8).map((inst: any) => {
            const rawPct = (inst.pctHeld?.raw || 0) * 100;
            let valueStr = '0.00%';
            
            if (rawPct > 0 && rawPct < 0.01) {
                // 如果持仓占比不足万分之一，开启高精度模式，保留 4 位小数
                valueStr = rawPct.toFixed(4) + '%';
            } else if (rawPct >= 0.01) {
                // 如果是常规持仓，保持优雅的 2 位小数
                valueStr = rawPct.toFixed(2) + '%';
            }
            
            return {
                name: inst.organization || 'Unknown Institution',
                value: valueStr
            };
        });

        // 3. 动态抓取该标的的专属新闻情报
        let news = [];
        try {
            const newsRes = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${symbol}&newsCount=5`);
            const newsData = await newsRes.json();
            if (newsData.news && newsData.news.length > 0) {
                news = newsData.news.map((item: any) => ({
                    id: item.uuid,
                    title: item.title,
                    source: item.publisher,
                    time: new Date(item.providerPublishTime * 1000).toLocaleString(),
                    link: item.link
                }));
            }
        } catch (e) { }

        return NextResponse.json({ chart, prevClose, ownership, topInstitutions, news });
        
    } catch (error) {
        console.error("Stock Detail Error:", error);
        return NextResponse.json({ error: 'Failed to fetch stock details' }, { status: 500 });
    }
}