'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ArrowLeft, FileText, Search, TrendingUp,
    RefreshCw, ChevronDown, AlertTriangle, Target, Shield
} from 'lucide-react';

interface Props { onBack: () => void; activeSymbol?: string; lang?: 'ZH' | 'EN' | 'JA' | 'KO'; }

const RV_I18N: Record<string, Record<string, string>> = {
    ZH: {
        title: 'Equity Research Hub', subtitle: '研报生成 · 管理层指引提取 · 量化评级',
        report_gen: '研究报告生成器', gen_btn: '生成研报', guidance_title: '管理层指引提取 (Guidance Extraction)',
        extract_btn: '提取指引', stop_btn: 'Stop Generation',
        guide_title: '💡 这是什么？', guide_desc: '智能研报系统能自动为任意股票生成机构级研究报告和管理层指引分析。支持中文搜索（如“江淮汽车”），输入后点击“生成研报”即可获得专业分析。'
    },
    EN: {
        title: 'Equity Research Hub', subtitle: 'Report Generation · Guidance Extraction · Quant Rating',
        report_gen: 'Research Report Generator', gen_btn: 'Generate Report', guidance_title: 'Management Guidance Extraction',
        extract_btn: 'Extract Guidance', stop_btn: 'Stop Generation',
        guide_title: '💡 What is this?', guide_desc: 'The AI Research system auto-generates institutional-grade equity research reports and management guidance analysis for any stock. Supports Chinese search (e.g. "江淮汽车"). Enter a name or ticker, click "Generate Report" for a professional analysis.'
    },
    JA: {
        title: 'エクイティリサーチハブ', subtitle: 'レポート · ガイダンス · 定量評価',
        report_gen: 'リサーチレポート生成', gen_btn: 'レポート生成', guidance_title: '経営陣ガイダンス抽出',
        extract_btn: 'ガイダンス抽出', stop_btn: '停止',
        guide_title: '💡 これは何？', guide_desc: 'AIリサーチシステムが機関投資家レベルのレポートと経営ガイダンス分析を自動生成。中国語検索にも対応。ティッカーを入力して「レポート生成」をクリック。'
    },
    KO: {
        title: '에쿼티 리서치 허브', subtitle: '보고서 · 가이던스 · 정량 평가',
        report_gen: '리서치 보고서 생성', gen_btn: '보고서 생성', guidance_title: '경영진 가이던스 추출',
        extract_btn: '가이던스 추출', stop_btn: '중지',
        guide_title: '💡 이것은 무엇인가요?', guide_desc: 'AI 리서치 시스템이 기관 투자자 수준의 리서치 보고서와 경영 가이던스 분석을 자동 생성합니다. 중국어 검색도 지원합니다. 티커를 입력하고 "보고서 생성"을 클릭하세요.'
    },
};

export default function ResearchViewer({ onBack, activeSymbol = 'AAPL', lang = 'ZH' }: Props) {
    const t = RV_I18N[lang] || RV_I18N.ZH;
    const [symbol, setSymbol] = useState(activeSymbol);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const [reportText, setReportText] = useState('');
    const [reportMeta, setReportMeta] = useState<any>(null);
    const [guidanceText, setGuidanceText] = useState('');
    const [guidanceResult, setGuidanceResult] = useState<any>(null);
    const abortRef = useRef<AbortController | null>(null);
    const reportEndRef = useRef<HTMLDivElement>(null);
    const [currentPrice, setCurrentPrice] = useState(0);

    const [financials, setFinancials] = useState<Record<string, number>>({
        revenueGrowth: 0, grossMargin: 0, operatingMargin: 0,
        netMargin: 0, eps: 0, epsGrowth: 0, pe: 0,
        evEbitda: 0, debtToEquity: 0, roe: 0, fcfYield: 0, dividendYield: 0
    });

    // ── Data Hydration ──
    useEffect(() => {
        const fetchFundamentals = async () => {
            setIsGenerating(true);
            try {
                const res = await fetch(`/api/fundamentals?symbol=${symbol}`);
                if (res.ok) {
                    const data = await res.json();

                    const price = data.price || 0;
                    setCurrentPrice(price);

                    const equity = (data.sharesOutstanding || 1) * (price || 1);
                    const debt = data.totalDebt || 0;
                    const ev = equity + debt - (data.totalCash || 0);

                    // Use Yahoo Finance real EPS/PE when available, fallback to computed
                    const realEps = data.trailingEps || (data.sharesOutstanding ? (data.revenue * data.profitMargins / data.sharesOutstanding) : 0);
                    const realPe = data.trailingPE || (price && realEps ? price / realEps : 0);

                    setFinancials({
                        revenueGrowth: data.revenueGrowth || 0,
                        grossMargin: data.grossMargins || 0,
                        operatingMargin: data.operatingMargins || 0,
                        netMargin: data.profitMargins || 0,
                        eps: realEps,
                        epsGrowth: data.earningsGrowth || 0,
                        pe: realPe,
                        evEbitda: (ev && data.ebitda) ? (ev / data.ebitda) : 0,
                        debtToEquity: equity ? (debt / equity) : 0,
                        roe: equity ? ((data.revenue * data.profitMargins) / equity) : 0,
                        fcfYield: equity ? (data.freeCashflow / equity) : 0,
                        dividendYield: data.dividendYield || 0,
                    });
                }
            } catch (error) {
                console.error("Error fetching fundamentals for research:", error);
            }
            setIsGenerating(false);
        };

        if (symbol) {
            fetchFundamentals();
        }
    }, [symbol]);

    const generateReport = useCallback(async () => {
        if (!symbol) return;
        setIsGenerating(true);
        setReportText('');
        setReportMeta(null);
        abortRef.current = new AbortController();

        let targetTicker = symbol.toUpperCase().trim();

        try {
            // DEEP COMPONENT SEARCH: Check if it's potentially a non-ticker (e.g. Chinese name or company name)
            // If it contains non-ASCII characters or is a plain name, resolve it first.
            if (/[^\x00-\x7F]/g.test(targetTicker) || targetTicker.length > 5) {
                const searchRes = await fetch(`/api/search?q=${encodeURIComponent(targetTicker)}`);
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (Array.isArray(searchData) && searchData.length > 0) {
                        targetTicker = searchData[0].symbol;
                        setSymbol(targetTicker); // Update UI to show the resolved ticker
                    }
                }
            }

            const res = await fetch('/api/equity-research', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: targetTicker, reportType: 'full_report',
                    currentPrice,
                    financials
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
    }, [symbol, financials, currentPrice]);

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
                            <h2 className="text-lg font-black text-slate-900">{t.title}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.subtitle}</p>
                        </div>
                    </div>
                </div>
                {isGenerating && (
                    <button onClick={() => abortRef.current?.abort()} className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-100 transition-colors">
                        <span>{t.stop_btn}</span>
                    </button>
                )}
            </div>

            {showGuide && (
                <div className="mx-6 mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex-1">
                        <div className="text-sm font-black text-emerald-700 mb-1">{t.guide_title}</div>
                        <div className="text-xs text-emerald-600/80 leading-relaxed">{t.guide_desc}</div>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="p-1 text-emerald-400 hover:text-emerald-600 transition-colors shrink-0"><span className="text-xs font-bold">✕</span></button>
                </div>
            )}

            <div className="flex-1 p-6 space-y-5">
                {/* Research Report Generator */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Target size={14} className="text-emerald-500" /> {t.report_gen}</h3>
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
                        >{isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <FileText size={14} />} {t.gen_btn}</button>
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
                    <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-emerald-500" /> {t.guidance_title}</h3>
                    <textarea
                        value={guidanceText}
                        onChange={e => setGuidanceText(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono leading-relaxed focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                        placeholder="Paste earnings call transcript or press release text here...&#10;&#10;Example: We expect revenue of $94 billion to $98 billion for FY2026. We are raising our full-year EPS guidance to $6.50-$6.80, up from prior guidance of $6.20-$6.50."
                    />
                    <button onClick={extractGuidance} disabled={isGenerating || !guidanceText.trim()}
                        className="mt-3 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >{t.extract_btn}</button>
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
