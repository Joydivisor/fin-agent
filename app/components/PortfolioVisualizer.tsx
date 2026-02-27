'use client';

import React, { useState, useCallback } from 'react';
import {
    ArrowLeft, PieChart, TrendingUp, Shield, DollarSign,
    RefreshCw, BarChart3, Calculator, Leaf, Shuffle
} from 'lucide-react';
import {
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
    CartesianGrid, Tooltip, Cell, PieChart as RePieChart, Pie,
    AreaChart, Area, ReferenceLine
} from 'recharts';

interface Props { onBack: () => void; }

type TabId = 'overview' | 'optimize' | 'tax_harvest' | 'monte_carlo';

export default function PortfolioVisualizer({ onBack }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isComputing, setIsComputing] = useState(false);

    const [holdings, setHoldings] = useState([
        { symbol: 'AAPL', shares: 100, currentPrice: 185, costBasis: 150, expectedReturn: 0.12, volatility: 0.25, assetClass: 'equity' as const, holdingDays: 400 },
        { symbol: 'GOOGL', shares: 50, currentPrice: 140, costBasis: 120, expectedReturn: 0.14, volatility: 0.28, assetClass: 'equity' as const, holdingDays: 300 },
        { symbol: 'BND', shares: 200, currentPrice: 72, costBasis: 78, expectedReturn: 0.04, volatility: 0.05, assetClass: 'fixed_income' as const, holdingDays: 500 },
        { symbol: 'GLD', shares: 30, currentPrice: 190, costBasis: 170, expectedReturn: 0.06, volatility: 0.15, assetClass: 'commodity' as const, holdingDays: 250 },
        { symbol: 'VNQ', shares: 80, currentPrice: 85, costBasis: 92, expectedReturn: 0.08, volatility: 0.18, assetClass: 'reit' as const, holdingDays: 180 },
    ]);

    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [optimizeResult, setOptimizeResult] = useState<any>(null);
    const [taxResult, setTaxResult] = useState<any>(null);
    const [mcResult, setMcResult] = useState<any>(null);
    const riskFreeRate = 0.045;

    const runAnalysis = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'analyze', holdings, riskFreeRate })
            });
            const data = await res.json();
            if (data.success) setAnalysisResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [holdings]);

    const runOptimize = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'optimize', holdings, riskFreeRate })
            });
            const data = await res.json();
            if (data.success) setOptimizeResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [holdings]);

    const runTaxHarvest = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'tax_harvest', holdings })
            });
            const data = await res.json();
            if (data.success) setTaxResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [holdings]);

    const runMonteCarlo = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'monte_carlo', holdings, riskFreeRate, years: 5, numSimulations: 500 })
            });
            const data = await res.json();
            if (data.success) setMcResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [holdings]);

    const formatM = (n: number) => Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : Math.abs(n) >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`;

    const MetricCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-black ${color || 'text-slate-900'} font-mono`}>{value}</div>
            {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
        </div>
    );

    const tabs: { id: TabId; label: string; icon: React.ReactNode; onClick: () => void }[] = [
        { id: 'overview', label: '持仓分析', icon: <PieChart size={14} />, onClick: runAnalysis },
        { id: 'optimize', label: '前沿优化', icon: <TrendingUp size={14} />, onClick: runOptimize },
        { id: 'tax_harvest', label: 'Tax Harvest', icon: <Leaf size={14} />, onClick: runTaxHarvest },
        { id: 'monte_carlo', label: '蒙特卡洛', icon: <BarChart3 size={14} />, onClick: runMonteCarlo },
    ];

    return (
        <div className="h-full flex flex-col overflow-auto bg-slate-50">
            <div className="px-6 pt-4 pb-3 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-violet-50 hover:border-violet-200 transition-colors"><ArrowLeft size={16} className="text-slate-600" /></button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-50 rounded-xl border border-violet-100"><PieChart size={18} className="text-violet-600" /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Wealth Management</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Markowitz · Tax-Loss Harvesting · Monte Carlo</p>
                        </div>
                    </div>
                </div>
                {isComputing && <div className="flex items-center gap-2 text-[11px] text-violet-500 font-bold"><RefreshCw size={12} className="animate-spin" />Computing...</div>}
            </div>

            <div className="px-6 pt-3 bg-white border-b border-slate-100">
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); tab.onClick(); }}
                            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-violet-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >{tab.icon} <span>{tab.label}</span></button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-6 space-y-5">
                {/* Holdings Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-3">持仓明细</h3>
                    <table className="w-full text-[11px]">
                        <thead><tr className="text-slate-400 font-bold uppercase tracking-wider">
                            <th className="px-3 py-2 text-left">Symbol</th><th className="px-3 py-2">Shares</th>
                            <th className="px-3 py-2">Price</th><th className="px-3 py-2">Cost Basis</th>
                            <th className="px-3 py-2">Market Value</th><th className="px-3 py-2">Gain/Loss</th>
                            <th className="px-3 py-2">Class</th>
                        </tr></thead>
                        <tbody>
                            {holdings.map(h => {
                                const mv = h.shares * h.currentPrice;
                                const gl = h.shares * (h.currentPrice - h.costBasis);
                                return (
                                    <tr key={h.symbol} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{h.symbol}</td>
                                        <td className="px-3 py-2.5 text-center font-mono">{h.shares}</td>
                                        <td className="px-3 py-2.5 text-center font-mono">${h.currentPrice}</td>
                                        <td className="px-3 py-2.5 text-center font-mono">${h.costBasis}</td>
                                        <td className="px-3 py-2.5 text-center font-mono font-bold">{formatM(mv)}</td>
                                        <td className={`px-3 py-2.5 text-center font-mono font-bold ${gl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{gl >= 0 ? '+' : ''}{formatM(gl)}</td>
                                        <td className="px-3 py-2.5 text-center"><span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500">{h.assetClass}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* ═══ Overview Tab ═══ */}
                {activeTab === 'overview' && analysisResult && (
                    <>
                        <div className="grid grid-cols-4 gap-4">
                            <MetricCard label="Total Value" value={formatM(analysisResult.totalValue)} color="text-violet-600" />
                            <MetricCard label="Total Return" value={`${(analysisResult.totalReturn * 100).toFixed(1)}%`} color={analysisResult.totalReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                            <MetricCard label="Sharpe Ratio" value={analysisResult.riskMetrics.sharpeRatio.toFixed(2)} sub="Risk-adjusted return" />
                            <MetricCard label="VaR (95%)" value={formatM(analysisResult.riskMetrics.var95)} sub="Daily max expected loss" color="text-rose-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <h4 className="text-sm font-black text-slate-800 mb-3">Asset Allocation</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                    <RePieChart>
                                        <Pie data={analysisResult.allocation} dataKey="weight" nameKey="assetClass" cx="50%" cy="50%" outerRadius={80} label={({ assetClass, weight }: any) => `${assetClass} ${(weight * 100).toFixed(0)}%`} labelLine={false}>
                                            {analysisResult.allocation.map((a: any, i: number) => <Cell key={i} fill={a.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v: any) => `${(v * 100).toFixed(1)}%`} />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <h4 className="text-sm font-black text-slate-800 mb-3">Risk Metrics</h4>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Expected Return', value: `${(analysisResult.riskMetrics.expectedReturn * 100).toFixed(1)}%` },
                                        { label: 'Volatility', value: `${(analysisResult.riskMetrics.volatility * 100).toFixed(1)}%` },
                                        { label: 'CVaR (95%)', value: formatM(analysisResult.riskMetrics.cvar95) },
                                        { label: 'Max Drawdown Est.', value: `${(analysisResult.riskMetrics.maxDrawdownEstimate * 100).toFixed(1)}%` },
                                        { label: 'Portfolio Beta', value: analysisResult.riskMetrics.portfolioBeta.toFixed(2) },
                                    ].map(m => (
                                        <div key={m.label} className="flex justify-between items-center">
                                            <span className="text-[11px] text-slate-500 font-medium">{m.label}</span>
                                            <span className="text-sm font-mono font-bold text-slate-800">{m.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ Optimize Tab — Efficient Frontier ═══ */}
                {activeTab === 'optimize' && optimizeResult && (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            <MetricCard label="Optimal Sharpe" value={optimizeResult.optimalPortfolio.sharpeRatio.toFixed(3)} color="text-violet-600" sub="Max risk-adjusted return" />
                            <MetricCard label="Optimal Return" value={`${(optimizeResult.optimalPortfolio.expectedReturn * 100).toFixed(2)}%`} sub="Expected annual" />
                            <MetricCard label="Optimal Vol" value={`${(optimizeResult.optimalPortfolio.volatility * 100).toFixed(2)}%`} sub="Annual std dev" />
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h4 className="text-sm font-black text-slate-800 mb-3">Efficient Frontier</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="x" type="number" name="Volatility" unit="%" tick={{ fontSize: 10 }} label={{ value: 'Volatility (%)', position: 'bottom', fontSize: 11 }} />
                                    <YAxis dataKey="y" type="number" name="Return" unit="%" tick={{ fontSize: 10 }} label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any) => `${v.toFixed(2)}%`} />
                                    <Scatter name="Frontier" data={optimizeResult.efficientFrontier.map((p: any) => ({ x: p.volatility * 100, y: p.expectedReturn * 100 }))} fill="#8b5cf6" />
                                    <Scatter name="Current" data={[{ x: optimizeResult.currentPortfolio.volatility * 100, y: optimizeResult.currentPortfolio.expectedReturn * 100 }]} fill="#ef4444" shape="star" />
                                    <Scatter name="Optimal" data={[{ x: optimizeResult.optimalPortfolio.volatility * 100, y: optimizeResult.optimalPortfolio.expectedReturn * 100 }]} fill="#10b981" shape="diamond" />
                                </ScatterChart>
                            </ResponsiveContainer>
                            <div className="flex gap-6 mt-3 text-[10px] font-bold">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-violet-500" /><span className="text-slate-500">Efficient Frontier</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-slate-500">Current Portfolio</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-slate-500">Optimal (Max Sharpe)</span></div>
                            </div>
                        </div>

                        {/* Rebalancing Actions */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h4 className="text-sm font-black text-slate-800 mb-3">Rebalancing Recommendations</h4>
                            <div className="space-y-2">
                                {optimizeResult.rebalancingActions.map((a: any) => (
                                    <div key={a.symbol} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <span className="font-mono font-bold text-sm text-slate-800 w-16">{a.symbol}</span>
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${a.action === 'buy' ? 'bg-emerald-100 text-emerald-700' : a.action === 'sell' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                                            }`}>{a.action.toUpperCase()}</span>
                                        <div className="flex-1 text-[11px] text-slate-600">{(a.currentWeight * 100).toFixed(1)}% → {(a.targetWeight * 100).toFixed(1)}%</div>
                                        <span className="text-[11px] font-mono text-slate-500">{formatM(a.amount)}</span>
                                        <span className="text-[10px] text-slate-400 max-w-[200px] truncate">{a.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ═══ Tax Harvest Tab ═══ */}
                {activeTab === 'tax_harvest' && taxResult && (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            <MetricCard label="Harvestable Losses" value={formatM(taxResult.totalHarvestableLoss)} color="text-rose-600" />
                            <MetricCard label="Est. Tax Savings" value={formatM(taxResult.taxSavingsEstimate)} color="text-emerald-600" sub="Based on applicable tax rates" />
                            <MetricCard label="Candidates" value={`${taxResult.candidates.length}`} sub="Positions with unrealized losses" />
                        </div>
                        {taxResult.candidates.length > 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <h4 className="text-sm font-black text-slate-800 mb-3">Harvest Candidates</h4>
                                <div className="space-y-3">
                                    {taxResult.candidates.map((c: any) => (
                                        <div key={c.symbol} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-sm text-slate-800">{c.symbol}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.isLongTerm ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {c.isLongTerm ? 'Long-term' : 'Short-term'}
                                                    </span>
                                                    {c.washSaleRisk && <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-600 text-[10px] font-bold">⚠ Wash Sale Risk</span>}
                                                </div>
                                                <span className="text-sm font-black text-emerald-600 font-mono">Save {formatM(c.taxSaving)}</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-3 text-[10px]">
                                                <div><span className="text-slate-400">Unrealized Loss</span><div className="font-mono font-bold text-rose-600">{formatM(c.unrealizedLoss)}</div></div>
                                                <div><span className="text-slate-400">Tax Rate</span><div className="font-mono font-bold">{(c.taxRate * 100).toFixed(0)}%</div></div>
                                                <div><span className="text-slate-400">Days Held</span><div className="font-mono font-bold">{c.holdingDays}</div></div>
                                                <div><span className="text-slate-400">Replace With</span>
                                                    <div className="font-mono font-bold text-indigo-600 flex items-center gap-1"><Shuffle size={10} />{c.suggestedReplacement.symbol}</div>
                                                    <div className="text-[9px] text-slate-400">ρ = {c.suggestedReplacement.correlation.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
                                <Shield size={32} className="text-emerald-400 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-bold">No tax-loss harvesting opportunities found. All positions are in profit.</p>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ Monte Carlo Tab ═══ */}
                {activeTab === 'monte_carlo' && mcResult && (
                    <>
                        <div className="grid grid-cols-4 gap-4">
                            <MetricCard label="Median (P50)" value={formatM(mcResult.result.percentiles.p50)} color="text-violet-600" />
                            <MetricCard label="Optimistic (P95)" value={formatM(mcResult.result.percentiles.p95)} color="text-emerald-600" />
                            <MetricCard label="Pessimistic (P5)" value={formatM(mcResult.result.percentiles.p5)} color="text-rose-600" />
                            <MetricCard label="Prob. of Loss" value={`${(mcResult.result.probabilityOfLoss * 100).toFixed(1)}%`} color="text-amber-600" sub="Over 5-year horizon" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h4 className="text-sm font-black text-slate-800 mb-3">Monte Carlo Simulation — 500 Paths × 5 Years</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={
                                    // Sample paths for visualization — take first 20 paths and build time series
                                    Array.from({ length: (mcResult.result.paths[0]?.length || 1) }, (_, step) => {
                                        const point: any = { step };
                                        mcResult.result.paths.slice(0, 20).forEach((path: number[], pi: number) => {
                                            point[`p${pi}`] = path[step];
                                        });
                                        point.initial = mcResult.portfolioValue;
                                        return point;
                                    })
                                }>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="step" tick={{ fontSize: 10 }} label={{ value: 'Months', position: 'bottom', fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                                    <ReferenceLine y={mcResult.portfolioValue} stroke="#64748b" strokeDasharray="5 5" label={{ value: 'Initial', fontSize: 10 }} />
                                    {mcResult.result.paths.slice(0, 20).map((_: any, i: number) => (
                                        <Area key={i} type="monotone" dataKey={`p${i}`} stroke={`hsl(${260 + i * 5}, 60%, ${50 + i}%)`} fill="none" strokeWidth={0.5} strokeOpacity={0.4} dot={false} />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {/* Show prompt if no data loaded */}
                {activeTab === 'overview' && !analysisResult && !isComputing && (
                    <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
                        <PieChart size={40} className="text-violet-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-500 font-bold mb-2">点击上方标签开始分析</p>
                        <p className="text-[11px] text-slate-400">选择分析模式后，系统将自动计算您的投资组合指标</p>
                    </div>
                )}
            </div>
        </div>
    );
}
