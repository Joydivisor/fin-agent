/**
 * PortfolioOptimizer — Markowitz Mean-Variance Optimization & Tax Management
 * 
 * Implements Modern Portfolio Theory (MPT) with efficient frontier generation,
 * Sharpe ratio maximization, tax-loss harvesting, and risk decomposition.
 * 
 * Mathematical Framework:
 * ───────────────────────────────────────────────────────────
 * The Markowitz optimization problem:
 *   min  w'Σw                    (minimize portfolio variance)
 *   s.t. w'μ = μₜ               (target return constraint)
 *        Σwᵢ = 1                 (fully invested constraint)
 *        wᵢ ≥ 0  ∀i             (no short selling, optional)
 * 
 * where:
 *   w = weight vector (N×1)
 *   Σ = covariance matrix (N×N)
 *   μ = expected return vector (N×1)
 *   μₜ = target portfolio return
 * 
 * The solution traces out the Efficient Frontier — the set of
 * portfolios offering maximum return for each level of risk.
 * ───────────────────────────────────────────────────────────
 * 
 * @module FinancialServices/core — Wealth Management Plugin
 */

// ============================================================
// Type Definitions
// ============================================================

export interface PortfolioHolding {
    symbol: string;
    name?: string;
    shares: number;
    currentPrice: number;
    costBasis: number;
    /** Annualized expected return (e.g., 0.12 for 12%) */
    expectedReturn?: number;
    /** Annualized volatility (e.g., 0.25 for 25%) */
    volatility?: number;
    /** Asset class for diversification analysis */
    assetClass?: 'equity' | 'fixed_income' | 'commodity' | 'crypto' | 'reit' | 'cash';
    /** Holding period in days — for tax treatment */
    holdingDays?: number;
}

export interface PortfolioAnalysis {
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalReturn: number;
    holdings: HoldingAnalysis[];
    allocation: AllocationBreakdown[];
    riskMetrics: RiskMetrics;
}

export interface HoldingAnalysis {
    symbol: string;
    marketValue: number;
    weight: number;
    gainLoss: number;
    returnPct: number;
    isUnrealizedLoss: boolean;
    isLongTerm: boolean;
}

export interface AllocationBreakdown {
    assetClass: string;
    weight: number;
    value: number;
    color: string;
}

export interface RiskMetrics {
    /** Portfolio expected return */
    expectedReturn: number;
    /** Portfolio volatility (std dev) */
    volatility: number;
    /** Sharpe Ratio = (μp - Rf) / σp */
    sharpeRatio: number;
    /** Value at Risk (95%) — maximum expected loss in 1 day */
    var95: number;
    /** Conditional VaR (95%) — expected loss beyond VaR */
    cvar95: number;
    /** Maximum drawdown estimate */
    maxDrawdownEstimate: number;
    /** Beta relative to market (assumed SPY) */
    portfolioBeta: number;
}

export interface EfficientFrontierPoint {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    weights: { symbol: string; weight: number }[];
}

export interface OptimizationResult {
    optimalPortfolio: EfficientFrontierPoint;
    efficientFrontier: EfficientFrontierPoint[];
    currentPortfolio: { expectedReturn: number; volatility: number; sharpeRatio: number };
    rebalancingActions: RebalancingAction[];
}

export interface RebalancingAction {
    symbol: string;
    currentWeight: number;
    targetWeight: number;
    action: 'buy' | 'sell' | 'hold';
    amount: number;
    reason: string;
}

export interface TaxLossHarvestResult {
    totalHarvestableLoss: number;
    taxSavingsEstimate: number;
    candidates: TaxLossCandidate[];
}

export interface TaxLossCandidate {
    symbol: string;
    unrealizedLoss: number;
    costBasis: number;
    currentValue: number;
    holdingDays: number;
    isLongTerm: boolean;
    /** Tax rate applied (short-term = ordinary income, long-term = capital gains) */
    taxRate: number;
    taxSaving: number;
    /** Suggested replacement ETF/security to maintain exposure */
    suggestedReplacement: { symbol: string; name: string; correlation: number };
    /** Wash sale risk flag */
    washSaleRisk: boolean;
}

export interface MonteCarloResult {
    percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
    paths: number[][];
    finalValues: number[];
    probabilityOfLoss: number;
}

// ============================================================
// Matrix Utility Functions (minimal linear algebra for N≤20 assets)
// ============================================================

/**
 * Matrix multiplication: C = A × B
 * A: m×n, B: n×p → C: m×p
 */
function matMul(A: number[][], B: number[][]): number[][] {
    const m = A.length, n = B[0].length, k = B.length;
    const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            for (let l = 0; l < k; l++)
                C[i][j] += A[i][l] * B[l][j];
    return C;
}

/**
 * Matrix transpose
 */
function transpose(A: number[][]): number[][] {
    const m = A.length, n = A[0].length;
    const T: number[][] = Array.from({ length: n }, () => new Array(m).fill(0));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            T[j][i] = A[i][j];
    return T;
}

/**
 * Invert a symmetric positive-definite matrix using Cholesky decomposition.
 * 
 * For the covariance matrix Σ (which is SPD by construction):
 *   Σ = LL'  →  Σ⁻¹ = (L')⁻¹ L⁻¹
 * 
 * This is numerically stable and efficient for small matrices.
 */
function invertSPD(M: number[][]): number[][] {
    const n = M.length;
    // Cholesky decomposition: M = L·L'
    const L: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
            if (i === j) {
                const val = M[i][i] - sum;
                L[i][j] = Math.sqrt(Math.max(val, 1e-12));
            } else {
                L[i][j] = (M[i][j] - sum) / L[j][j];
            }
        }
    }

    // Invert L (forward substitution)
    const Linv: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
        Linv[i][i] = 1 / L[i][i];
        for (let j = i + 1; j < n; j++) {
            let sum = 0;
            for (let k = i; k < j; k++) sum += L[j][k] * Linv[k][i];
            Linv[j][i] = -sum / L[j][j];
        }
    }

    // M⁻¹ = (L')⁻¹ · L⁻¹ = Linv' · Linv
    return matMul(transpose(Linv), Linv);
}

// ============================================================
// PortfolioOptimizer Class
// ============================================================

export class PortfolioOptimizer {

    /**
     * Analyze current portfolio — compute weights, returns, risk metrics.
     */
    static analyzePortfolio(
        holdings: PortfolioHolding[],
        riskFreeRate: number = 0.045
    ): PortfolioAnalysis {
        const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
        const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.costBasis, 0);
        const totalGainLoss = totalValue - totalCost;
        const totalReturn = totalCost > 0 ? totalGainLoss / totalCost : 0;

        const holdingAnalysis: HoldingAnalysis[] = holdings.map(h => {
            const marketValue = h.shares * h.currentPrice;
            const gainLoss = h.shares * (h.currentPrice - h.costBasis);
            return {
                symbol: h.symbol,
                marketValue,
                weight: totalValue > 0 ? marketValue / totalValue : 0,
                gainLoss,
                returnPct: h.costBasis > 0 ? (h.currentPrice - h.costBasis) / h.costBasis : 0,
                isUnrealizedLoss: gainLoss < 0,
                isLongTerm: (h.holdingDays || 0) > 365
            };
        });

        // Allocation by asset class
        const classColors: Record<string, string> = {
            equity: '#6366f1', fixed_income: '#10b981', commodity: '#f59e0b',
            crypto: '#ec4899', reit: '#8b5cf6', cash: '#64748b'
        };
        const classMap = new Map<string, number>();
        for (const h of holdings) {
            const cls = h.assetClass || 'equity';
            classMap.set(cls, (classMap.get(cls) || 0) + h.shares * h.currentPrice);
        }
        const allocation: AllocationBreakdown[] = Array.from(classMap.entries()).map(([cls, val]) => ({
            assetClass: cls,
            weight: totalValue > 0 ? val / totalValue : 0,
            value: val,
            color: classColors[cls] || '#94a3b8'
        }));

        // Portfolio risk metrics
        const weights = holdingAnalysis.map(h => h.weight);
        const returns = holdings.map(h => h.expectedReturn || 0.10);
        const vols = holdings.map(h => h.volatility || 0.25);

        const portfolioReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);
        // Simplified portfolio vol (assumes correlation = 0.5 between all assets)
        let portfolioVar = 0;
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < weights.length; j++) {
                const corr = i === j ? 1.0 : 0.5;
                portfolioVar += weights[i] * weights[j] * vols[i] * vols[j] * corr;
            }
        }
        const portfolioVol = Math.sqrt(portfolioVar);
        const sharpeRatio = portfolioVol > 0 ? (portfolioReturn - riskFreeRate) / portfolioVol : 0;

        // VaR & CVaR (parametric, normal assumption)
        // VaR(95%) = μ - 1.645σ (daily, scaled from annual)
        const dailyVol = portfolioVol / Math.sqrt(252);
        const dailyReturn = portfolioReturn / 252;
        const var95 = -(dailyReturn - 1.645 * dailyVol) * totalValue;
        const cvar95 = -(dailyReturn - 2.063 * dailyVol) * totalValue; // E[X | X < VaR]

        const riskMetrics: RiskMetrics = {
            expectedReturn: portfolioReturn,
            volatility: portfolioVol,
            sharpeRatio,
            var95: Math.max(0, var95),
            cvar95: Math.max(0, cvar95),
            maxDrawdownEstimate: portfolioVol * 2.5, // Rule of thumb
            portfolioBeta: 1.0 // Default; would need market data for actual computation
        };

        return { totalValue, totalCost, totalGainLoss, totalReturn, holdings: holdingAnalysis, allocation, riskMetrics };
    }

    /**
     * Generate the efficient frontier and find the optimal portfolio.
     * 
     * Mathematical approach (analytical solution for the unconstrained case):
     * ───────────────────────────────────────────────────────────
     * Using the Lagrangian method, the optimal weights for a target return μₜ:
     *   L = w'Σw − λ₁(w'μ − μₜ) − λ₂(w'1 − 1)
     * 
     * First-order conditions yield:
     *   w* = Σ⁻¹(λ₁μ + λ₂1)
     * 
     * The analytical solution involves:
     *   A = 1'Σ⁻¹μ,  B = μ'Σ⁻¹μ,  C = 1'Σ⁻¹1,  D = BC − A²
     * 
     *   w*(μₜ) = (1/D)[B(Σ⁻¹·1) − A(Σ⁻¹·μ)] + (μₜ/D)[C(Σ⁻¹·μ) − A(Σ⁻¹·1)]
     * 
     * Minimum variance portfolio: μ_mv = A/C, σ²_mv = 1/C
     * ───────────────────────────────────────────────────────────
     * 
     * For practical implementation with non-negativity constraints,
     * we use a grid search approach for small portfolios (N ≤ 20).
     */
    static optimizePortfolio(
        holdings: PortfolioHolding[],
        riskFreeRate: number = 0.045,
        numFrontierPoints: number = 30
    ): OptimizationResult {
        const n = holdings.length;
        const returns = holdings.map(h => h.expectedReturn || 0.10);
        const vols = holdings.map(h => h.volatility || 0.25);

        // Build covariance matrix Σ with default correlation structure
        // ρ(i,j) = 0.3 for same asset class, 0.1 for different
        const covMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const corr = i === j ? 1.0 :
                    (holdings[i].assetClass === holdings[j].assetClass ? 0.5 : 0.2);
                covMatrix[i][j] = vols[i] * vols[j] * corr;
            }
        }

        // Current portfolio state
        const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
        const currentWeights = holdings.map(h => totalValue > 0 ? (h.shares * h.currentPrice) / totalValue : 1 / n);
        const currentReturn = currentWeights.reduce((sum, w, i) => sum + w * returns[i], 0);
        let currentVar = 0;
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++)
                currentVar += currentWeights[i] * currentWeights[j] * covMatrix[i][j];
        const currentVol = Math.sqrt(currentVar);
        const currentSharpe = currentVol > 0 ? (currentReturn - riskFreeRate) / currentVol : 0;

        // Generate efficient frontier by varying target return
        const minReturn = Math.min(...returns) * 0.5;
        const maxReturn = Math.max(...returns) * 1.2;
        const frontierPoints: EfficientFrontierPoint[] = [];
        let bestSharpe = -Infinity;
        let optimalPoint: EfficientFrontierPoint | null = null;

        // For analytical solution, try to invert covariance matrix
        let sigmaInv: number[][] | null = null;
        try {
            sigmaInv = invertSPD(covMatrix);
        } catch {
            sigmaInv = null;
        }

        if (sigmaInv && n >= 2) {
            // Analytical efficient frontier (Markowitz closed-form)
            const ones = Array.from({ length: n }, () => [1]);
            const mu = returns.map(r => [r]);

            // A = 1'Σ⁻¹μ
            const SigInvMu = matMul(sigmaInv, mu);
            const SigInvOnes = matMul(sigmaInv, ones);
            const A = matMul(transpose(ones), SigInvMu)[0][0];
            const B = matMul(transpose(mu), SigInvMu)[0][0];
            const C = matMul(transpose(ones), SigInvOnes)[0][0];
            const D = B * C - A * A;

            if (Math.abs(D) > 1e-10) {
                for (let p = 0; p < numFrontierPoints; p++) {
                    const targetReturn = minReturn + (maxReturn - minReturn) * (p / (numFrontierPoints - 1));

                    // w*(μₜ) = (1/D)[B·Σ⁻¹·1 − A·Σ⁻¹·μ] + (μₜ/D)[C·Σ⁻¹·μ − A·Σ⁻¹·1]
                    const weights: number[] = new Array(n);
                    for (let i = 0; i < n; i++) {
                        weights[i] = (1 / D) * (B * SigInvOnes[i][0] - A * SigInvMu[i][0])
                            + (targetReturn / D) * (C * SigInvMu[i][0] - A * SigInvOnes[i][0]);
                    }

                    // Clamp negative weights to 0 and renormalize (long-only constraint)
                    let sumW = 0;
                    for (let i = 0; i < n; i++) { weights[i] = Math.max(0, weights[i]); sumW += weights[i]; }
                    if (sumW > 0) for (let i = 0; i < n; i++) weights[i] /= sumW;

                    // Recompute actual return and vol with clamped weights
                    const portReturn = weights.reduce((s, w, i) => s + w * returns[i], 0);
                    let portVar = 0;
                    for (let i = 0; i < n; i++)
                        for (let j = 0; j < n; j++)
                            portVar += weights[i] * weights[j] * covMatrix[i][j];
                    const portVol = Math.sqrt(Math.max(0, portVar));
                    const sharpe = portVol > 0 ? (portReturn - riskFreeRate) / portVol : 0;

                    const point: EfficientFrontierPoint = {
                        expectedReturn: portReturn,
                        volatility: portVol,
                        sharpeRatio: sharpe,
                        weights: holdings.map((h, i) => ({ symbol: h.symbol, weight: weights[i] }))
                    };
                    frontierPoints.push(point);

                    if (sharpe > bestSharpe) {
                        bestSharpe = sharpe;
                        optimalPoint = point;
                    }
                }
            }
        }

        // Fallback: if analytical failed or too few points, use equal-weight
        if (!optimalPoint) {
            const equalWeight = 1 / n;
            const eqReturn = returns.reduce((s, r) => s + r * equalWeight, 0);
            let eqVar = 0;
            for (let i = 0; i < n; i++)
                for (let j = 0; j < n; j++)
                    eqVar += equalWeight * equalWeight * covMatrix[i][j];
            optimalPoint = {
                expectedReturn: eqReturn,
                volatility: Math.sqrt(eqVar),
                sharpeRatio: (eqReturn - riskFreeRate) / Math.sqrt(eqVar),
                weights: holdings.map(h => ({ symbol: h.symbol, weight: equalWeight }))
            };
            frontierPoints.push(optimalPoint);
        }

        // Generate rebalancing actions
        const rebalancingActions: RebalancingAction[] = optimalPoint.weights.map((tw, i) => {
            const diff = tw.weight - currentWeights[i];
            const amount = Math.abs(diff) * totalValue;
            let action: RebalancingAction['action'] = 'hold';
            let reason = 'Position is near target allocation.';
            if (diff > 0.02) { action = 'buy'; reason = `Increase allocation by ${(diff * 100).toFixed(1)}% to improve risk-adjusted returns.`; }
            else if (diff < -0.02) { action = 'sell'; reason = `Reduce allocation by ${(Math.abs(diff) * 100).toFixed(1)}% — overweight relative to optimal.`; }
            return { symbol: tw.symbol, currentWeight: currentWeights[i], targetWeight: tw.weight, action, amount, reason };
        });

        return {
            optimalPortfolio: optimalPoint,
            efficientFrontier: frontierPoints,
            currentPortfolio: { expectedReturn: currentReturn, volatility: currentVol, sharpeRatio: currentSharpe },
            rebalancingActions
        };
    }

    /**
     * Tax-Loss Harvesting Analysis.
     * 
     * Strategy:
     * ───────────────────────────────────────────────────────────
     * 1. Identify positions with unrealized losses
     * 2. Estimate tax savings: ΔTax = Loss × TaxRate
     *    - Short-term (≤365 days): taxed as ordinary income (top rate ~37%)
     *    - Long-term (>365 days): taxed at preferential rate (~20%)
     * 3. Suggest correlated replacement securities to maintain exposure
     *    while observing the 30-day wash sale rule (IRC §1091)
     * ───────────────────────────────────────────────────────────
     */
    static taxLossHarvesting(
        holdings: PortfolioHolding[],
        shortTermTaxRate: number = 0.37,
        longTermTaxRate: number = 0.20
    ): TaxLossHarvestResult {
        // Common replacement ETFs by asset class for wash sale avoidance
        const replacementMap: Record<string, { symbol: string; name: string; correlation: number }[]> = {
            equity: [
                { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', correlation: 0.95 },
                { symbol: 'ITOT', name: 'iShares Core S&P Total US Stock Market', correlation: 0.94 },
                { symbol: 'SCHB', name: 'Schwab US Broad Market ETF', correlation: 0.93 },
            ],
            fixed_income: [
                { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', correlation: 0.92 },
                { symbol: 'AGG', name: 'iShares Core US Aggregate Bond', correlation: 0.91 },
            ],
            commodity: [
                { symbol: 'DBC', name: 'Invesco DB Commodity Index', correlation: 0.85 },
                { symbol: 'PDBC', name: 'Invesco Optimum Yield Diversified', correlation: 0.83 },
            ],
            crypto: [
                { symbol: 'BITO', name: 'ProShares Bitcoin Strategy ETF', correlation: 0.80 },
            ],
            reit: [
                { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', correlation: 0.90 },
                { symbol: 'SCHH', name: 'Schwab US REIT ETF', correlation: 0.88 },
            ],
            cash: [],
        };

        const candidates: TaxLossCandidate[] = [];
        let totalHarvestableRoss = 0;
        let totalTaxSavings = 0;

        for (const h of holdings) {
            const currentValue = h.shares * h.currentPrice;
            const costBasisTotal = h.shares * h.costBasis;
            const unrealizedLoss = currentValue - costBasisTotal;

            if (unrealizedLoss >= 0) continue; // No loss to harvest

            const loss = Math.abs(unrealizedLoss);
            const isLongTerm = (h.holdingDays || 0) > 365;
            const taxRate = isLongTerm ? longTermTaxRate : shortTermTaxRate;
            const taxSaving = loss * taxRate;

            const assetClass = h.assetClass || 'equity';
            const replacements = replacementMap[assetClass] || replacementMap.equity;
            // Pick the replacement with highest correlation that isn't the same symbol
            const bestReplacement = replacements.find(r => r.symbol !== h.symbol)
                || { symbol: 'SPY', name: 'SPDR S&P 500 ETF', correlation: 0.85 };

            candidates.push({
                symbol: h.symbol,
                unrealizedLoss: unrealizedLoss,
                costBasis: costBasisTotal,
                currentValue,
                holdingDays: h.holdingDays || 0,
                isLongTerm,
                taxRate,
                taxSaving,
                suggestedReplacement: bestReplacement,
                washSaleRisk: (h.holdingDays || 0) < 30
            });

            totalHarvestableRoss += loss;
            totalTaxSavings += taxSaving;
        }

        // Sort by tax saving potential (largest first)
        candidates.sort((a, b) => b.taxSaving - a.taxSaving);

        return {
            totalHarvestableLoss: totalHarvestableRoss,
            taxSavingsEstimate: totalTaxSavings,
            candidates
        };
    }

    /**
     * Monte Carlo simulation for forward-looking portfolio returns.
     * 
     * Mathematical model:
     * ───────────────────────────────────────────────────────────
     * Under Geometric Brownian Motion (GBM):
     *   S(t+Δt) = S(t) · exp[(μ − σ²/2)Δt + σ√(Δt)·Z]
     * 
     * where Z ~ N(0,1) (standard normal random variable).
     * 
     * For a portfolio with return μp and volatility σp:
     *   V(t+Δt) = V(t) · exp[(μp − σp²/2)Δt + σp√(Δt)·Z]
     * 
     * We simulate N paths over T periods and compute percentiles.
     * ───────────────────────────────────────────────────────────
     */
    static monteCarloSimulation(
        initialValue: number,
        expectedReturn: number,
        volatility: number,
        years: number = 5,
        numSimulations: number = 1000,
        stepsPerYear: number = 12
    ): MonteCarloResult {
        const dt = 1 / stepsPerYear;
        const totalSteps = Math.floor(years * stepsPerYear);
        const paths: number[][] = [];
        const finalValues: number[] = [];

        // Drift term: (μ − σ²/2)
        const drift = (expectedReturn - 0.5 * volatility * volatility) * dt;
        const diffusion = volatility * Math.sqrt(dt);

        for (let sim = 0; sim < numSimulations; sim++) {
            const path: number[] = [initialValue];
            let value = initialValue;

            for (let step = 0; step < totalSteps; step++) {
                // Box-Muller transform for normal random variable
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

                // GBM step: V(t+dt) = V(t) · exp(drift + diffusion·Z)
                value *= Math.exp(drift + diffusion * z);
                path.push(value);
            }

            paths.push(path);
            finalValues.push(value);
        }

        // Sort final values for percentile computation
        finalValues.sort((a, b) => a - b);
        const getPercentile = (p: number) => finalValues[Math.floor(p * finalValues.length)];

        return {
            percentiles: {
                p5: getPercentile(0.05),
                p25: getPercentile(0.25),
                p50: getPercentile(0.50),
                p75: getPercentile(0.75),
                p95: getPercentile(0.95),
            },
            paths: paths.slice(0, 50), // Return subset of paths for visualization
            finalValues,
            probabilityOfLoss: finalValues.filter(v => v < initialValue).length / finalValues.length
        };
    }
}
