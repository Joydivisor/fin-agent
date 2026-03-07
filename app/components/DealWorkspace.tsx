'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    ArrowLeft, Building2, FileText, BarChart3,
    RefreshCw, Target, Shield, Calculator, Briefcase, Scale
} from 'lucide-react';
import {
    ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';

interface Props { onBack: () => void; activeSymbol?: string; lang?: 'ZH' | 'EN' | 'JA' | 'KO'; }

type TabId = 'deal_score' | 'lbo' | 'cim';

const DW_I18N: Record<string, Record<string, string>> = {
    ZH: {
        title: 'IB & PE Workspace', subtitle: 'Deal Scoring · LBO · CIM Generation',
        tab_deal: 'Deal Scoring', tab_lbo: 'LBO 模型', tab_cim: 'CIM 生成',
        lbo_params: 'LBO 参数', run_lbo: '运行 LBO',
        cim_form: 'CIM 信息录入', gen_cim: '生成 CIM', eval_deal: '评估交易',
        tooltip_ev: '收购公司的总成本 (股权 + 债务 - 现金)。',
        tooltip_debt: '用于融资收购的借款金额。债务越多 = 风险越高，但潜在 IRR 越高。',
        tooltip_exit: '假定第5年出售公司时的 EV/EBITDA 倍数。',
        guide_title: '💡 这是什么？', guide_desc: '投行交易台能自动评估交易质量、运行 LBO 杠杆收购模型、生成 CIM 备忘录。输入股票代码后，系统自动拉取财务数据并预填参数，点击即可一键出结果。'
    },
    EN: {
        title: 'IB & PE Workspace', subtitle: 'Deal Scoring · LBO · CIM Generation',
        tab_deal: 'Deal Scoring', tab_lbo: 'LBO Model', tab_cim: 'CIM Generator',
        lbo_params: 'LBO Parameters', run_lbo: 'Run LBO',
        cim_form: 'CIM Information', gen_cim: 'Generate CIM', eval_deal: 'Evaluate Deal',
        tooltip_ev: 'Total cost to acquire the company (Equity + Debt - Cash).',
        tooltip_debt: 'Amount borrowed to fund the acquisition. More debt = higher risk but potentially higher IRR.',
        tooltip_exit: 'Assumed EV/EBITDA multiple when selling the company in year 5.',
        guide_title: '💡 What is this?', guide_desc: 'The IB Deal Workspace auto-evaluates deal quality, runs LBO leveraged buyout models, and generates CIM memoranda. Enter a ticker — the system fetches financials and pre-fills parameters. One click for instant results.'
    },
    JA: {
        title: 'IB & PE ワークスペース', subtitle: 'ディールスコアリング · LBO · CIM',
        tab_deal: 'ディールスコア', tab_lbo: 'LBO モデル', tab_cim: 'CIM 生成',
        lbo_params: 'LBO パラメータ', run_lbo: 'LBO 実行',
        cim_form: 'CIM 情報入力', gen_cim: 'CIM 生成', eval_deal: 'ディール評価',
        tooltip_ev: '会社取得の総コスト (株式 + 負債 - 現金)。',
        tooltip_debt: '買収資金の借入額。負債が多いほどリスクが高いが、潜在的にIRRが高くなります。',
        tooltip_exit: '第5年に会社を売却する際の想定EV/EBITDA倍率。',
        guide_title: '💡 これは何？', guide_desc: 'IBディールワークスペースがディール評価、LBOモデル、CIMを自動生成。ティッカーを入力するだけで、プロ仕様のデフォルト値がプリセット済み。ワンクリックで結果が出ます。'
    },
    KO: {
        title: 'IB & PE 워크스페이스', subtitle: '딜 스코어링 · LBO · CIM',
        tab_deal: '딜 스코어링', tab_lbo: 'LBO 모델', tab_cim: 'CIM 생성',
        lbo_params: 'LBO 매개변수', run_lbo: 'LBO 실행',
        cim_form: 'CIM 정보 입력', gen_cim: 'CIM 생성', eval_deal: '딜 평가',
        tooltip_ev: '회사 인수 총비용 (주식 + 부채 - 현금).',
        tooltip_debt: '인수 자금 조달을 위한 차입금. 부채가 많을수록 리스크가 높지만 잠재적 IRR이 높아집니다.',
        tooltip_exit: '5년차에 회사 매각 시 가정하는 EV/EBITDA 배수.',
        guide_title: '💡 이것은 무엇인가요?', guide_desc: 'IB 딜 워크스페이스가 딜 평가, LBO 레버리지드 바이아웃 모델, CIM 메모를 자동 생성합니다. 티커만 입력하면 재무 데이터를 자동 로드합니다. 클릭 한 번으로 결과를 확인하세요.'
    },
};

export default function DealWorkspace({ onBack, activeSymbol = 'AAPL', lang = 'ZH' }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('deal_score');
    const [isComputing, setIsComputing] = useState(false);
    const [showGuide, setShowGuide] = useState(true);
    const t = DW_I18N[lang] || DW_I18N.ZH;

    // ── Deal Scoring State ──
    const [dealScores, setDealScores] = useState({
        companyName: 'Acme Corp',
        scores: {
            marketPosition: 7, financialHealth: 8, managementQuality: 6,
            growthPotential: 8, regulatoryRisk: 5, esgCompliance: 7,
            synergyPotential: 6, valuationAttractiveness: 7,
        }
    });
    const [dealResult, setDealResult] = useState<any>(null);

    // ── LBO State ──
    const [lboInputs, setLboInputs] = useState({
        enterpriseValue: 500, debtAmount: 350, interestRate: 0.07,
        projectedEBITDA: [80, 88, 97, 107, 118],
        annualDebtRepayment: 30, exitMultiple: 8.0,
        taxRate: 0.25, capexPercent: 0.08, nwcChangePercent: 0.02,
    });
    const [lboResult, setLboResult] = useState<any>(null);

    // ── CIM State ──
    const [cimInputs, setCimInputs] = useState({
        companyName: 'Stellar Technologies', industry: 'Enterprise SaaS',
        description: 'Leading provider of cloud-based enterprise resource planning solutions serving mid-market manufacturing companies.',
        revenue: 120e6, ebitda: 36e6, ebitdaMargin: 0.30, revenueGrowth: 0.25,
        employees: 450, headquarters: 'San Francisco, CA', foundedYear: 2015,
        keyProducts: ['Cloud ERP', 'Supply Chain Analytics', 'IoT Integration Platform'],
        competitiveAdvantages: ['97% gross retention rate', 'Proprietary ML engine', '150+ enterprise customers'],
    });
    const [cimResult, setCimResult] = useState<any>(null);

    // ── Data Hydration ──
    useEffect(() => {
        const fetchFundamentals = async () => {
            setIsComputing(true);
            try {
                const res = await fetch(`/api/fundamentals?symbol=${activeSymbol}`);
                if (!res.ok) { setIsComputing(false); return; }
                const data = await res.json();

                const toMillions = (val: number) => val ? val / 1_000_000 : 0;
                const debtM = toMillions(data.totalDebt) || 350;
                const ebitdaM = toMillions(data.ebitda) || 80;
                const revM = toMillions(data.revenue) || 120;
                const evM = toMillions(data.sharesOutstanding * data.price) + debtM - toMillions(data.totalCash);

                // Update LBO Inputs
                setLboInputs(prev => ({
                    ...prev,
                    enterpriseValue: evM > 0 ? evM : 500,
                    debtAmount: debtM > 0 ? debtM : 350,
                    projectedEBITDA: [ebitdaM, ebitdaM * 1.1, ebitdaM * 1.21, ebitdaM * 1.33, ebitdaM * 1.46]
                }));

                // Update CIM Inputs
                setCimInputs(prev => ({
                    ...prev,
                    companyName: activeSymbol,
                    revenue: data.revenue || 120e6,
                    ebitda: data.ebitda || 36e6,
                    ebitdaMargin: data.ebitda && data.revenue ? (data.ebitda / data.revenue) : 0.30
                }));

                // Update Deal Scores (Just the name)
                setDealScores(prev => ({
                    ...prev,
                    companyName: activeSymbol
                }));

                // AUTO RUN SMART DEFAULTS (Phase 4 Retail-Friendly UX)
                setTimeout(() => { computeDealScore(); computeLBO(); generateCIM(); }, 300);

            } catch (error) {
                console.error("Error fetching fundamentals in DealWorkspace:", error);
                setTimeout(() => { computeDealScore(); computeLBO(); generateCIM(); }, 300);
            }
            setIsComputing(false);
        };

        if (activeSymbol) fetchFundamentals();
    }, [activeSymbol]);

    const computeDealScore = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/ib-pe', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'deal_score', params: dealScores })
            });
            const data = await res.json();
            if (data.success) setDealResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [dealScores]);

    const computeLBO = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/ib-pe', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'lbo', params: lboInputs })
            });
            const data = await res.json();
            if (data.success) setLboResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [lboInputs]);

    const generateCIM = useCallback(async () => {
        setIsComputing(true);
        try {
            const res = await fetch('/api/ib-pe', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'cim', params: cimInputs })
            });
            const data = await res.json();
            if (data.success) setCimResult(data.result);
        } catch (e) { console.error(e); }
        setIsComputing(false);
    }, [cimInputs]);

    const formatM = (n: number) => Math.abs(n) >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toFixed(1)}M`;

    const InputField = ({ label, value, onChange, suffix, step }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number }) => (
        <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
            <div className="flex items-center gap-1">
                <input type="number" step={step || 1} value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                {suffix && <span className="text-[10px] text-slate-400 font-bold w-6">{suffix}</span>}
            </div>
        </div>
    );

    const MetricCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-black ${color || 'text-slate-900'} font-mono`}>{value}</div>
            {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
        </div>
    );

    const ScoreSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
        <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-600 font-medium w-32 truncate">{label}</span>
            <input type="range" min={1} max={10} value={value} onChange={e => onChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
            <span className={`text-sm font-black font-mono w-8 text-center rounded-lg py-0.5 ${value >= 8 ? 'text-emerald-600 bg-emerald-50' : value >= 5 ? 'text-amber-600 bg-amber-50' : 'text-rose-600 bg-rose-50'
                }`}>{value}</span>
        </div>
    );

    const ratingColors: Record<string, string> = {
        'Highly Attractive': 'bg-emerald-100 text-emerald-700 border-emerald-300',
        'Attractive': 'bg-green-100 text-green-700 border-green-300',
        'Neutral': 'bg-amber-100 text-amber-700 border-amber-300',
        'Cautious': 'bg-orange-100 text-orange-700 border-orange-300',
        'Pass': 'bg-rose-100 text-rose-700 border-rose-300',
    };

    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'deal_score', label: t.tab_deal, icon: <Target size={14} /> },
        { id: 'lbo', label: t.tab_lbo, icon: <Calculator size={14} /> },
        { id: 'cim', label: t.tab_cim, icon: <FileText size={14} /> },
    ];

    return (
        <div className="h-full flex flex-col overflow-auto bg-slate-50">
            <div className="px-6 pt-4 pb-3 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-amber-50 hover:border-amber-200 transition-colors"><ArrowLeft size={16} className="text-slate-600" /></button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl border border-amber-100"><Building2 size={18} className="text-amber-600" /></div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">{t.title}</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t.subtitle}</p>
                        </div>
                    </div>
                </div>
                {isComputing && <div className="flex items-center gap-2 text-[11px] text-amber-500 font-bold"><RefreshCw size={12} className="animate-spin" />Computing...</div>}
            </div>

            {showGuide && (
                <div className="mx-6 mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex-1">
                        <div className="text-sm font-black text-amber-700 mb-1">{t.guide_title}</div>
                        <div className="text-xs text-amber-600/80 leading-relaxed">{t.guide_desc}</div>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="p-1 text-amber-400 hover:text-amber-600 transition-colors shrink-0"><span className="text-xs font-bold">✕</span></button>
                </div>
            )}

            <div className="px-6 pt-3 bg-white border-b border-slate-100">
                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >{tab.icon} <span>{tab.label}</span></button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-6 space-y-5">
                {/* ═══ Deal Scoring Tab ═══ */}
                {activeTab === 'deal_score' && (
                    <>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Target size={14} className="text-amber-500" /> Deal Scoring Matrix</h3>
                            <div className="mb-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                                <input type="text" value={dealScores.companyName} onChange={e => setDealScores({ ...dealScores, companyName: e.target.value })}
                                    className="w-64 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-400" />
                            </div>
                            <div className="space-y-3">
                                {Object.entries(dealScores.scores).map(([key, val]) => {
                                    const labels: Record<string, string> = {
                                        marketPosition: 'Market Position', financialHealth: 'Financial Health',
                                        managementQuality: 'Management Quality', growthPotential: 'Growth Potential',
                                        regulatoryRisk: 'Regulatory Risk', esgCompliance: 'ESG Compliance',
                                        synergyPotential: 'Synergy Potential', valuationAttractiveness: 'Valuation',
                                    };
                                    return <ScoreSlider key={key} label={labels[key] || key} value={val}
                                        onChange={v => setDealScores({ ...dealScores, scores: { ...dealScores.scores, [key]: v } })} />;
                                })}
                            </div>
                            <button onClick={computeDealScore} disabled={isComputing}
                                className="mt-4 px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                            ><Scale size={14} /> {t.eval_deal}</button>
                        </div>

                        {dealResult && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <MetricCard label="Overall Score" value={`${dealResult.overallScore.toFixed(1)} / 10`} color="text-amber-600" />
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</div>
                                        <span className={`inline-block px-4 py-1.5 rounded-xl text-sm font-black border ${ratingColors[dealResult.rating] || 'bg-slate-100'}`}>
                                            {dealResult.rating}
                                        </span>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Recommendation</div>
                                        <p className="text-[11px] text-slate-600 leading-relaxed">{dealResult.recommendation}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-black text-slate-800 mb-3">Radar Analysis</h4>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RadarChart data={dealResult.radarChartData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: '#64748b' }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                                                <Radar name="Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} strokeWidth={2} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-black text-slate-800 mb-3">Dimension Breakdown</h4>
                                        <div className="space-y-2">
                                            {dealResult.dimensions.map((d: any) => (
                                                <div key={d.name} className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 w-24 truncate font-medium">{d.name}</span>
                                                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${d.score * 10}%`, backgroundColor: d.color }} />
                                                    </div>
                                                    <span className="text-[11px] font-black font-mono w-8 text-right" style={{ color: d.color }}>{d.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ LBO Tab ═══ */}
                {activeTab === 'lbo' && (
                    <>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><Calculator size={14} className="text-amber-500" /> {t.lbo_params}</h3>
                            <div className="grid grid-cols-5 gap-3">
                                <div className="group relative">
                                    <InputField label="Enterprise Value" value={lboInputs.enterpriseValue} onChange={v => setLboInputs({ ...lboInputs, enterpriseValue: v })} suffix="M" />
                                    <div className="absolute top-0 right-0 mt-7 hidden group-hover:block bg-slate-800 text-[10px] text-white p-2 rounded-lg shadow-xl w-48 z-20">{t.tooltip_ev}</div>
                                </div>
                                <div className="group relative">
                                    <InputField label="Debt Amount" value={lboInputs.debtAmount} onChange={v => setLboInputs({ ...lboInputs, debtAmount: v })} suffix="M" />
                                    <div className="absolute top-0 right-0 mt-7 hidden group-hover:block bg-slate-800 text-[10px] text-white p-2 rounded-lg shadow-xl w-48 z-20">{t.tooltip_debt}</div>
                                </div>
                                <InputField label="Interest Rate" value={lboInputs.interestRate} onChange={v => setLboInputs({ ...lboInputs, interestRate: v })} suffix="%" step={0.005} />
                                <div className="group relative">
                                    <InputField label="Exit Multiple" value={lboInputs.exitMultiple} onChange={v => setLboInputs({ ...lboInputs, exitMultiple: v })} suffix="x" step={0.5} />
                                    <div className="absolute top-0 right-0 mt-7 hidden group-hover:block bg-slate-800 text-[10px] text-white p-2 rounded-lg shadow-xl w-48 z-20">{t.tooltip_exit}</div>
                                </div>
                                <InputField label="Annual Repay" value={lboInputs.annualDebtRepayment} onChange={v => setLboInputs({ ...lboInputs, annualDebtRepayment: v })} suffix="M" />
                            </div>
                            <div className="mt-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Projected EBITDA (5yr)</label>
                                <div className="grid grid-cols-5 gap-3">
                                    {lboInputs.projectedEBITDA.map((v, i) => (
                                        <InputField key={i} label={`Year ${i + 1}`} value={v}
                                            onChange={val => { const ne = [...lboInputs.projectedEBITDA]; ne[i] = val; setLboInputs({ ...lboInputs, projectedEBITDA: ne }); }} suffix="M" />
                                    ))}
                                </div>
                            </div>
                            <button onClick={computeLBO} disabled={isComputing}
                                className="mt-4 px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                            ><Calculator size={14} /> {t.run_lbo}</button>
                        </div>

                        {lboResult && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                    <MetricCard label="Equity Contribution" value={formatM(lboResult.equityContribution)} sub={`${((lboResult.equityContribution / lboInputs.enterpriseValue) * 100).toFixed(0)}% of EV`} />
                                    <MetricCard label="Exit Equity Value" value={formatM(lboResult.exitEquityValue)} color="text-emerald-600" sub={`Exit EV: ${formatM(lboResult.exitEnterpriseValue)}`} />
                                    <MetricCard label="MOIC" value={`${lboResult.moic.toFixed(2)}x`} color="text-amber-600" sub="Money on Invested Capital" />
                                    <MetricCard label="IRR" value={`${(lboResult.irr * 100).toFixed(1)}%`} color={lboResult.irr > 0.20 ? 'text-emerald-600' : lboResult.irr > 0.15 ? 'text-amber-600' : 'text-rose-600'} sub="Annualized return" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-black text-slate-800 mb-3">Debt Paydown Schedule</h4>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={lboResult.debtSchedule.map((d: any) => ({ year: `Y${d.year}`, debt: d.endingDebt, interest: d.interestPayment }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                                                <Bar dataKey="debt" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Remaining Debt" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-black text-slate-800 mb-3">Leverage Profile</h4>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <LineChart data={lboResult.leverageProfile.map((l: any) => ({ year: `Y${l.year}`, 'Debt/EBITDA': l.debtToEbitda, 'Interest Coverage': Math.min(l.interestCoverage, 20) }))}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                                <YAxis tick={{ fontSize: 10 }} />
                                                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                                                <Line type="monotone" dataKey="Debt/EBITDA" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
                                                <Line type="monotone" dataKey="Interest Coverage" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Cash Flow Detail */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                    <h4 className="text-sm font-black text-slate-800 mb-3">Cash Flow Summary</h4>
                                    <table className="w-full text-[11px]">
                                        <thead><tr className="text-slate-400 font-bold uppercase">
                                            <th className="px-2 py-2">Year</th><th className="px-2 py-2">EBITDA</th><th className="px-2 py-2">Interest</th>
                                            <th className="px-2 py-2">Taxes</th><th className="px-2 py-2">CapEx</th><th className="px-2 py-2">FCF</th>
                                            <th className="px-2 py-2">Debt Repay</th>
                                        </tr></thead>
                                        <tbody>
                                            {lboResult.cashFlowSummary.map((cf: any) => (
                                                <tr key={cf.year} className="border-t border-slate-100 text-center">
                                                    <td className="px-2 py-2 font-bold">Y{cf.year}</td>
                                                    <td className="px-2 py-2 font-mono">{cf.ebitda.toFixed(1)}</td>
                                                    <td className="px-2 py-2 font-mono text-rose-600">({cf.interest.toFixed(1)})</td>
                                                    <td className="px-2 py-2 font-mono">({cf.taxes.toFixed(1)})</td>
                                                    <td className="px-2 py-2 font-mono">({cf.capex.toFixed(1)})</td>
                                                    <td className="px-2 py-2 font-mono font-bold text-emerald-600">{cf.freeCashFlow.toFixed(1)}</td>
                                                    <td className="px-2 py-2 font-mono">({cf.debtRepayment.toFixed(1)})</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ CIM Tab ═══ */}
                {activeTab === 'cim' && (
                    <>
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><FileText size={14} className="text-amber-500" /> {t.cim_form}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                                    <input type="text" value={cimInputs.companyName} onChange={e => setCimInputs({ ...cimInputs, companyName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-400" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Industry</label>
                                    <input type="text" value={cimInputs.industry} onChange={e => setCimInputs({ ...cimInputs, industry: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-400" />
                                </div>
                                <InputField label="Revenue" value={cimInputs.revenue / 1e6} onChange={v => setCimInputs({ ...cimInputs, revenue: v * 1e6 })} suffix="M" />
                            </div>
                            <div className="mt-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                                <textarea value={cimInputs.description} onChange={e => setCimInputs({ ...cimInputs, description: e.target.value })} rows={2}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-amber-400 resize-none" />
                            </div>
                            <button onClick={generateCIM} disabled={isComputing}
                                className="mt-4 px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-500 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                            ><FileText size={14} /> {t.gen_cim}</button>
                        </div>

                        {cimResult && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-bold">Confidential</p>
                                    <h3 className="text-xl font-black text-white">{cimResult.title}</h3>
                                    <p className="text-[11px] text-slate-400 mt-2">{cimResult.date}</p>
                                    <p className="text-[10px] text-slate-500 mt-4 leading-relaxed border-t border-slate-700 pt-3 italic">{cimResult.disclaimer}</p>
                                </div>

                                {cimResult.sections.map((section: any) => (
                                    <div key={section.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                        <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                                            <span>{section.icon}</span> {section.title}
                                        </h4>
                                        {section.subsections.map((sub: any, i: number) => (
                                            <div key={i} className="mb-4 last:mb-0">
                                                <h5 className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2">{sub.title}</h5>
                                                <p className="text-[12px] text-slate-600 leading-relaxed">{sub.content}</p>
                                                {sub.dataPoints && (
                                                    <div className="grid grid-cols-4 gap-2 mt-3">
                                                        {sub.dataPoints.map((dp: any, j: number) => (
                                                            <div key={j} className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase">{dp.label}</div>
                                                                <div className="text-[11px] font-mono font-bold text-slate-800">{dp.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
