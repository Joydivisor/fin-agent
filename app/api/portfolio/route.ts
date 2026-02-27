import { NextResponse } from 'next/server';
import { PortfolioOptimizer } from '../../lib/portfolio-optimizer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, holdings, riskFreeRate = 0.045, targetReturn, years, numSimulations } = body;

        switch (type || 'analyze') {
            case 'analyze': {
                const result = PortfolioOptimizer.analyzePortfolio(holdings, riskFreeRate);
                return NextResponse.json({ success: true, type: 'analyze', result });
            }

            case 'optimize': {
                const result = PortfolioOptimizer.optimizePortfolio(holdings, riskFreeRate);
                return NextResponse.json({ success: true, type: 'optimize', result });
            }

            case 'tax_harvest': {
                const { shortTermTaxRate = 0.37, longTermTaxRate = 0.20 } = body;
                const result = PortfolioOptimizer.taxLossHarvesting(holdings, shortTermTaxRate, longTermTaxRate);
                return NextResponse.json({ success: true, type: 'tax_harvest', result });
            }

            case 'monte_carlo': {
                const analysis = PortfolioOptimizer.analyzePortfolio(holdings, riskFreeRate);
                const result = PortfolioOptimizer.monteCarloSimulation(
                    analysis.totalValue,
                    analysis.riskMetrics.expectedReturn,
                    analysis.riskMetrics.volatility,
                    years || 5,
                    numSimulations || 1000
                );
                return NextResponse.json({ success: true, type: 'monte_carlo', result, portfolioValue: analysis.totalValue });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown portfolio operation: ${type}. Valid: analyze, optimize, tax_harvest, monte_carlo` },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error('Portfolio API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
