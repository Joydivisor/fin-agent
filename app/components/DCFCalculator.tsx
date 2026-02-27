'use client';

import React, { useState, useCallback } from 'react';
import {
    ArrowLeft, Calculator, TrendingUp, BarChart3,
    DollarSign, Activity, ChevronDown, RefreshCw, Layers, Sigma
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    ScatterChart, Scatter, CartesianGrid
} from 'recharts';

interface Props { onBack: () => void; }

type TabId = 'dcf' | 'wacc' | 'black_scholes' | 'three_statement';

export default function DCFCalculator({ onBack }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('dcf');
    const [isComputing, setIsComputing] = useState(false);

    // ── DCF State ──
    const [dcfInputs, setDcfInputs] = useState({
        fcf: [100, 110, 121, 133, 146],
        wacc: 0.10,
        terminalGrowth: 0.025,
        netDebt: 200,
        sharesOutstanding: 50,
    });
    const [dcfResult, setDcfResult] = useState<any>(null);
    const [sensitivityResult, setSensitivityResult] = useState<any>(null);

    // ── WACC State ──
    const [waccInputs, setWaccInputs] = useState({
        equityValue: 5000,
        debtValue: 2000,
        costOfDebt: 0.05,
        taxRate: 0.21,
        riskFreeRate: 0.04,
        beta: 1.2,
        marketRiskPremium: 0.06,
    });
    const [waccResult, setWaccResult] = useState<any>(null);

    // ── Black-Scholes State ──
    const [bsInputs, setBsInputs] = useState({
        stockPrice: 150,
        strikePrice: 155,
        timeToExpiry: 0.5,
        riskFreeRate: 0.04,
        volatility: 0.25,
        optionType: 'call' as 'call' | 'put',
    });
    const [bsResult, setBsResult] = useState<any>(null);

    // ── Three-Statement State ──
    const [tsInputs, setTsInputs] = useState({
        revenue: 1000, revenueGrowthRate: 0.10, cogsPercent: 0.60,
        sgaPercent: 0.15, rndPercent: 0.05, depreciationPercent: 0.10,
        taxRate: 0.21, interestRate: 0.05, capexPercent: 0.08,
        dividendPayoutRatio: 0.30, priorCash: 200, priorAR: 80,
        priorInventory: 60, priorPPE: 500, priorAP: 50,
        priorShortTermDebt: 100, priorLongTermDebt: 400,
        priorRetainedEarnings: 300, dso: 30, dio: 45, dpo: 35,
    });
    const [tsResult, setTsResult] = useState<any>(null);

    // ── API Calls ──
    const computeDCF = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/financial-analysis', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'dcf', params: {
                        freeCashFlows: dcfInputs.fcf, terminalGrowthRate: dcfInputs.terminalGrowth,
                        wacc: dcfInputs.wacc, netDebt: dcfInputs.netDebt, sharesOutstanding: dcfInputs.sharesOutstanding
                    }
                })
            });
            const data = await res.json();
            if (data.success) setDcfResult(data.result);

            // Also compute sensitivity
            const senRes = await fetch('/api/financial-analysis', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'sensitivity', params: {
                        dcfInputs: {
                            freeCashFlows: dcfInputs.fcf, terminalGrowthRate: dcfInputs.terminalGrowth,
                            wacc: dcfInputs.wacc, netDebt: dcfInputs.netDebt, sharesOutstanding: dcfInputs.sharesOutstanding
                        },
                        waccRange: { min: dcfInputs.wacc - 0.03, max: dcfInputs.wacc + 0.03, steps: 7 },
                        growthRange: { min: dcfInputs.terminalGrowth - 0.01, max: dcfInputs.terminalGrowth + 0.02, steps: 7 }
                    }
                })
            });
            const senData = await senRes.json();
            if (senData.success) setSensitivityResult(senData.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [dcfInputs]);

    const computeWACC = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/financial-analysis', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'wacc', params: waccInputs })
            });
            const data = await res.json();
            if (data.success) setWaccResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [waccInputs]);

    const computeBS = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/financial-analysis', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'black_scholes', params: bsInputs })
            });
            const data = await res.json();
            if (data.success) setBsResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [bsInputs]);

    const computeTS = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/financial-analysis', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'three_statement', params: tsInputs })
            });
            const data = await res.json();
            if (data.success) setTsResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [tsInputs]);

    const formatM = (n: number) => {
        if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
        if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
        return `$${n.toFixed(1)}`;
    };

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'dcf', label: 'DCF 估值', icon: <TrendingUp size={14} /> },
        { id: 'wacc', label: 'WACC', icon: <Sigma size={14} /> },
        { id: 'black_scholes', label: 'Black-Scholes', icon: <Activity size={14} /> },
        { id: 'three_statement', label: '三表联动', icon: <Layers size={14} /> },
    ];

    const InputField = ({ label, value, onChange, suffix, step }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number }) => (
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
            <div className="flex items-center gap-1">
                <input type="number" step={step || 0.01} value={value}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {suffix && <span className="text-[10px] text-slate-400 font-bold w-6">{suffix}</span>}
            </div>
        </div>
    );

    const MetricCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-black ${color || 'text-slate-900'} font-mono`}>{value}</div>
            {sub && <div className="text-[10px] text-slate-500 mt-1 font-medium">{sub}</div>}
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-auto bg-slate-50">
            {/* Header */}
            <div className="px-6 pt-4 pb-3 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                        <ArrowLeft size={16} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100"><Calculator size={18} className="text-indigo-600" /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Financial Analysis Engine</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DCF · WACC · Black-Scholes · 三表模型</p>
                        </div>
                    </div>
                </div>
                {isComputing && <div className="flex items-center gap-2 text-[11px] text-indigo-500 font-bold"><RefreshCw size={12} className="animate-spin" />Computing...</div>}
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 bg-white border-b border-slate-100">
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6">

                {/* ═══ DCF Tab ═══ */}
                {activeTab === 'dcf' && (
                    <>
                        {/* Input Panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><DollarSign size={14} className="text-indigo-500" /> DCF 参数配置</h3>
                            <div className="grid grid-cols-5 gap-4 mb-4">
                                {dcfInputs.fcf.map((v, i) => (
                                    <InputField key={i} label={`Year ${i + 1} FCF`} value={v}
                                        onChange={val => { const nf = [...dcfInputs.fcf]; nf[i] = val; setDcfInputs({ ...dcfInputs, fcf: nf }); }}
                                    />
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <InputField label="WACC" value={dcfInputs.wacc} onChange={v => setDcfInputs({ ...dcfInputs, wacc: v })} suffix="%" step={0.005} />
                                <InputField label="Terminal Growth (g)" value={dcfInputs.terminalGrowth} onChange={v => setDcfInputs({ ...dcfInputs, terminalGrowth: v })} suffix="%" step={0.005} />
                                <InputField label="Net Debt" value={dcfInputs.netDebt} onChange={v => setDcfInputs({ ...dcfInputs, netDebt: v })} />
                                <InputField label="Shares Outstanding" value={dcfInputs.sharesOutstanding} onChange={v => setDcfInputs({ ...dcfInputs, sharesOutstanding: v })} suffix="M" />
                            </div>
                            <button onClick={computeDCF} disabled={isComputing}
                                className="mt-4 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                            ><Calculator size={14} /> 计算估值</button>
                        </div>

                        {/* Results */}
                        {dcfResult && (
                            <>
                                <div className="grid grid-cols-4 gap-4">
                                    <MetricCard label="Enterprise Value" value={formatM(dcfResult.enterpriseValue)} sub="PV(FCF) + PV(TV)" />
                                    <MetricCard label="Equity Value" value={formatM(dcfResult.equityValue)} sub="EV − Net Debt" />
                                    <MetricCard label="Implied Share Price" value={dcfResult.impliedSharePrice ? `$${dcfResult.impliedSharePrice.toFixed(2)}` : 'N/A'} color="text-indigo-600" sub="Equity / Shares" />
                                    <MetricCard label="Terminal Value % of EV" value={`${((dcfResult.pvOfTerminalValue / dcfResult.enterpriseValue) * 100).toFixed(1)}%`} sub="TV weight" />
                                </div>

                                {/* Waterfall Chart */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-800 mb-4">DCF Valuation Waterfall</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={[
                                            ...dcfResult.yearlyPVs.map((y: any) => ({ name: `Y${y.year} PV`, value: y.pv, fill: '#6366f1' })),
                                            { name: 'PV(TV)', value: dcfResult.pvOfTerminalValue, fill: '#8b5cf6' },
                                            { name: 'Net Debt', value: -dcfResult.enterpriseValue + dcfResult.equityValue, fill: '#ef4444' },
                                            { name: 'Equity', value: dcfResult.equityValue, fill: '#10b981' },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12, borderColor: '#e2e8f0' }} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                {[...dcfResult.yearlyPVs, {}, {}, {}].map((_: any, idx: number) => (
                                                    <Cell key={idx} fill={['#6366f1', '#6366f1', '#6366f1', '#6366f1', '#6366f1', '#8b5cf6', '#ef4444', '#10b981'][idx] || '#94a3b8'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Sensitivity Matrix */}
                                {sensitivityResult && (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h3 className="text-sm font-black text-slate-800 mb-4">Sensitivity Matrix — Implied Share Price</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-[11px]">
                                                <thead>
                                                    <tr>
                                                        <th className="p-2 text-left text-slate-400 font-bold">WACC ↓ / g →</th>
                                                        {sensitivityResult.growthValues.map((g: number, j: number) => (
                                                            <th key={j} className="p-2 text-center text-slate-500 font-mono font-bold">{(g * 100).toFixed(1)}%</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sensitivityResult.matrix.map((row: number[], i: number) => (
                                                        <tr key={i} className="border-t border-slate-100">
                                                            <td className="p-2 text-slate-500 font-mono font-bold">{(sensitivityResult.waccValues[i] * 100).toFixed(1)}%</td>
                                                            {row.map((val: number, j: number) => {
                                                                const isBase = Math.abs(sensitivityResult.waccValues[i] - sensitivityResult.baseCase.wacc) < 0.001
                                                                    && Math.abs(sensitivityResult.growthValues[j] - sensitivityResult.baseCase.growth) < 0.001;
                                                                const bg = isNaN(val) ? 'bg-slate-100 text-slate-300'
                                                                    : isBase ? 'bg-indigo-100 text-indigo-700 font-black ring-2 ring-indigo-300'
                                                                        : val > sensitivityResult.baseCase.price * 1.2 ? 'bg-emerald-50 text-emerald-700'
                                                                            : val < sensitivityResult.baseCase.price * 0.8 ? 'bg-rose-50 text-rose-700'
                                                                                : 'bg-white text-slate-700';
                                                                return (
                                                                    <td key={j} className={`p-2 text-center font-mono rounded-lg ${bg}`}>
                                                                        {isNaN(val) ? '—' : `$${val.toFixed(1)}`}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ═══ WACC Tab ═══ */}
                {activeTab === 'wacc' && (
                    <>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Sigma size={14} className="text-indigo-500" /> WACC (CAPM) 参数</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <InputField label="Equity Value (E)" value={waccInputs.equityValue} onChange={v => setWaccInputs({ ...waccInputs, equityValue: v })} />
                                <InputField label="Debt Value (D)" value={waccInputs.debtValue} onChange={v => setWaccInputs({ ...waccInputs, debtValue: v })} />
                                <InputField label="Cost of Debt (Rd)" value={waccInputs.costOfDebt} onChange={v => setWaccInputs({ ...waccInputs, costOfDebt: v })} suffix="%" step={0.005} />
                                <InputField label="Tax Rate" value={waccInputs.taxRate} onChange={v => setWaccInputs({ ...waccInputs, taxRate: v })} suffix="%" step={0.01} />
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                                <InputField label="Risk-Free Rate (Rf)" value={waccInputs.riskFreeRate} onChange={v => setWaccInputs({ ...waccInputs, riskFreeRate: v })} suffix="%" step={0.005} />
                                <InputField label="Beta (β)" value={waccInputs.beta} onChange={v => setWaccInputs({ ...waccInputs, beta: v })} step={0.1} />
                                <InputField label="Market Risk Premium" value={waccInputs.marketRiskPremium} onChange={v => setWaccInputs({ ...waccInputs, marketRiskPremium: v })} suffix="%" step={0.005} />
                            </div>
                            <button onClick={computeWACC} disabled={isComputing}
                                className="mt-4 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                            ><Calculator size={14} /> 计算 WACC</button>
                        </div>
                        {waccResult && (
                            <div className="grid grid-cols-3 gap-4">
                                <MetricCard label="WACC" value={`${(waccResult.wacc * 100).toFixed(2)}%`} color="text-indigo-600" sub={waccResult.breakdown} />
                                <MetricCard label="Cost of Equity (Rₑ)" value={`${(waccResult.costOfEquity * 100).toFixed(2)}%`} sub={`CAPM: Rf + β(Rm-Rf)`} />
                                <MetricCard label="Capital Structure" value={`E: ${(waccResult.equityWeight * 100).toFixed(0)}% / D: ${(waccResult.debtWeight * 100).toFixed(0)}%`} sub="Equity vs Debt weight" />
                            </div>
                        )}
                    </>
                )}

                {/* ═══ Black-Scholes Tab ═══ */}
                {activeTab === 'black_scholes' && (
                    <>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Activity size={14} className="text-indigo-500" /> Black-Scholes 期权定价</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <InputField label="Stock Price (S)" value={bsInputs.stockPrice} onChange={v => setBsInputs({ ...bsInputs, stockPrice: v })} />
                                <InputField label="Strike Price (K)" value={bsInputs.strikePrice} onChange={v => setBsInputs({ ...bsInputs, strikePrice: v })} />
                                <InputField label="Time to Expiry (T)" value={bsInputs.timeToExpiry} onChange={v => setBsInputs({ ...bsInputs, timeToExpiry: v })} suffix="yr" />
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-3">
                                <InputField label="Risk-Free Rate (r)" value={bsInputs.riskFreeRate} onChange={v => setBsInputs({ ...bsInputs, riskFreeRate: v })} suffix="%" />
                                <InputField label="Volatility (σ)" value={bsInputs.volatility} onChange={v => setBsInputs({ ...bsInputs, volatility: v })} suffix="%" />
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Option Type</label>
                                    <div className="flex gap-2">
                                        {(['call', 'put'] as const).map(t => (
                                            <button key={t} onClick={() => setBsInputs({ ...bsInputs, optionType: t })}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${bsInputs.optionType === t ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                                                    }`}
                                            >{t.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={computeBS} disabled={isComputing}
                                className="mt-4 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                            ><Calculator size={14} /> 计算期权价格</button>
                        </div>
                        {bsResult && (
                            <div className="grid grid-cols-3 gap-4">
                                <MetricCard label={`${bsInputs.optionType.toUpperCase()} Price`} value={`$${bsResult.price.toFixed(4)}`} color="text-indigo-600" sub={`d₁=${bsResult.d1.toFixed(4)}, d₂=${bsResult.d2.toFixed(4)}`} />
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm col-span-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Greeks</div>
                                    <div className="grid grid-cols-5 gap-3">
                                        <div><div className="text-[10px] text-slate-400">Delta (Δ)</div><div className="text-sm font-black font-mono text-slate-800">{bsResult.delta.toFixed(4)}</div></div>
                                        <div><div className="text-[10px] text-slate-400">Gamma (Γ)</div><div className="text-sm font-black font-mono text-slate-800">{bsResult.gamma.toFixed(4)}</div></div>
                                        <div><div className="text-[10px] text-slate-400">Theta (Θ)</div><div className="text-sm font-black font-mono text-rose-600">{bsResult.theta.toFixed(4)}</div></div>
                                        <div><div className="text-[10px] text-slate-400">Vega (ν)</div><div className="text-sm font-black font-mono text-slate-800">{bsResult.vega.toFixed(4)}</div></div>
                                        <div><div className="text-[10px] text-slate-400">Rho (ρ)</div><div className="text-sm font-black font-mono text-slate-800">{bsResult.rho.toFixed(4)}</div></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ Three-Statement Tab ═══ */}
                {activeTab === 'three_statement' && (
                    <>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Layers size={14} className="text-indigo-500" /> 三表联动参数</h3>
                            <div className="grid grid-cols-5 gap-3 text-xs">
                                <InputField label="Revenue" value={tsInputs.revenue} onChange={v => setTsInputs({ ...tsInputs, revenue: v })} />
                                <InputField label="Revenue Growth" value={tsInputs.revenueGrowthRate} onChange={v => setTsInputs({ ...tsInputs, revenueGrowthRate: v })} suffix="%" />
                                <InputField label="COGS %" value={tsInputs.cogsPercent} onChange={v => setTsInputs({ ...tsInputs, cogsPercent: v })} suffix="%" />
                                <InputField label="SG&A %" value={tsInputs.sgaPercent} onChange={v => setTsInputs({ ...tsInputs, sgaPercent: v })} suffix="%" />
                                <InputField label="Tax Rate" value={tsInputs.taxRate} onChange={v => setTsInputs({ ...tsInputs, taxRate: v })} suffix="%" />
                            </div>
                            <button onClick={computeTS} disabled={isComputing}
                                className="mt-4 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2"
                            ><Calculator size={14} /> 生成三表</button>
                        </div>
                        {tsResult && (
                            <div className="space-y-4">
                                {/* Balance Check */}
                                <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${tsResult.balanceCheck.balanced ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                    {tsResult.balanceCheck.balanced ? '✅' : '❌'} A = L + E: {tsResult.balanceCheck.assets.toFixed(2)} = {tsResult.balanceCheck.liabilitiesPlusEquity.toFixed(2)} — {tsResult.balanceCheck.balanced ? '配平成功' : '未配平!'}
                                </div>

                                {/* Three Tables side by side */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Income Statement */}
                                    <div className="bg-white border border-indigo-200 rounded-2xl p-4 shadow-sm">
                                        <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-3">Income Statement</h4>
                                        {Object.entries(tsResult.incomeStatement).map(([k, v]) => (
                                            <div key={k} className="flex justify-between py-1 text-[11px] border-b border-slate-50">
                                                <span className="text-slate-500 font-medium">{k}</span>
                                                <span className="font-mono font-bold text-slate-800">{typeof v === 'number' ? (v as number).toFixed(1) : String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Balance Sheet */}
                                    <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm">
                                        <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-wider mb-3">Balance Sheet</h4>
                                        {Object.entries(tsResult.balanceSheet).map(([k, v]) => (
                                            <div key={k} className="flex justify-between py-1 text-[11px] border-b border-slate-50">
                                                <span className="text-slate-500 font-medium">{k}</span>
                                                <span className="font-mono font-bold text-slate-800">{typeof v === 'number' ? (v as number).toFixed(1) : String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Cash Flow */}
                                    <div className="bg-white border border-violet-200 rounded-2xl p-4 shadow-sm">
                                        <h4 className="text-[11px] font-black text-violet-600 uppercase tracking-wider mb-3">Cash Flow</h4>
                                        {Object.entries(tsResult.cashFlowStatement).map(([k, v]) => (
                                            <div key={k} className="flex justify-between py-1 text-[11px] border-b border-slate-50">
                                                <span className="text-slate-500 font-medium">{k}</span>
                                                <span className="font-mono font-bold text-slate-800">{typeof v === 'number' ? (v as number).toFixed(1) : String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
