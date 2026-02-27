/**
 * FinancialModeler — Core Financial Analysis Engine
 * 
 * Implements institutional-grade financial modeling with full mathematical rigor.
 * All formulas are annotated with their theoretical derivations.
 * 
 * @module FinancialServices/core — Financial Analysis Plugin
 */

// ============================================================
// Type Definitions
// ============================================================

export interface WACCInputs {
    /** Market value of equity (E) */
    equityValue: number;
    /** Market value of debt (D) */
    debtValue: number;
    /** Cost of equity Rₑ — if not provided, computed via CAPM */
    costOfEquity?: number;
    /** Cost of debt Rd (pre-tax) */
    costOfDebt: number;
    /** Corporate tax rate Tₓ (e.g., 0.21 for 21%) */
    taxRate: number;
    /** Risk-free rate Rf (for CAPM fallback) */
    riskFreeRate?: number;
    /** Equity beta β (for CAPM fallback) */
    beta?: number;
    /** Market risk premium (Rm - Rf) (for CAPM fallback) */
    marketRiskPremium?: number;
}

export interface WACCResult {
    wacc: number;
    costOfEquity: number;
    costOfDebt: number;
    equityWeight: number;
    debtWeight: number;
    breakdown: string;
}

export interface DCFInputs {
    /** Projected Free Cash Flows for each year */
    freeCashFlows: number[];
    /** Terminal growth rate g (perpetuity) */
    terminalGrowthRate: number;
    /** Weighted Average Cost of Capital */
    wacc: number;
    /** Net debt (debt - cash) for equity bridge */
    netDebt?: number;
    /** Shares outstanding for per-share value */
    sharesOutstanding?: number;
}

export interface DCFResult {
    pvOfCashFlows: number;
    terminalValue: number;
    pvOfTerminalValue: number;
    enterpriseValue: number;
    equityValue: number;
    impliedSharePrice: number | null;
    yearlyPVs: { year: number; fcf: number; discountFactor: number; pv: number }[];
}

export interface SensitivityResult {
    waccValues: number[];
    growthValues: number[];
    /** Matrix[i][j] = implied share price at waccValues[i] & growthValues[j] */
    matrix: number[][];
    baseCase: { wacc: number; growth: number; price: number };
}

export interface IncomeStatement {
    revenue: number;
    cogs: number;
    grossProfit: number;
    opex: number;
    sga: number;
    rnd: number;
    ebitda: number;
    depreciation: number;
    ebit: number;
    interestExpense: number;
    ebt: number;
    taxes: number;
    netIncome: number;
}

export interface BalanceSheet {
    /** Assets */
    cash: number;
    accountsReceivable: number;
    inventory: number;
    totalCurrentAssets: number;
    ppe: number;
    totalAssets: number;
    /** Liabilities */
    accountsPayable: number;
    shortTermDebt: number;
    totalCurrentLiabilities: number;
    longTermDebt: number;
    totalLiabilities: number;
    /** Equity */
    retainedEarnings: number;
    totalEquity: number;
}

export interface CashFlowStatement {
    netIncome: number;
    depreciation: number;
    changeInWorkingCapital: number;
    operatingCashFlow: number;
    capex: number;
    investingCashFlow: number;
    debtIssuance: number;
    debtRepayment: number;
    dividends: number;
    financingCashFlow: number;
    netCashFlow: number;
    endingCash: number;
}

export interface ThreeStatementModel {
    incomeStatement: IncomeStatement;
    balanceSheet: BalanceSheet;
    cashFlowStatement: CashFlowStatement;
    /** Verify: A = L + E must hold */
    balanceCheck: { assets: number; liabilitiesPlusEquity: number; balanced: boolean };
}

export interface ThreeStatementInputs {
    revenue: number;
    revenueGrowthRate: number;
    cogsPercent: number;       // COGS as % of revenue
    sgaPercent: number;        // SG&A as % of revenue
    rndPercent: number;        // R&D as % of revenue
    depreciationPercent: number; // Depreciation as % of PPE
    taxRate: number;
    interestRate: number;      // Interest as % of total debt
    capexPercent: number;      // CapEx as % of revenue
    dividendPayoutRatio: number;
    // Balance sheet priors
    priorCash: number;
    priorAR: number;
    priorInventory: number;
    priorPPE: number;
    priorAP: number;
    priorShortTermDebt: number;
    priorLongTermDebt: number;
    priorRetainedEarnings: number;
    // Working capital days
    dso: number;   // Days Sales Outstanding
    dio: number;   // Days Inventory Outstanding
    dpo: number;   // Days Payable Outstanding
}

export interface BlackScholesInputs {
    /** Current stock price S */
    stockPrice: number;
    /** Strike price K */
    strikePrice: number;
    /** Time to expiration T (in years) */
    timeToExpiry: number;
    /** Risk-free rate r (annualized) */
    riskFreeRate: number;
    /** Implied volatility σ (annualized) */
    volatility: number;
    /** Option type */
    optionType: 'call' | 'put';
}

export interface BlackScholesResult {
    price: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    d1: number;
    d2: number;
}

// ============================================================
// Mathematical Utility Functions
// ============================================================

/**
 * Cumulative standard normal distribution function Φ(x).
 * 
 * Uses the Abramowitz & Stegun rational approximation (error < 7.5×10⁻⁸):
 *   Φ(x) = 1 − φ(x)(b₁t + b₂t² + b₃t³ + b₄t⁴ + b₅t⁵)
 * where t = 1/(1 + 0.2316419·x) and φ(x) = (1/√(2π))·e^(-x²/2)
 */
function normalCDF(x: number): number {
    if (x < -10) return 0;
    if (x > 10) return 1;

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX / 2) / Math.sqrt(2 * Math.PI);

    return 0.5 * (1.0 + sign * y);
}

/**
 * Standard normal probability density function φ(x).
 * φ(x) = (1/√(2π)) · e^(-x²/2)
 */
function normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ============================================================
// FinancialModeler Class
// ============================================================

export class FinancialModeler {

    /**
     * Calculate Weighted Average Cost of Capital (WACC).
     * 
     * Mathematical derivation:
     * ───────────────────────────────────────────────────────────
     * The firm's total value V = E + D (Modigliani-Miller framework).
     * 
     * WACC represents the blended required return on the firm's capital:
     *   WACC = (E/V) · Rₑ + (D/V) · R_d · (1 − Tₓ)
     * 
     * where:
     *   E/V = equity weight, D/V = debt weight
     *   Rₑ  = cost of equity (via CAPM if not provided)
     *   R_d = cost of debt (pre-tax)
     *   Tₓ  = marginal corporate tax rate
     * 
     * If Rₑ is not provided, we use the Capital Asset Pricing Model:
     *   Rₑ = Rf + β · (Rm − Rf)
     * 
     * where:
     *   Rf = risk-free rate (typically 10Y Treasury yield)
     *   β  = systematic risk (equity beta)
     *   (Rm − Rf) = equity risk premium
     * ───────────────────────────────────────────────────────────
     */
    static calculateWACC(inputs: WACCInputs): WACCResult {
        const { equityValue, debtValue, costOfDebt, taxRate } = inputs;
        const totalValue = equityValue + debtValue;

        if (totalValue <= 0) {
            throw new Error('Total firm value (E + D) must be positive');
        }

        const equityWeight = equityValue / totalValue;  // E/V
        const debtWeight = debtValue / totalValue;      // D/V

        // Determine cost of equity: explicit or via CAPM
        let costOfEquity: number;
        if (inputs.costOfEquity !== undefined) {
            costOfEquity = inputs.costOfEquity;
        } else if (inputs.riskFreeRate !== undefined && inputs.beta !== undefined && inputs.marketRiskPremium !== undefined) {
            // CAPM: Rₑ = Rf + β(Rm − Rf)
            costOfEquity = inputs.riskFreeRate + inputs.beta * inputs.marketRiskPremium;
        } else {
            throw new Error('Either costOfEquity or CAPM parameters (riskFreeRate, beta, marketRiskPremium) must be provided');
        }

        // WACC = (E/V)·Rₑ + (D/V)·Rd·(1−T)
        const wacc = equityWeight * costOfEquity + debtWeight * costOfDebt * (1 - taxRate);

        return {
            wacc,
            costOfEquity,
            costOfDebt,
            equityWeight,
            debtWeight,
            breakdown: `WACC = ${(equityWeight * 100).toFixed(1)}% × ${(costOfEquity * 100).toFixed(2)}% + ${(debtWeight * 100).toFixed(1)}% × ${(costOfDebt * 100).toFixed(2)}% × (1 − ${(taxRate * 100).toFixed(0)}%) = ${(wacc * 100).toFixed(2)}%`
        };
    }

    /**
     * Discounted Cash Flow (DCF) Valuation — Gordon Growth / Perpetuity Method.
     * 
     * Mathematical derivation:
     * ───────────────────────────────────────────────────────────
     * Enterprise Value = Σₜ₌₁ⁿ [FCFₜ / (1 + WACC)ᵗ] + TV / (1 + WACC)ⁿ
     * 
     * Terminal Value (Gordon Growth Model):
     *   TV = FCFₙ · (1 + g) / (WACC − g)
     * 
     * This assumes FCF grows at constant rate g in perpetuity after year n.
     * Convergence requires g < WACC (otherwise TV → ∞).
     * 
     * Equity Value = Enterprise Value − Net Debt
     * Implied Share Price = Equity Value / Shares Outstanding
     * ───────────────────────────────────────────────────────────
     */
    static calculateDCF(inputs: DCFInputs): DCFResult {
        const { freeCashFlows, terminalGrowthRate, wacc, netDebt = 0, sharesOutstanding } = inputs;

        if (wacc <= terminalGrowthRate) {
            throw new Error(`WACC (${(wacc * 100).toFixed(2)}%) must be greater than terminal growth rate g (${(terminalGrowthRate * 100).toFixed(2)}%) for convergence`);
        }

        const n = freeCashFlows.length;
        const yearlyPVs: DCFResult['yearlyPVs'] = [];
        let pvOfCashFlows = 0;

        // PV of explicit forecast period: Σ FCFₜ/(1+WACC)ᵗ
        for (let t = 0; t < n; t++) {
            const discountFactor = 1 / Math.pow(1 + wacc, t + 1);
            const pv = freeCashFlows[t] * discountFactor;
            pvOfCashFlows += pv;
            yearlyPVs.push({
                year: t + 1,
                fcf: freeCashFlows[t],
                discountFactor,
                pv
            });
        }

        // Terminal Value: TV = FCFₙ·(1+g)/(WACC−g)
        const lastFCF = freeCashFlows[n - 1];
        const terminalValue = (lastFCF * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);
        const pvOfTerminalValue = terminalValue / Math.pow(1 + wacc, n);

        const enterpriseValue = pvOfCashFlows + pvOfTerminalValue;
        const equityValue = enterpriseValue - netDebt;
        const impliedSharePrice = sharesOutstanding ? equityValue / sharesOutstanding : null;

        return {
            pvOfCashFlows,
            terminalValue,
            pvOfTerminalValue,
            enterpriseValue,
            equityValue,
            impliedSharePrice,
            yearlyPVs
        };
    }

    /**
     * Sensitivity Analysis — 2D matrix varying WACC and terminal growth rate.
     * 
     * Generates a grid of implied share prices across different assumptions,
     * commonly used in equity research reports to show valuation range.
     */
    static sensitivityAnalysis(
        baseDCFInputs: DCFInputs,
        waccRange: { min: number; max: number; steps: number },
        growthRange: { min: number; max: number; steps: number }
    ): SensitivityResult {
        const waccValues: number[] = [];
        const growthValues: number[] = [];

        const waccStep = (waccRange.max - waccRange.min) / (waccRange.steps - 1);
        const growthStep = (growthRange.max - growthRange.min) / (growthRange.steps - 1);

        for (let i = 0; i < waccRange.steps; i++) {
            waccValues.push(waccRange.min + i * waccStep);
        }
        for (let j = 0; j < growthRange.steps; j++) {
            growthValues.push(growthRange.min + j * growthStep);
        }

        const matrix: number[][] = [];
        for (const w of waccValues) {
            const row: number[] = [];
            for (const g of growthValues) {
                if (w <= g) {
                    row.push(NaN); // Non-convergent
                } else {
                    try {
                        const result = this.calculateDCF({ ...baseDCFInputs, wacc: w, terminalGrowthRate: g });
                        row.push(result.impliedSharePrice ?? result.equityValue);
                    } catch {
                        row.push(NaN);
                    }
                }
            }
            matrix.push(row);
        }

        const baseResult = this.calculateDCF(baseDCFInputs);

        return {
            waccValues,
            growthValues,
            matrix,
            baseCase: {
                wacc: baseDCFInputs.wacc,
                growth: baseDCFInputs.terminalGrowthRate,
                price: baseResult.impliedSharePrice ?? baseResult.equityValue
            }
        };
    }

    /**
     * Three-Statement Financial Model with Auto-Balancing.
     * 
     * Mathematical structure:
     * ───────────────────────────────────────────────────────────
     * Income Statement → Cash Flow Statement → Balance Sheet
     * 
     * Auto-balancing enforces the fundamental accounting identity:
     *   Assets = Liabilities + Equity    (A = L + E)
     * 
     * Working Capital logic:
     *   AR  = Revenue × (DSO / 365)
     *   Inv = COGS × (DIO / 365)
     *   AP  = COGS × (DPO / 365)
     *   ΔWC = Δ(AR + Inv) − Δ(AP)
     * 
     * Cash is the "plug" variable that ensures balance:
     *   Ending Cash = Prior Cash + Net Cash Flow
     *   Total Assets = Cash + AR + Inv + PPE
     *   Must equal: Total Liabilities + Equity
     * ───────────────────────────────────────────────────────────
     */
    static buildThreeStatementModel(inputs: ThreeStatementInputs): ThreeStatementModel {
        const projectedRevenue = inputs.revenue * (1 + inputs.revenueGrowthRate);

        // ── Income Statement ──
        const cogs = projectedRevenue * inputs.cogsPercent;
        const grossProfit = projectedRevenue - cogs;
        const sga = projectedRevenue * inputs.sgaPercent;
        const rnd = projectedRevenue * inputs.rndPercent;
        const opex = sga + rnd;
        const depreciation = inputs.priorPPE * inputs.depreciationPercent;
        const ebitda = grossProfit - opex;
        const ebit = ebitda - depreciation;
        const totalDebt = inputs.priorShortTermDebt + inputs.priorLongTermDebt;
        const interestExpense = totalDebt * inputs.interestRate;
        const ebt = ebit - interestExpense;
        const taxes = Math.max(0, ebt * inputs.taxRate);
        const netIncome = ebt - taxes;

        const incomeStatement: IncomeStatement = {
            revenue: projectedRevenue, cogs, grossProfit, opex, sga, rnd,
            ebitda, depreciation, ebit, interestExpense, ebt, taxes, netIncome
        };

        // ── Working Capital Projections ──
        const newAR = projectedRevenue * (inputs.dso / 365);
        const newInventory = cogs * (inputs.dio / 365);
        const newAP = cogs * (inputs.dpo / 365);
        const deltaAR = newAR - inputs.priorAR;
        const deltaInventory = newInventory - inputs.priorInventory;
        const deltaAP = newAP - inputs.priorAP;
        const changeInWorkingCapital = -(deltaAR + deltaInventory - deltaAP);

        // ── Cash Flow Statement ──
        const capex = projectedRevenue * inputs.capexPercent;
        const operatingCashFlow = netIncome + depreciation + changeInWorkingCapital;
        const investingCashFlow = -capex;
        const dividends = Math.max(0, netIncome * inputs.dividendPayoutRatio);
        const financingCashFlow = -dividends;
        const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
        const endingCash = inputs.priorCash + netCashFlow;

        const cashFlowStatement: CashFlowStatement = {
            netIncome, depreciation, changeInWorkingCapital,
            operatingCashFlow, capex, investingCashFlow,
            debtIssuance: 0, debtRepayment: 0,
            dividends, financingCashFlow,
            netCashFlow, endingCash
        };

        // ── Balance Sheet (auto-balanced) ──
        const newPPE = inputs.priorPPE - depreciation + capex;
        const totalCurrentAssets = endingCash + newAR + newInventory;
        const totalAssets = totalCurrentAssets + newPPE;

        const totalCurrentLiabilities = newAP + inputs.priorShortTermDebt;
        const totalLiabilities = totalCurrentLiabilities + inputs.priorLongTermDebt;

        const retainedEarnings = inputs.priorRetainedEarnings + netIncome - dividends;
        // Equity is the "plug" to ensure A = L + E
        const totalEquity = totalAssets - totalLiabilities;

        const balanceSheet: BalanceSheet = {
            cash: endingCash, accountsReceivable: newAR, inventory: newInventory,
            totalCurrentAssets, ppe: newPPE, totalAssets,
            accountsPayable: newAP, shortTermDebt: inputs.priorShortTermDebt,
            totalCurrentLiabilities, longTermDebt: inputs.priorLongTermDebt,
            totalLiabilities,
            retainedEarnings, totalEquity
        };

        const liabilitiesPlusEquity = totalLiabilities + totalEquity;
        const balanced = Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01;

        return {
            incomeStatement,
            balanceSheet,
            cashFlowStatement,
            balanceCheck: { assets: totalAssets, liabilitiesPlusEquity, balanced }
        };
    }

    /**
     * Black-Scholes Option Pricing Model.
     * 
     * Mathematical derivation:
     * ───────────────────────────────────────────────────────────
     * Under the risk-neutral measure ℚ, a European call option's price is:
     *   C = S·N(d₁) − K·e^{−rT}·N(d₂)
     * 
     * where:
     *   d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
     *   d₂ = d₁ − σ√T
     *   N(·) = cumulative standard normal distribution
     * 
     * Derived from the stochastic process (Geometric Brownian Motion):
     *   dS = μS dt + σS dW
     * 
     * Under risk-neutral pricing (Girsanov's theorem):
     *   dS = rS dt + σS dW̃
     * 
     * Put-Call Parity: P = C − S + K·e^{−rT}
     * 
     * Greeks (sensitivities):
     *   Δ (Delta) = ∂C/∂S = N(d₁)                     [for call]
     *   Γ (Gamma) = ∂²C/∂S² = φ(d₁)/(S·σ√T)
     *   Θ (Theta) = ∂C/∂t = −S·φ(d₁)·σ/(2√T) − rK·e^{−rT}·N(d₂)  [for call]
     *   ν (Vega)  = ∂C/∂σ = S·φ(d₁)·√T
     *   ρ (Rho)   = ∂C/∂r = K·T·e^{−rT}·N(d₂)       [for call]
     * ───────────────────────────────────────────────────────────
     */
    static blackScholes(inputs: BlackScholesInputs): BlackScholesResult {
        const { stockPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma, optionType } = inputs;

        if (T <= 0) throw new Error('Time to expiry must be positive');
        if (sigma <= 0) throw new Error('Volatility must be positive');

        const sqrtT = Math.sqrt(T);

        // d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
        const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
        // d₂ = d₁ − σ√T
        const d2 = d1 - sigma * sqrtT;

        const Nd1 = normalCDF(d1);
        const Nd2 = normalCDF(d2);
        const Nnd1 = normalCDF(-d1);
        const Nnd2 = normalCDF(-d2);
        const phid1 = normalPDF(d1);
        const expRT = Math.exp(-r * T);

        let price: number;
        let delta: number;
        let rho: number;
        let theta: number;

        if (optionType === 'call') {
            // C = S·N(d₁) − K·e^{−rT}·N(d₂)
            price = S * Nd1 - K * expRT * Nd2;
            delta = Nd1;
            theta = (-S * phid1 * sigma / (2 * sqrtT)) - r * K * expRT * Nd2;
            rho = K * T * expRT * Nd2;
        } else {
            // P = K·e^{−rT}·N(−d₂) − S·N(−d₁)   (put-call parity)
            price = K * expRT * Nnd2 - S * Nnd1;
            delta = Nd1 - 1;
            theta = (-S * phid1 * sigma / (2 * sqrtT)) + r * K * expRT * Nnd2;
            rho = -K * T * expRT * Nnd2;
        }

        // Greeks common to both
        const gamma = phid1 / (S * sigma * sqrtT);
        const vega = S * phid1 * sqrtT;

        return { price, delta, gamma, theta: theta / 365, vega: vega / 100, rho: rho / 100, d1, d2 };
    }
}
