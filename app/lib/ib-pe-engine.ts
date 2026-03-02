/**
 * IBPEEngine — Investment Banking & Private Equity Tooling
 * 
 * Provides deal-level analytical tools for investment banking and
 * private equity workflows including CIM generation, deal scoring,
 * LBO modeling, and comparable company analysis.
 * 
 * @module FinancialServices/core — Investment Banking & PE Plugin
 */

// ============================================================
// Type Definitions
// ============================================================

export interface CIMRequest {
    companyName: string;
    industry: string;
    description: string;
    foundedYear?: number;
    headquarters?: string;
    employees?: number;
    revenue?: number;
    ebitda?: number;
    ebitdaMargin?: number;
    revenueGrowth?: number;
    keyProducts?: string[];
    competitiveAdvantages?: string[];
    managementTeam?: { name: string; title: string; bio?: string }[];
    financialHighlights?: { year: number; revenue: number; ebitda: number; netIncome: number }[];
}

export interface CIMTemplate {
    title: string;
    date: string;
    disclaimer: string;
    sections: CIMSection[];
}

export interface CIMSection {
    id: string;
    title: string;
    icon: string;
    subsections: { title: string; content: string; dataPoints?: { label: string; value: string }[] }[];
}

export interface DealScoringRequest {
    companyName: string;
    /** Each dimension rated 1-10 */
    scores: {
        marketPosition: number;
        financialHealth: number;
        managementQuality: number;
        growthPotential: number;
        regulatoryRisk: number;
        esgCompliance: number;
        synergyPotential: number;
        valuationAttractiveness: number;
    };
    /** Optional custom weights (sum to 1.0) */
    weights?: {
        marketPosition: number;
        financialHealth: number;
        managementQuality: number;
        growthPotential: number;
        regulatoryRisk: number;
        esgCompliance: number;
        synergyPotential: number;
        valuationAttractiveness: number;
    };
}

export interface DealScoringResult {
    companyName: string;
    overallScore: number;
    rating: 'Highly Attractive' | 'Attractive' | 'Neutral' | 'Cautious' | 'Pass';
    dimensions: DealDimension[];
    radarChartData: { dimension: string; score: number; weight: number; weightedScore: number }[];
    recommendation: string;
}

export interface DealDimension {
    name: string;
    score: number;
    weight: number;
    weightedScore: number;
    assessment: string;
    color: string;
}

export interface LBOInputs {
    /** Enterprise Value (purchase price) */
    enterpriseValue: number;
    /** Amount of debt used in acquisition */
    debtAmount: number;
    /** Equity contribution = EV - Debt */
    equityContribution?: number;
    /** Annual interest rate on debt */
    interestRate: number;
    /** Projected EBITDA for each year */
    projectedEBITDA: number[];
    /** Annual mandatory debt repayment (amortization) */
    annualDebtRepayment: number;
    /** Exit multiple (EV/EBITDA at exit) */
    exitMultiple: number;
    /** Tax rate */
    taxRate: number;
    /** CapEx as % of EBITDA */
    capexPercent: number;
    /** Change in working capital as % of EBITDA */
    nwcChangePercent: number;
}

export interface LBOResult {
    equityContribution: number;
    exitYear: number;
    exitEnterpriseValue: number;
    exitEquityValue: number;
    /** Money on Invested Capital */
    moic: number;
    /** Internal Rate of Return — annualized */
    irr: number;
    debtSchedule: DebtScheduleYear[];
    cashFlowSummary: LBOCashFlow[];
    /** Leverage ratios over time */
    leverageProfile: { year: number; debtToEbitda: number; interestCoverage: number }[];
}

export interface DebtScheduleYear {
    year: number;
    beginningDebt: number;
    interestPayment: number;
    mandatoryRepayment: number;
    optionalRepayment: number;
    endingDebt: number;
}

export interface LBOCashFlow {
    year: number;
    ebitda: number;
    interest: number;
    taxes: number;
    capex: number;
    nwcChange: number;
    freeCashFlow: number;
    debtRepayment: number;
}

export interface CompsRequest {
    targetSymbol: string;
    targetMetrics: CompanyMetrics;
    peers: { symbol: string; metrics: CompanyMetrics }[];
}

export interface CompanyMetrics {
    name?: string;
    marketCap?: number;
    enterpriseValue?: number;
    revenue?: number;
    ebitda?: number;
    netIncome?: number;
    eps?: number;
    revenueGrowth?: number;
    ebitdaMargin?: number;
}

export interface CompsResult {
    targetSymbol: string;
    multiples: CompsMultiple[];
    impliedValuations: { method: string; impliedEV: number; impliedPrice: number | null }[];
    summary: string;
}

export interface CompsMultiple {
    metric: string;
    target: number | null;
    peerMedian: number;
    peerMean: number;
    peerMin: number;
    peerMax: number;
    peers: { symbol: string; value: number | null }[];
    premium: number | null;
}

// ============================================================
// IBPEEngine Class
// ============================================================

export class IBPEEngine {

    /**
     * Generate a Confidential Information Memorandum (CIM) template.
     * 
     * CIM is the primary marketing document in M&A sell-side processes.
     * Standard structure follows Goldman Sachs / Morgan Stanley conventions.
     */
    static generateCIM(request: CIMRequest): CIMTemplate {
        const { companyName, industry, description, revenue, ebitda, ebitdaMargin, revenueGrowth } = request;

        const sections: CIMSection[] = [];

        // I. Executive Summary
        sections.push({
            id: 'executive_summary',
            title: 'I. Executive Summary',
            icon: '📋',
            subsections: [
                {
                    title: 'Investment Highlights',
                    content: `${companyName} represents a compelling investment opportunity in the ${industry} sector. ${description}`,
                    dataPoints: [
                        { label: 'Industry', value: industry },
                        { label: 'Founded', value: request.foundedYear?.toString() || 'N/A' },
                        { label: 'Headquarters', value: request.headquarters || 'N/A' },
                        { label: 'Employees', value: request.employees?.toLocaleString() || 'N/A' },
                    ]
                },
                {
                    title: 'Financial Snapshot',
                    content: 'Key financial metrics demonstrate strong operational performance and growth trajectory.',
                    dataPoints: [
                        { label: 'Revenue', value: revenue ? `$${this.formatNum(revenue)}` : 'N/A' },
                        { label: 'EBITDA', value: ebitda ? `$${this.formatNum(ebitda)}` : 'N/A' },
                        { label: 'EBITDA Margin', value: ebitdaMargin ? `${(ebitdaMargin * 100).toFixed(1)}%` : 'N/A' },
                        { label: 'Revenue Growth', value: revenueGrowth ? `${(revenueGrowth * 100).toFixed(1)}%` : 'N/A' },
                    ]
                }
            ]
        });

        // II. Business Overview
        sections.push({
            id: 'business_overview',
            title: 'II. Business Overview',
            icon: '🏢',
            subsections: [
                {
                    title: 'Company Description',
                    content: description,
                },
                {
                    title: 'Products & Services',
                    content: request.keyProducts && request.keyProducts.length > 0
                        ? `The company offers a diversified portfolio: ${request.keyProducts.join(', ')}.`
                        : 'Detailed product/service breakdown to be populated.',
                },
                {
                    title: 'Competitive Positioning',
                    content: request.competitiveAdvantages && request.competitiveAdvantages.length > 0
                        ? `Key competitive advantages include: ${request.competitiveAdvantages.join('; ')}.`
                        : 'Competitive moat analysis to be populated.',
                }
            ]
        });

        // III. Industry Overview
        sections.push({
            id: 'industry_overview',
            title: 'III. Industry Overview',
            icon: '🌐',
            subsections: [
                {
                    title: 'Market Size & Dynamics',
                    content: `The ${industry} market presents significant opportunities driven by secular growth trends. TAM/SAM/SOM analysis pending detailed market research input.`,
                },
                {
                    title: 'Competitive Landscape',
                    content: 'Competitive dynamics, market share distribution, and barriers to entry analysis.',
                }
            ]
        });

        // IV. Financial Overview
        sections.push({
            id: 'financial_overview',
            title: 'IV. Financial Overview',
            icon: '📊',
            subsections: [
                {
                    title: 'Historical Performance',
                    content: request.financialHighlights && request.financialHighlights.length > 0
                        ? 'The company has demonstrated consistent financial performance:'
                        : 'Historical financial data to be populated.',
                    dataPoints: request.financialHighlights?.map(fh => ({
                        label: `FY${fh.year}`,
                        value: `Rev: $${this.formatNum(fh.revenue)} | EBITDA: $${this.formatNum(fh.ebitda)} | NI: $${this.formatNum(fh.netIncome)}`
                    }))
                },
                {
                    title: 'Key Financial Metrics',
                    content: 'Detailed margin analysis, capital structure overview, and cash flow quality assessment.',
                }
            ]
        });

        // V. Management Team
        sections.push({
            id: 'management',
            title: 'V. Management Team',
            icon: '👥',
            subsections: [
                {
                    title: 'Senior Leadership',
                    content: request.managementTeam && request.managementTeam.length > 0
                        ? request.managementTeam.map(m => `**${m.name}** — ${m.title}${m.bio ? `: ${m.bio}` : ''}`).join('\n\n')
                        : 'Management team profiles to be populated.',
                }
            ]
        });

        // VI. Growth Strategy
        sections.push({
            id: 'growth_strategy',
            title: 'VI. Growth Strategy',
            icon: '🚀',
            subsections: [
                {
                    title: 'Organic Growth Initiatives',
                    content: 'Product expansion, geographic penetration, and customer acquisition strategy overview.',
                },
                {
                    title: 'Inorganic Growth / M&A Pipeline',
                    content: 'Targeted bolt-on acquisitions and strategic partnership opportunities.',
                }
            ]
        });

        // VII. Transaction Considerations
        sections.push({
            id: 'transaction',
            title: 'VII. Transaction Considerations',
            icon: '🤝',
            subsections: [
                {
                    title: 'Process Overview',
                    content: 'This process is being conducted on a confidential basis. Interested parties are invited to submit preliminary indications of interest.',
                },
                {
                    title: 'Key Transaction Terms',
                    content: 'Structure, timeline, due diligence procedures, and exclusivity provisions to be discussed.',
                }
            ]
        });

        return {
            title: `Confidential Information Memorandum — ${companyName}`,
            date: new Date().toISOString().split('T')[0],
            disclaimer: `This Confidential Information Memorandum ("CIM") has been prepared by the Company and its advisors solely for use by prospective acquirers in evaluating a potential transaction. This CIM does not constitute an offer to sell or a solicitation of an offer to buy any securities. All information herein is strictly confidential and may not be reproduced or distributed without prior written consent.`,
            sections
        };
    }

    /**
     * Deal Scoring Matrix — Weighted Risk Assessment.
     * 
     * Methodology:
     * ───────────────────────────────────────────────────────────
     * Each dimension is scored 1-10 and weighted (default equal weights).
     * Overall Score = Σ(wᵢ × sᵢ) where wᵢ = weight, sᵢ = score
     * 
     * Rating thresholds:
     *   8.0-10.0 = Highly Attractive
     *   6.5-7.9  = Attractive
     *   5.0-6.4  = Neutral
     *   3.5-4.9  = Cautious
     *   1.0-3.4  = Pass
     * ───────────────────────────────────────────────────────────
     */
    static scoreDeal(request: DealScoringRequest): DealScoringResult {
        const defaultWeights = {
            marketPosition: 0.15,
            financialHealth: 0.15,
            managementQuality: 0.10,
            growthPotential: 0.15,
            regulatoryRisk: 0.10,
            esgCompliance: 0.10,
            synergyPotential: 0.10,
            valuationAttractiveness: 0.15,
        };

        const weights = request.weights || defaultWeights;
        const { scores } = request;

        const dimensionConfig: { key: keyof typeof scores; name: string; color: string }[] = [
            { key: 'marketPosition', name: 'Market Position', color: '#6366f1' },
            { key: 'financialHealth', name: 'Financial Health', color: '#10b981' },
            { key: 'managementQuality', name: 'Management Quality', color: '#f59e0b' },
            { key: 'growthPotential', name: 'Growth Potential', color: '#ec4899' },
            { key: 'regulatoryRisk', name: 'Regulatory Risk', color: '#ef4444' },
            { key: 'esgCompliance', name: 'ESG Compliance', color: '#22d3ee' },
            { key: 'synergyPotential', name: 'Synergy Potential', color: '#8b5cf6' },
            { key: 'valuationAttractiveness', name: 'Valuation', color: '#f97316' },
        ];

        const dimensions: DealDimension[] = dimensionConfig.map(({ key, name, color }) => {
            const score = Math.min(10, Math.max(1, scores[key]));
            const weight = weights[key];
            const weightedScore = score * weight;
            let assessment = '';

            if (score >= 8) assessment = 'Strong — exceeds benchmark expectations.';
            else if (score >= 6) assessment = 'Adequate — meets minimum threshold.';
            else if (score >= 4) assessment = 'Below average — requires deeper due diligence.';
            else assessment = 'Weak — significant concern identified.';

            return { name, score, weight, weightedScore, assessment, color };
        });

        const overallScore = dimensions.reduce((sum, d) => sum + d.weightedScore, 0);

        let rating: DealScoringResult['rating'];
        if (overallScore >= 8.0) rating = 'Highly Attractive';
        else if (overallScore >= 6.5) rating = 'Attractive';
        else if (overallScore >= 5.0) rating = 'Neutral';
        else if (overallScore >= 3.5) rating = 'Cautious';
        else rating = 'Pass';

        const weakDimensions = dimensions.filter(d => d.score < 5);
        const strongDimensions = dimensions.filter(d => d.score >= 8);

        let recommendation = `Overall deal attractiveness: ${rating} (${overallScore.toFixed(1)}/10). `;
        if (strongDimensions.length > 0) {
            recommendation += `Key strengths: ${strongDimensions.map(d => d.name).join(', ')}. `;
        }
        if (weakDimensions.length > 0) {
            recommendation += `Areas of concern: ${weakDimensions.map(d => d.name).join(', ')} — recommend enhanced due diligence on these dimensions.`;
        }

        const radarChartData = dimensions.map(d => ({
            dimension: d.name,
            score: d.score,
            weight: d.weight,
            weightedScore: d.weightedScore
        }));

        return {
            companyName: request.companyName,
            overallScore,
            rating,
            dimensions,
            radarChartData,
            recommendation
        };
    }

    /**
     * Leveraged Buyout (LBO) Model — Multi-Tranche Debt Waterfall (v2.0).
     * 
     * Mathematical framework:
     * ───────────────────────────────────────────────────────────
     * Purchase: EV = Debt + Equity
     * 
     * v2.0 Multi-Tranche Debt Structure:
     *   Tranche 1: Revolver (drawn as needed, SOFR-based)
     *   Tranche 2: Senior Term Loan A (mandatory amortization)
     *   Tranche 3: Mezzanine / Subordinated (PIK interest)
     * 
     * Repayment Waterfall Priority:
     *   1. Mandatory amortization on Senior TLA
     *   2. Cash Sweep: cashSweepPct × excess FCF → Senior first, then Mezz
     *   3. PIK interest on Mezzanine accrues to principal
     * 
     * Annual Free Cash Flow:
     *   FCF = EBITDA − Interest − Taxes − CapEx − ΔNWC
     * 
     * Exit:
     *   Exit EV = Exit EBITDA × Exit Multiple
     *   Exit Equity = Exit EV − Total Remaining Debt
     * 
     * Returns:
     *   MOIC = Exit Equity / Initial Equity
     *   IRR: r = (MOIC)^(1/n) − 1
     * ───────────────────────────────────────────────────────────
     */
    static calculateLBO(inputs: LBOInputs): LBOResult {
        const {
            enterpriseValue, debtAmount, interestRate,
            projectedEBITDA, annualDebtRepayment, exitMultiple,
            taxRate, capexPercent, nwcChangePercent
        } = inputs;

        const equityContribution = inputs.equityContribution ?? (enterpriseValue - debtAmount);
        const exitYear = projectedEBITDA.length;

        // Multi-tranche debt allocation (v2.0)
        // Split total debt: 10% Revolver, 60% Senior TLA, 30% Mezzanine
        let revolverBalance = debtAmount * 0.10;
        let seniorBalance = debtAmount * 0.60;
        let mezzBalance = debtAmount * 0.30;

        // Tranche-specific rates
        const revolverRate = interestRate * 0.85;     // Lower spread
        const seniorRate = interestRate;               // Base rate
        const mezzCashRate = interestRate * 0.60;      // Lower cash pay
        const mezzPIKRate = interestRate * 0.60;       // PIK portion
        const cashSweepPct = 0.75;                     // 75% of excess FCF

        const debtSchedule: DebtScheduleYear[] = [];
        const cashFlowSummary: LBOCashFlow[] = [];
        const leverageProfile: LBOResult['leverageProfile'] = [];

        for (let yr = 0; yr < exitYear; yr++) {
            const ebitda = projectedEBITDA[yr];
            const totalDebt = revolverBalance + seniorBalance + mezzBalance;

            // Interest by tranche
            const revolverInterest = revolverBalance * revolverRate;
            const seniorInterest = seniorBalance * seniorRate;
            const mezzCashInterest = mezzBalance * mezzCashRate;
            const mezzPIKInterest = mezzBalance * mezzPIKRate;
            const totalCashInterest = revolverInterest + seniorInterest + mezzCashInterest;

            // PIK accrues to mezzanine principal
            mezzBalance += mezzPIKInterest;

            const capex = ebitda * capexPercent;
            const nwcChange = ebitda * nwcChangePercent;
            const ebt = ebitda - totalCashInterest - capex - nwcChange;
            const taxes = Math.max(0, ebt * taxRate);
            const fcf = ebt - taxes;

            // Mandatory repayment on Senior TLA
            const mandatoryRepay = Math.min(annualDebtRepayment, seniorBalance);
            seniorBalance -= mandatoryRepay;

            // Cash sweep: 75% of remaining FCF goes to debt repayment
            const remainingFCF = Math.max(0, fcf - mandatoryRepay);
            const sweepAmount = remainingFCF * cashSweepPct;

            // Waterfall: Revolver first, then Senior, then Mezz
            let sweepRemaining = sweepAmount;
            const revolverRepay = Math.min(sweepRemaining, revolverBalance);
            revolverBalance -= revolverRepay;
            sweepRemaining -= revolverRepay;

            const seniorSweepRepay = Math.min(sweepRemaining, seniorBalance);
            seniorBalance -= seniorSweepRepay;
            sweepRemaining -= seniorSweepRepay;

            const mezzRepay = Math.min(sweepRemaining, mezzBalance);
            mezzBalance -= mezzRepay;

            const totalRepay = mandatoryRepay + revolverRepay + seniorSweepRepay + mezzRepay;
            const endingDebt = revolverBalance + seniorBalance + mezzBalance;

            debtSchedule.push({
                year: yr + 1,
                beginningDebt: totalDebt,
                interestPayment: totalCashInterest,
                mandatoryRepayment: mandatoryRepay,
                optionalRepayment: revolverRepay + seniorSweepRepay + mezzRepay,
                endingDebt
            });

            cashFlowSummary.push({
                year: yr + 1,
                ebitda,
                interest: totalCashInterest,
                taxes,
                capex,
                nwcChange,
                freeCashFlow: fcf,
                debtRepayment: totalRepay
            });

            leverageProfile.push({
                year: yr + 1,
                debtToEbitda: ebitda > 0 ? endingDebt / ebitda : Infinity,
                interestCoverage: totalCashInterest > 0 ? ebitda / totalCashInterest : Infinity
            });
        }

        // Exit calculation
        const exitEBITDA = projectedEBITDA[exitYear - 1];
        const exitEV = exitEBITDA * exitMultiple;
        const totalRemainingDebt = revolverBalance + seniorBalance + mezzBalance;
        const exitEquity = exitEV - totalRemainingDebt;

        // Returns
        const moic = equityContribution > 0 ? exitEquity / equityContribution : 0;

        // IRR: solve (1+r)^n = MOIC → r = MOIC^(1/n) − 1
        const irr = moic > 0
            ? Math.pow(moic, 1 / exitYear) - 1
            : -1;

        return {
            equityContribution,
            exitYear,
            exitEnterpriseValue: exitEV,
            exitEquityValue: exitEquity,
            moic,
            irr,
            debtSchedule,
            cashFlowSummary,
            leverageProfile
        };
    }

    /**
     * Comparable Company Analysis (Trading Comps) — with IQR Outlier Filtering (v2.0).
     * 
     * Calculates key valuation multiples for the target and peer group:
     *   - EV/Revenue
     *   - EV/EBITDA
     *   - P/E (Market Cap / Net Income)
     * 
     * v2.0 Enhancement: IQR-Based Robust Filtering
     * ───────────────────────────────────────────────────────────
     * Before computing peer medians, outliers are identified using:
     *   Q1 = 25th percentile, Q3 = 75th percentile
     *   IQR = Q3 - Q1
     *   Valid range = [Q1 - 1.5×IQR, Q3 + 1.5×IQR]
     * 
     * Peers outside this range (e.g., near-bankrupt or hyper-inflated)
     * are excluded from median/mean calculations.
     * ───────────────────────────────────────────────────────────
     */
    static comparableAnalysis(request: CompsRequest): CompsResult {
        const { targetSymbol, targetMetrics, peers } = request;

        // IQR-based outlier filter utility
        const filterOutliers = (values: number[]): number[] => {
            if (values.length < 4) return values; // Not enough data for IQR
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lower = q1 - 1.5 * iqr;
            const upper = q3 + 1.5 * iqr;
            return sorted.filter(v => v >= lower && v <= upper);
        };

        const multipleCalcs: {
            metric: string;
            calcTarget: (m: CompanyMetrics) => number | null;
            calcEV: (val: number, target: CompanyMetrics) => number;
        }[] = [
                {
                    metric: 'EV / Revenue',
                    calcTarget: m => m.enterpriseValue && m.revenue ? m.enterpriseValue / m.revenue : null,
                    calcEV: (median, t) => median * (t.revenue || 0),
                },
                {
                    metric: 'EV / EBITDA',
                    calcTarget: m => m.enterpriseValue && m.ebitda ? m.enterpriseValue / m.ebitda : null,
                    calcEV: (median, t) => median * (t.ebitda || 0),
                },
                {
                    metric: 'P / E',
                    calcTarget: m => m.marketCap && m.netIncome && m.netIncome > 0 ? m.marketCap / m.netIncome : null,
                    calcEV: (median, t) => median * (t.netIncome || 0),
                },
            ];

        const multiples: CompsMultiple[] = [];
        const impliedValuations: CompsResult['impliedValuations'] = [];

        for (const { metric, calcTarget, calcEV } of multipleCalcs) {
            const targetVal = calcTarget(targetMetrics);
            const peerValues = peers.map(p => ({
                symbol: p.symbol,
                value: calcTarget(p.metrics)
            }));

            const rawPeerValues = peerValues
                .map(p => p.value)
                .filter((v): v is number => v !== null && !isNaN(v) && isFinite(v))
                .sort((a, b) => a - b);

            if (rawPeerValues.length === 0) continue;

            // Apply IQR filtering to remove outliers (v2.0)
            const validPeerValues = filterOutliers(rawPeerValues);
            if (validPeerValues.length === 0) continue;

            const peerMedian = validPeerValues[Math.floor(validPeerValues.length / 2)];
            const peerMean = validPeerValues.reduce((s, v) => s + v, 0) / validPeerValues.length;
            const peerMin = validPeerValues[0];
            const peerMax = validPeerValues[validPeerValues.length - 1];

            const premium = targetVal !== null ? ((targetVal - peerMedian) / peerMedian) * 100 : null;

            multiples.push({
                metric,
                target: targetVal,
                peerMedian,
                peerMean,
                peerMin,
                peerMax,
                peers: peerValues,
                premium
            });

            // Implied valuation from peer median
            const impliedEV = calcEV(peerMedian, targetMetrics);
            if (impliedEV > 0) {
                impliedValuations.push({
                    method: `${metric} (Peer Median)`,
                    impliedEV,
                    impliedPrice: null // Would need shares outstanding
                });
            }
        }

        const avgImpliedEV = impliedValuations.length > 0
            ? impliedValuations.reduce((s, v) => s + v.impliedEV, 0) / impliedValuations.length
            : 0;

        const summary = `Comparable analysis for ${targetSymbol} against ${peers.length} peers (IQR-filtered). ` +
            `Average implied EV: $${this.formatNum(avgImpliedEV)}. ` +
            (targetMetrics.enterpriseValue
                ? `Current EV: $${this.formatNum(targetMetrics.enterpriseValue)} — ${avgImpliedEV > targetMetrics.enterpriseValue ? 'potential upside' : 'premium to peers'}.`
                : '');

        return { targetSymbol, multiples, impliedValuations, summary };
    }

    private static formatNum(num: number): string {
        if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
        return num.toFixed(0);
    }
}
