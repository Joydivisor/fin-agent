'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
    ArrowLeft, FileText, Search, TrendingUp,
    RefreshCw, ChevronDown, AlertTriangle, Target, Shield
} from 'lucide-react';

interface Props { onBack: () => void; }

export default function ResearchViewer({ onBack }: Props) {
    const [symbol, setSymbol] = useState('AAPL');
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportText, setReportText] = useState('');
    const [reportMeta, setReportMeta] = useState<any>(null);
    const [guidanceText, setGuidanceText] = useState('');
    const [guidanceResult, setGuidanceResult] = useState<any>(null);
    const abortRef = useRef<AbortController | null>(null);
    const reportEndRef = useRef<HTMLDivElement>(null);

    const generateReport = useCallback(async () => {
        setIsGenerating(true);
        setReportText('');
        setReportMeta(null);
        try {
            abortRef.current = new AbortController();
            const res = await fetch('/api/equity-research', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol, reportType: 'full_report',
                    financials: {
                        revenueGrowth: 0.08, grossMargin: 0.46, operatingMargin: 0.30,
                        netMargin: 0.26, eps: 6.42, epsGrowth: 0.09, pe: 28.8,
                        evEbitda: 22.5, debtToEquity: 1.73, roe: 1.72, fcfYield: 0.035, dividendYield: 0.005
                    }
                }),
                signal: abortRef.current.signal
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                setReportText(`⚠️ Error: ${errData?.error || res.statusText}`);
                setIsGenerating(false);
                return;
            }

            // Check if streaming response or JSON
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await res.json();
                setReportText(JSON.stringify(data.result, null, 2));
                setIsGenerating(false);
                return;
            }

            // Streaming response
            const reader = res.body?.getReader();
            if (!reader) { setIsGenerating(false); return; }
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Extract meta if present
                const metaMatch = fullText.match(/<!--REPORT_META:(.*?)-->/);
                if (metaMatch && !reportMeta) {
                    try { setReportMeta(JSON.parse(metaMatch[1])); } catch { }
                }

                setReportText(fullText.replace(/<!--REPORT_META:.*?-->\n\n/, ''));
                reportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') setReportText(`⚠️ ${err.message}`);
        }
        setIsGenerating(false);
    }, [symbol]);

    const extractGuidance = useCallback(async () => {
        if (!guidanceText.trim()) return;
        setIsGenerating(true);
        try {
            const res = await fetch('/api/equity-research', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, reportType: 'guidance_extract', rawDocumentText: guidanceText })
            });
            const data = await res.json();
            if (data.success) setGuidanceResult(data.result);
        } catch (e) { console.error(e); }
        setIsGenerating(false);
    }, [symbol, guidanceText]);

    const ratingColors: Record<string, string> = {
        'Strong Buy': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Buy': 'bg-green-100 text-green-700 border-green-200',
        'Hold': 'bg-amber-100 text-amber-700 border-amber-200',
        'Sell': 'bg-orange-100 text-orange-700 border-orange-200',
        'Strong Sell': 'bg-rose-100 text-rose-700 border-rose-200',
    };

    return (
        <div className="h-full flex flex-col overflow-auto bg-slate-50">
            <div className="px-6 pt-4 pb-3 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"><ArrowLeft size={16} className="text-slate-600" /></button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100"><FileText size={18} className="text-emerald-600" /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Equity Research Hub</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">研报生成 · 管理层指引提取 · 量化评级</p>
                        </div>
                    </div>
                </div>
                {isGenerating && (
                    <button onClick={() => abortRef.current?.abort()} className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors">
                        <span>Stop Generation</span>
                    </button>
                )}
            </div>

            <div className="flex-1 p-6 space-y-5">
                {/* Research Report Generator */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Target size={14} className="text-emerald-500" /> 研究报告生成器</h3>
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Symbol</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                <input type="text" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    placeholder="AAPL, MSFT, BABA..."
                                />
                            </div>
                        </div>
                        <button onClick={generateReport} disabled={isGenerating || !symbol}
                            className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                        >{isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />} 生成研报</button>
                    </div>
                </div>

                {/* Report Meta Card */}
                {reportMeta && (
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</div>
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-black border ${ratingColors[reportMeta.rating] || 'bg-slate-100 text-slate-700'}`}>
                                {reportMeta.rating}
                            </span>
                        </div>
                        {reportMeta.priceTarget && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Price Target</div>
                                <div className="text-xl font-black text-emerald-600 font-mono">${reportMeta.priceTarget}</div>
                            </div>
                        )}
                        {reportMeta.upside !== null && (
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Upside</div>
                                <div className={`text-xl font-black font-mono ${reportMeta.upside >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {reportMeta.upside >= 0 ? '+' : ''}{reportMeta.upside.toFixed(1)}%
                                </div>
                            </div>
                        )}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Risk Factors</div>
                            <div className="text-xl font-black text-amber-600 font-mono">{reportMeta.riskFactors}</div>
                        </div>
                    </div>
                )}

                {/* Report Content */}
                {reportText && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                            <FileText size={14} className="text-emerald-500" />
                            {symbol} — Institutional Research Report
                        </h3>
                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                            {reportText}
                            {isGenerating && <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-500 animate-pulse rounded-full" />}
                        </div>
                        <div ref={reportEndRef} />
                    </div>
                )}

                {/* Guidance Extractor */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" /> 管理层指引提取 (Guidance Extraction)</h3>
                    <textarea
                        value={guidanceText}
                        onChange={e => setGuidanceText(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono leading-relaxed focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                        placeholder="Paste earnings call transcript or press release text here...&#10;&#10;Example: We expect revenue of $94 billion to $98 billion for FY2026. We are raising our full-year EPS guidance to $6.50-$6.80, up from prior guidance of $6.20-$6.50."
                    />
                    <button onClick={extractGuidance} disabled={isGenerating || !guidanceText.trim()}
                        className="mt-3 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >提取指引</button>
                </div>

                {/* Guidance Results */}
                {guidanceResult?.guidance && guidanceResult.guidance.length > 0 && (
                    <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-black text-emerald-700 mb-3">Extracted Guidance Items</h4>
                        <table className="w-full text-[11px]">
                            <thead><tr className="text-slate-400 font-bold uppercase">
                                <th className="px-3 py-2 text-left">Metric</th><th className="px-3 py-2">Period</th>
                                <th className="px-3 py-2">Low</th><th className="px-3 py-2">High</th>
                                <th className="px-3 py-2">Midpoint</th><th className="px-3 py-2">Direction</th>
                            </tr></thead>
                            <tbody>
                                {guidanceResult.guidance.map((g: any, i: number) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="px-3 py-2.5 font-bold text-slate-800">{g.metric}</td>
                                        <td className="px-3 py-2.5 text-center font-mono">{g.period}</td>
                                        <td className="px-3 py-2.5 text-center font-mono">{g.lowEnd}</td>
                                        <td className="px-3 py-2.5 text-center font-mono">{g.highEnd}</td>
                                        <td className="px-3 py-2.5 text-center font-mono font-bold">{g.midpoint}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${g.direction === 'raised' ? 'bg-emerald-100 text-emerald-700' :
                                                    g.direction === 'lowered' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>{g.direction}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
