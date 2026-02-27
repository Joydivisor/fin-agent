import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import YahooFinance from 'yahoo-finance2';

export const revalidate = 0;

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

    const yf = new (YahooFinance as any)();

    try {
        // 替换为你的代理地址，如果没有请注释掉
        const agent = new HttpsProxyAgent('http://127.0.0.1:7890');
        const fetchOptions = { fetchOptions: { agent } };

        const quoteSummary = await yf.quoteSummary(symbol, {
            modules: ['financialData', 'defaultKeyStatistics', 'price']
        }, fetchOptions);

        if (!quoteSummary) {
            return NextResponse.json({ error: 'Failed to fetch quote summary' }, { status: 404 });
        }

        const fd = quoteSummary.financialData || {};
        const dks = quoteSummary.defaultKeyStatistics || {};
        const price = quoteSummary.price || {};

        // Extract necessary parameters for our DCF / WACC calculations
        // Fallbacks to 0 or safe defaults if data is missing
        const data = {
            symbol: symbol,
            price: price.regularMarketPrice || 0,
            beta: dks.beta || 1.0,
            sharesOutstanding: dks.sharesOutstanding || 0,
            totalDebt: fd.totalDebt || 0,
            totalCash: fd.totalCash || 0,
            freeCashflow: fd.freeCashflow || 0,
            operatingCashflow: fd.operatingCashflow || 0,
            revenue: fd.totalRevenue || 0,
            ebitda: fd.ebitda || 0,
            grossMargins: fd.grossMargins || 0,
            operatingMargins: fd.operatingMargins || 0,
            profitMargins: fd.profitMargins || 0
        };

        return NextResponse.json(data);
    } catch (error: any) {
        console.error(`API Error for fundamentals ${symbol}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
