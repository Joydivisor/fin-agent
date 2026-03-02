/**
 * ResearchEngine — Equity Research & Report Generation Engine
 * 
 * Provides institutional-grade equity research capabilities including
 * structured report generation, management guidance extraction, and
 * semantic document analysis.
 * 
 * @module FinancialServices/core — Equity Research Plugin
 */

// ============================================================
// Type Definitions
// ============================================================

export interface ResearchReportRequest {
    symbol: string;
    companyName?: string;
    currentPrice?: number;
    marketCap?: number;
    sector?: string;
    /** Recent financial data for context */
    financials?: CompanyFinancials;
    /** Raw text from earnings calls or filings for guidance extraction */
    rawDocumentText?: string;
    reportType: 'full_report' | 'guidance_extract' | 'earnings_analysis' | 'sector_overview';
}

export interface CompanyFinancials {
    revenue?: number;
    revenueGrowth?: number;
    grossMargin?: number;
    operatingMargin?: number;
    netMargin?: number;
    eps?: number;
    epsGrowth?: number;
    pe?: number;
    evEbitda?: number;
    debtToEquity?: number;
    roe?: number;
    fcfYield?: number;
    dividendYield?: number;
}

export interface GuidanceItem {
    metric: string;
    period: string;
    lowEnd: string;
    highEnd: string;
    midpoint: string;
    priorGuidance?: string;
    direction: 'raised' | 'lowered' | 'maintained' | 'initiated';
    confidence: number;
}

export interface ResearchReport {
    symbol: string;
    companyName: string;
    date: string;
    rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    priceTarget: number | null;
    currentPrice: number;
    upside: number | null;
    sections: ReportSection[];
    guidanceItems: GuidanceItem[];
    riskFactors: RiskFactor[];
    comparableMetrics: ComparableMetric[];
}

export interface ReportSection {
    title: string;
    icon: string;
    content: string;
    keyMetrics?: { label: string; value: string; trend?: 'up' | 'down' | 'flat' }[];
}

export interface RiskFactor {
    category: 'market' | 'operational' | 'financial' | 'regulatory' | 'competitive';
    severity: 'high' | 'medium' | 'low';
    description: string;
    mitigation: string;
}

export interface ComparableMetric {
    metric: string;
    company: string;
    value: number;
    sectorMedian: number;
    percentile: number;
}

export interface SemanticChunk {
    id: string;
    text: string;
    embedding?: number[];
    metadata: {
        source: string;
        section: string;
        page?: number;
        relevanceScore?: number;
    };
}

// ============================================================
// ResearchEngine Class
// ============================================================

export class ResearchEngine {

    /**
     * Generate a structured equity research report.
     * 
     * This produces the data structure for AI-enhanced report generation.
     * The actual AI text generation happens at the API route level,
     * while this engine provides the structured framework and analysis.
     */
    static generateReportStructure(request: ResearchReportRequest): ResearchReport {
        const { symbol, companyName = symbol, currentPrice = 0, financials } = request;

        // Determine preliminary rating based on quantitative factors
        const rating = this.computeQuantitativeRating(financials);

        // Estimate price target from multiples-based valuation
        const priceTarget = this.estimatePriceTarget(currentPrice, financials);
        const upside = priceTarget && currentPrice > 0
            ? ((priceTarget - currentPrice) / currentPrice) * 100
            : null;

        const sections = this.buildReportSections(request);
        const guidanceItems = request.rawDocumentText
            ? this.extractGuidance(request.rawDocumentText)
            : [];
        const riskFactors = this.assessRiskFactors(financials);
        const comparableMetrics = this.buildComparableMetrics(symbol, financials);

        return {
            symbol,
            companyName,
            date: new Date().toISOString().split('T')[0],
            rating,
            priceTarget,
            currentPrice,
            upside,
            sections,
            guidanceItems,
            riskFactors,
            comparableMetrics
        };
    }

    /**
     * Quantitative rating model — Continuous Sigmoid Scoring (v2.0).
     * 
     * Unlike v1.0 which used hard-coded if/else thresholds, this model
     * uses continuous sigmoid functions to map each metric into a smooth
     * [0, 10] score, then applies weighted aggregation.
     * 
     * Scoring system (0-100):
     *   Growth Score     = f(revenueGrowth, epsGrowth)        × 25%
     *   Profitability    = f(grossMargin, operatingMargin)     × 25%
     *   Valuation        = f(P/E, EV/EBITDA, FCF Yield)       × 30%
     *   Financial Health  = f(D/E, ROE)                       × 20%
     *
     * sigmoid(x, center, steepness) = 10 / (1 + e^(-steepness*(x - center)))
     * This ensures score never "clips" and smoothly transitions across ranges.
     */
    private static computeQuantitativeRating(
        financials?: CompanyFinancials
    ): ResearchReport['rating'] {
        if (!financials) return 'Hold';

        // Continuous sigmoid scoring: maps x → [0, 10]
        const sigmoid = (x: number, center: number, steepness: number): number => {
            return 10 / (1 + Math.exp(-steepness * (x - center)));
        };

        // Inverse sigmoid for metrics where lower is better (P/E, D/E)
        const sigmoidInv = (x: number, center: number, steepness: number): number => {
            return 10 - sigmoid(x, center, steepness);
        };

        // ── Growth (25%) ──
        // Revenue growth: center at 10%, steepness 8 → 20%+ scores ~9, 0% scores ~3
        const revGrowthScore = financials.revenueGrowth !== undefined
            ? sigmoid(financials.revenueGrowth, 0.10, 8) : 5;
        // EPS growth: center at 12%, steepness 5. Clamp extreme values to prevent
        // turnaround stocks (epsGrowth = +1500%) from distorting the score.
        const clampedEpsGrowth = financials.epsGrowth !== undefined
            ? Math.max(-1, Math.min(financials.epsGrowth, 1.0)) : 0;
        const epsGrowthScore = sigmoid(clampedEpsGrowth, 0.12, 5);
        const growthScore = (revGrowthScore + epsGrowthScore) / 2;

        // ── Profitability (25%) ──
        const grossMarginScore = financials.grossMargin !== undefined
            ? sigmoid(financials.grossMargin, 0.40, 6) : 5;
        const opMarginScore = financials.operatingMargin !== undefined
            ? sigmoid(financials.operatingMargin, 0.12, 8) : 5;
        const profitScore = (grossMarginScore + opMarginScore) / 2;

        // ── Valuation (30%) ──
        // P/E: lower is more attractive. But ignore if P/E is negative or extreme.
        let peScore = 5;
        if (financials.pe !== undefined && financials.pe > 0 && financials.pe < 200) {
            peScore = sigmoidInv(financials.pe, 22, 0.08);
        }
        const evEbitdaScore = financials.evEbitda !== undefined && financials.evEbitda > 0
            ? sigmoidInv(financials.evEbitda, 14, 0.12) : 5;
        const fcfScore = financials.fcfYield !== undefined
            ? sigmoid(financials.fcfYield, 0.04, 50) : 5;
        const valuationScore = (peScore + evEbitdaScore + fcfScore) / 3;

        // ── Financial Health (20%) ──
        const deScore = financials.debtToEquity !== undefined
            ? sigmoidInv(financials.debtToEquity, 1.0, 1.5) : 5;
        const roeScore = financials.roe !== undefined
            ? sigmoid(financials.roe, 0.12, 8) : 5;
        const healthScore = (deScore + roeScore) / 2;

        // Weighted composite: total is on [0, 10] scale, map to [0, 100]
        const compositeScore = (
            growthScore * 0.25 +
            profitScore * 0.25 +
            valuationScore * 0.30 +
            healthScore * 0.20
        ) * 10; // scale to 0-100

        if (compositeScore >= 72) return 'Strong Buy';
        if (compositeScore >= 58) return 'Buy';
        if (compositeScore >= 42) return 'Hold';
        if (compositeScore >= 28) return 'Sell';
        return 'Strong Sell';
    }

    // ── Sector Median Benchmarks ──
    // These are approximate GICS sector median multiples for normalization.
    // In a production system, these would be fetched from a live data feed.
    private static readonly SECTOR_MEDIANS = {
        pe: 22.0,          // S&P 500 trailing PE median
        evEbitda: 14.0,     // S&P 500 EV/EBITDA median
        priceToSales: 2.5,  // S&P 500 P/S median
    };

    /**
     * Estimate price target — Adaptive Valuation Matrix (v2.0).
     * 
     * ═══════════════════════════════════════════════════════════
     * CRITICAL FIX: replaces the v1.0 naive P/E extrapolation that caused
     * TAL's 853% upside anomaly. The new algorithm:
     * 
     * 1. Adaptive Valuation Switch:
     *      IF P/E is "clean" (5 < P/E < 60 AND eps > 0):
     *          → Use P/E-based target with mean-reversion cap
     *      ELSE IF EV/EBITDA is available (> 0):
     *          → Switch to EV/EBITDA-based target
     *      ELSE:
     *          → Fall back to Price-to-Sales (P/S) based target
     *
     * 2. Mean-Reverting PEG:
     *      Target P/E = blend(Current P/E, Sector Median P/E)
     *      HARD CAP: Target P/E ≤ 2.0 × Sector Median
     *
     * 3. Growth Dampening:
     *      epsGrowth is clamped to [-50%, +50%] to prevent
     *      turnaround stocks from producing absurd forward estimates.
     *
     * 4. Sanity Guardrail:
     *      Final upside is hard-capped at ±100% (i.e., 2x or 0x current price).
     * ═══════════════════════════════════════════════════════════
     */
    private static estimatePriceTarget(
        currentPrice: number,
        financials?: CompanyFinancials
    ): number | null {
        if (!currentPrice || currentPrice <= 0) return null;
        if (!financials) return null;

        const medians = this.SECTOR_MEDIANS;

        // Clamp growth rates to prevent turnaround distortion
        const clampedEpsGrowth = financials.epsGrowth
            ? Math.max(-0.50, Math.min(financials.epsGrowth, 0.50))
            : 0.05;
        const clampedRevGrowth = financials.revenueGrowth
            ? Math.max(-0.30, Math.min(financials.revenueGrowth, 0.50))
            : 0.05;

        let targetPrice: number | null = null;
        let method = 'none';

        // ── Strategy A: P/E-Based (preferred for profitable companies) ──
        const peClean = financials.pe !== undefined
            && financials.pe > 5 && financials.pe < 60
            && financials.eps !== undefined && financials.eps > 0;

        if (peClean) {
            method = 'PE';
            // Mean-reverting target P/E: blend current PE toward sector median
            // Weight: 40% current, 60% sector median (strong mean-reversion)
            const blendedPE = financials.pe! * 0.4 + medians.pe * 0.6;
            // Hard cap: target P/E ≤ 2x sector median
            const cappedPE = Math.min(blendedPE, medians.pe * 2.0);
            // Apply growth premium/discount via PEG-style adjustment
            const growthAdj = 1 + clampedEpsGrowth * 0.3; // dampened premium
            const targetPE = cappedPE * Math.max(0.7, Math.min(growthAdj, 1.3));
            // Forward EPS: current EPS × (1 + clamped growth)
            const forwardEPS = financials.eps! * (1 + clampedEpsGrowth);
            targetPrice = targetPE * forwardEPS;
        }

        // ── Strategy B: EV/EBITDA-Based (for low/negative EPS) ──
        if (!targetPrice && financials.evEbitda && financials.evEbitda > 0) {
            method = 'EV/EBITDA';
            // Mean-revert EV/EBITDA toward sector median
            const blendedMult = financials.evEbitda * 0.3 + medians.evEbitda * 0.7;
            const cappedMult = Math.min(blendedMult, medians.evEbitda * 2.0);
            // Implied target = currentPrice × (target multiple / current multiple)
            const growthAdj = 1 + clampedRevGrowth * 0.3;
            targetPrice = currentPrice * (cappedMult * growthAdj / financials.evEbitda);
        }

        // ── Strategy C: P/S-Based (last resort for pre-profit companies) ──
        if (!targetPrice) {
            method = 'P/S';
            // Use a conservative P/S premium based on revenue growth
            const targetPS = medians.priceToSales * (1 + clampedRevGrowth * 0.5);
            const cappedPS = Math.min(targetPS, medians.priceToSales * 2.0);
            // Assume current P/S ≈ price / (revenue_per_share)
            // Without explicit revenue_per_share, apply relative ratio
            targetPrice = currentPrice * (cappedPS / medians.priceToSales) * (1 + clampedRevGrowth);
        }

        // ── Sanity Guardrail: cap upside/downside at ±100% ──
        if (targetPrice) {
            const maxPrice = currentPrice * 2.0;  // +100% cap
            const minPrice = currentPrice * 0.3;  // -70% floor
            targetPrice = Math.max(minPrice, Math.min(targetPrice, maxPrice));
        }

        return targetPrice ? Math.round(targetPrice * 100) / 100 : null;
    }

    /**
     * Build structured report sections for the equity research report.
     */
    private static buildReportSections(request: ResearchReportRequest): ReportSection[] {
        const { financials, sector = 'General' } = request;
        const sections: ReportSection[] = [];

        // 1. Investment Thesis
        sections.push({
            title: 'Investment Thesis',
            icon: '🎯',
            content: '',  // Populated by AI at API layer
            keyMetrics: [
                { label: 'Sector', value: sector },
                { label: 'Market Cap', value: request.marketCap ? this.formatLargeNumber(request.marketCap) : 'N/A' },
            ]
        });

        // 2. Financial Overview
        if (financials) {
            sections.push({
                title: 'Financial Performance',
                icon: '📊',
                content: '',
                keyMetrics: [
                    { label: 'Revenue Growth', value: financials.revenueGrowth ? `${(financials.revenueGrowth * 100).toFixed(1)}%` : 'N/A', trend: financials.revenueGrowth && financials.revenueGrowth > 0 ? 'up' : 'down' },
                    { label: 'Gross Margin', value: financials.grossMargin ? `${(financials.grossMargin * 100).toFixed(1)}%` : 'N/A' },
                    { label: 'Operating Margin', value: financials.operatingMargin ? `${(financials.operatingMargin * 100).toFixed(1)}%` : 'N/A' },
                    { label: 'Net Margin', value: financials.netMargin ? `${(financials.netMargin * 100).toFixed(1)}%` : 'N/A' },
                    { label: 'ROE', value: financials.roe ? `${(financials.roe * 100).toFixed(1)}%` : 'N/A', trend: financials.roe && financials.roe > 0.15 ? 'up' : 'flat' },
                ]
            });

            // 3. Valuation
            sections.push({
                title: 'Valuation Analysis',
                icon: '💰',
                content: '',
                keyMetrics: [
                    { label: 'P/E Ratio', value: financials.pe ? financials.pe.toFixed(1) + 'x' : 'N/A' },
                    { label: 'EV/EBITDA', value: financials.evEbitda ? financials.evEbitda.toFixed(1) + 'x' : 'N/A' },
                    { label: 'FCF Yield', value: financials.fcfYield ? `${(financials.fcfYield * 100).toFixed(1)}%` : 'N/A' },
                    { label: 'Div Yield', value: financials.dividendYield ? `${(financials.dividendYield * 100).toFixed(2)}%` : 'N/A' },
                ]
            });

            // 4. Balance Sheet Strength
            sections.push({
                title: 'Balance Sheet & Risk',
                icon: '🛡️',
                content: '',
                keyMetrics: [
                    { label: 'D/E Ratio', value: financials.debtToEquity ? financials.debtToEquity.toFixed(2) + 'x' : 'N/A', trend: financials.debtToEquity && financials.debtToEquity > 1.5 ? 'down' : 'up' },
                    { label: 'EPS', value: financials.eps ? `$${financials.eps.toFixed(2)}` : 'N/A' },
                    { label: 'EPS Growth', value: financials.epsGrowth ? `${(financials.epsGrowth * 100).toFixed(1)}%` : 'N/A', trend: financials.epsGrowth && financials.epsGrowth > 0 ? 'up' : 'down' },
                ]
            });
        }

        // 5. Catalysts & Outlook
        sections.push({
            title: 'Catalysts & Outlook',
            icon: '🚀',
            content: '',
        });

        return sections;
    }

    /**
     * Extract management guidance from raw earnings call / filing text.
     * 
     * Uses pattern matching to identify forward-looking statements containing
     * revenue, EPS, margin, and CapEx guidance ranges.
     * 
     * Common patterns:
     *   - "We expect revenue of $X to $Y"
     *   - "Guidance for FY2026: EPS of $A-$B"
     *   - "We are raising our full-year outlook"
     */
    static extractGuidance(text: string): GuidanceItem[] {
        const items: GuidanceItem[] = [];
        const lines = text.split(/[.!?\n]+/);

        // Common guidance keywords and patterns
        const guidancePatterns = [
            { metric: 'Revenue', pattern: /(?:revenue|sales|top.?line)\s+(?:of|between|to\s+be|guidance|range)\s*\$?([\d,.]+)\s*(?:billion|million|B|M)?\s*(?:to|[-–])\s*\$?([\d,.]+)\s*(?:billion|million|B|M)?/i },
            { metric: 'EPS', pattern: /(?:eps|earnings\s+per\s+share)\s+(?:of|between|to\s+be|guidance|range)\s*\$?([\d,.]+)\s*(?:to|[-–])\s*\$?([\d,.]+)/i },
            { metric: 'Operating Margin', pattern: /(?:operating\s+margin|op.?\s*margin)\s+(?:of|between|to\s+be|guidance)\s*([\d,.]+)%?\s*(?:to|[-–])\s*([\d,.]+)%?/i },
            { metric: 'CapEx', pattern: /(?:capex|capital\s+expenditure)\s+(?:of|between|to\s+be|guidance)\s*\$?([\d,.]+)\s*(?:billion|million|B|M)?\s*(?:to|[-–])\s*\$?([\d,.]+)\s*(?:billion|million|B|M)?/i },
            { metric: 'Free Cash Flow', pattern: /(?:free\s+cash\s+flow|fcf)\s+(?:of|between|to\s+be|guidance)\s*\$?([\d,.]+)\s*(?:billion|million|B|M)?\s*(?:to|[-–])\s*\$?([\d,.]+)\s*(?:billion|million|B|M)?/i },
            { metric: 'Gross Margin', pattern: /(?:gross\s+margin)\s+(?:of|between|to\s+be|guidance)\s*([\d,.]+)%?\s*(?:to|[-–])\s*([\d,.]+)%?/i },
        ];

        // Direction detection keywords
        const raisedKeywords = /(?:rais(?:e|ing|ed)|increas(?:e|ing|ed)|upward|higher|above)/i;
        const loweredKeywords = /(?:lower(?:ed|ing)?|reduc(?:e|ing|ed)|cut|downward|below)/i;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.length < 20) continue;

            for (const { metric, pattern } of guidancePatterns) {
                const match = trimmed.match(pattern);
                if (match) {
                    const low = match[1].replace(/,/g, '');
                    const high = match[2].replace(/,/g, '');
                    const lowNum = parseFloat(low);
                    const highNum = parseFloat(high);
                    const midpoint = ((lowNum + highNum) / 2).toFixed(2);

                    let direction: GuidanceItem['direction'] = 'maintained';
                    if (raisedKeywords.test(trimmed)) direction = 'raised';
                    else if (loweredKeywords.test(trimmed)) direction = 'lowered';

                    // Detect period
                    let period = 'FY';
                    const periodMatch = trimmed.match(/(?:FY|fiscal\s+year|full.?year)\s*'?(\d{2,4})/i)
                        || trimmed.match(/(Q[1-4])\s*'?(\d{2,4})?/i);
                    if (periodMatch) {
                        period = periodMatch[0].replace(/fiscal\s+year/i, 'FY').trim();
                    }

                    items.push({
                        metric,
                        period,
                        lowEnd: low,
                        highEnd: high,
                        midpoint,
                        direction,
                        confidence: 0.85
                    });
                }
            }
        }

        return items;
    }

    /**
     * Assess systematic risk factors for the company.
     */
    private static assessRiskFactors(financials?: CompanyFinancials): RiskFactor[] {
        const risks: RiskFactor[] = [];

        if (financials?.debtToEquity && financials.debtToEquity > 1.5) {
            risks.push({
                category: 'financial',
                severity: financials.debtToEquity > 3.0 ? 'high' : 'medium',
                description: `Elevated leverage with D/E ratio of ${financials.debtToEquity.toFixed(2)}x increases interest rate sensitivity and refinancing risk.`,
                mitigation: 'Monitor debt maturity schedule and free cash flow coverage ratio.'
            });
        }

        if (financials?.operatingMargin !== undefined && financials.operatingMargin < 0.05) {
            risks.push({
                category: 'operational',
                severity: financials.operatingMargin < 0 ? 'high' : 'medium',
                description: `Thin operating margins (${(financials.operatingMargin * 100).toFixed(1)}%) leave limited buffer against cost inflation or demand slowdown.`,
                mitigation: 'Track unit economics trends and management commentary on cost optimization initiatives.'
            });
        }

        if (financials?.pe !== undefined && financials.pe > 35) {
            risks.push({
                category: 'market',
                severity: financials.pe > 60 ? 'high' : 'medium',
                description: `Premium valuation (${financials.pe.toFixed(1)}x P/E) embeds significant growth expectations — vulnerable to any earnings miss.`,
                mitigation: 'Model downside scenarios with multiple compression to sector median.'
            });
        }

        // Default macro/regulatory risks
        risks.push({
            category: 'regulatory',
            severity: 'low',
            description: 'Potential regulatory changes in taxation, trade policy, or industry-specific compliance could impact operations.',
            mitigation: 'Maintain diversified geographic exposure and monitor regulatory developments.'
        });

        risks.push({
            category: 'competitive',
            severity: 'medium',
            description: 'Intensifying competition from both incumbents and disruptive entrants could pressure pricing power and market share.',
            mitigation: 'Assess moat sustainability through patent portfolio, switching costs, and network effects analysis.'
        });

        return risks;
    }

    /**
     * Build comparable valuation metrics.
     */
    private static buildComparableMetrics(
        symbol: string,
        financials?: CompanyFinancials
    ): ComparableMetric[] {
        if (!financials) return [];
        const metrics: ComparableMetric[] = [];

        if (financials.pe !== undefined) {
            metrics.push({
                metric: 'P/E Ratio',
                company: symbol,
                value: financials.pe,
                sectorMedian: 22.5,
                percentile: this.calculatePercentile(financials.pe, 22.5, 8)
            });
        }

        if (financials.evEbitda !== undefined) {
            metrics.push({
                metric: 'EV/EBITDA',
                company: symbol,
                value: financials.evEbitda,
                sectorMedian: 14.0,
                percentile: this.calculatePercentile(financials.evEbitda, 14.0, 5)
            });
        }

        if (financials.grossMargin !== undefined) {
            metrics.push({
                metric: 'Gross Margin',
                company: symbol,
                value: financials.grossMargin * 100,
                sectorMedian: 45.0,
                percentile: this.calculatePercentile(financials.grossMargin * 100, 45.0, 15)
            });
        }

        if (financials.roe !== undefined) {
            metrics.push({
                metric: 'ROE',
                company: symbol,
                value: financials.roe * 100,
                sectorMedian: 15.0,
                percentile: this.calculatePercentile(financials.roe * 100, 15.0, 8)
            });
        }

        return metrics;
    }

    /**
     * Approximate percentile rank assuming normal distribution.
     * Uses z-score: z = (x - μ) / σ, then Φ(z) gives percentile.
     */
    private static calculatePercentile(value: number, median: number, stdDev: number): number {
        const z = (value - median) / stdDev;
        // Simple CDF approximation
        const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
        const d = 0.3989422804014327; // 1/√(2π)
        const p = d * Math.exp(-z * z / 2.0);
        const cdf = 1 - p * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return Math.round((z >= 0 ? cdf : 1 - cdf) * 100);
    }

    /**
     * Perform semantic chunking of financial documents for vector retrieval.
     * Splits documents into overlapping chunks optimized for embedding search.
     */
    static chunkDocument(
        text: string,
        source: string,
        chunkSize: number = 500,
        overlap: number = 100
    ): SemanticChunk[] {
        const chunks: SemanticChunk[] = [];
        const paragraphs = text.split(/\n\n+/);
        let currentChunk = '';
        let chunkIndex = 0;

        // Detect section headers for metadata
        const sectionPattern = /^(?:#{1,3}\s+|[A-Z][A-Z\s]{4,}$|(?:Item\s+\d|Part\s+[IVX]+))/m;
        let currentSection = 'General';

        for (const paragraph of paragraphs) {
            const trimmed = paragraph.trim();
            if (!trimmed) continue;

            // Check for section header
            if (sectionPattern.test(trimmed) && trimmed.length < 100) {
                currentSection = trimmed.replace(/^#+\s*/, '').trim();
            }

            if (currentChunk.length + trimmed.length > chunkSize && currentChunk.length > 0) {
                chunks.push({
                    id: `${source}-chunk-${chunkIndex}`,
                    text: currentChunk.trim(),
                    metadata: {
                        source,
                        section: currentSection,
                    }
                });
                chunkIndex++;
                // Keep overlap from end of current chunk
                const words = currentChunk.split(' ');
                const overlapWords = Math.ceil(overlap / 5); // ~5 chars per word
                currentChunk = words.slice(-overlapWords).join(' ') + ' ' + trimmed;
            } else {
                currentChunk += (currentChunk ? ' ' : '') + trimmed;
            }
        }

        // Final chunk
        if (currentChunk.trim()) {
            chunks.push({
                id: `${source}-chunk-${chunkIndex}`,
                text: currentChunk.trim(),
                metadata: { source, section: currentSection }
            });
        }

        return chunks;
    }

    /**
     * Simple cosine similarity between two vectors.
     * cos(A, B) = (A·B) / (‖A‖·‖B‖)
     */
    static cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;
        let dotProduct = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Build the AI prompt for full research report generation.
     * This prompt is consumed by the Agent API route for streaming generation.
     */
    static buildResearchPrompt(report: ResearchReport): string {
        const metricsStr = report.sections
            .filter(s => s.keyMetrics && s.keyMetrics.length > 0)
            .map(s => `【${s.title}】\n${s.keyMetrics!.map(m => `  ${m.label}: ${m.value}`).join('\n')}`)
            .join('\n\n');

        const risksStr = report.riskFactors
            .map(r => `  [${r.severity.toUpperCase()}] ${r.category}: ${r.description}`)
            .join('\n');

        const guidanceStr = report.guidanceItems.length > 0
            ? report.guidanceItems.map(g => `  ${g.metric} (${g.period}): ${g.lowEnd} - ${g.highEnd} [${g.direction}]`).join('\n')
            : '  No guidance data available';

        return `Generate a comprehensive institutional-grade equity research report for ${report.companyName} (${report.symbol}).

Current Price: $${report.currentPrice}
Preliminary Rating: ${report.rating}
${report.priceTarget ? `Price Target: $${report.priceTarget} (${report.upside?.toFixed(1)}% upside)` : ''}

FINANCIAL METRICS:
${metricsStr || 'No detailed metrics available — use market knowledge to provide analysis.'}

MANAGEMENT GUIDANCE:
${guidanceStr}

RISK FACTORS:
${risksStr}

Please structure the report as follows:
1. **Executive Summary / Investment Thesis** — 2-3 paragraph actionable thesis
2. **Business Overview** — competitive position, moat analysis, TAM
3. **Financial Deep-Dive** — margin trends, FCF quality, capital allocation
4. **Valuation Analysis** — DCF scenario, relative valuation vs peers
5. **Risk Assessment** — key risks with probability-weighted impact
6. **Catalysts & Timeline** — near-term and long-term catalysts
7. **Price Target & Rating Justification** — methodology and conviction level

Use a professional, analytical tone. Support conclusions with quantitative evidence.`;
    }

    private static formatLargeNumber(num: number): string {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
        return `$${num.toLocaleString()}`;
    }
}
