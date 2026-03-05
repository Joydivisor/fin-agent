'use client';

import React, { useState } from 'react';
import {
    BarChart4, Brain, Briefcase, Calculator,
    ChevronRight, PieChart, FileText, TrendingUp,
    Shield, Zap, Target, DollarSign, Activity,
    ArrowRight, Sparkles, Building2, LineChart
} from 'lucide-react';
import DCFCalculator from './DCFCalculator';
import PortfolioVisualizer from './PortfolioVisualizer';
import ResearchViewer from './ResearchViewer';
import DealWorkspace from './DealWorkspace';

type LangKey = 'ZH' | 'EN' | 'JA' | 'KO';
type PluginId = 'hub' | 'financial_analysis' | 'equity_research' | 'wealth_management' | 'ib_pe';

// ── Full 4-Language I18N Dictionary for Command Center ──
const FCC_I18N: Record<LangKey, Record<string, string>> = {
    ZH: {
        hub_title: 'Financial Command Center',
        hub_subtitle: '五大金融服务插件 · 投行级专业工具矩阵',
        system_online: 'System Online',
        plugins_active: '5 Plugins Active',
        mcp_ready: 'MCP Protocol Ready',
        math_engine: 'Math Engine v1.0',
        enter_workspace: '进入工作台',
        bottom_title: 'Financial Services Plugin Suite — v1.0',
        bottom_sub: 'Powered by Markowitz MPT · Gordon Growth DCF · Black-Scholes · MCP Protocol',
        all_operational: 'All Systems Operational',
        // Plugin titles & subtitles
        fa_title: 'Financial Analysis', fa_sub: '金融建模',
        fa_desc: 'DCF · WACC · 三表联动 · Black-Scholes',
        fa_f1: '动态 WACC 计算 (CAPM)', fa_f2: '永续增长法 DCF', fa_f3: '自动配平三表模型',
        fa_f4: 'Black-Scholes 期权定价', fa_f5: '二维敏感性分析矩阵',
        er_title: 'Equity Research', er_sub: '权益研究',
        er_desc: '研报生成 · 管理层指引 · 量化评级',
        er_f1: '机构级研究报告自动生成', er_f2: '管理层指引 (Guidance) 提取', er_f3: '量化多因子评级模型',
        er_f4: '同业可比估值分析', er_f5: '语义文档检索 (Vector RAG)',
        wm_title: 'Wealth Management', wm_sub: '财富管理',
        wm_desc: 'Markowitz前沿 · 税务优化 · 蒙特卡洛',
        wm_f1: '马科维茨有效前沿优化', wm_f2: '夏普比率最大化', wm_f3: 'Tax-Loss Harvesting 策略',
        wm_f4: 'VaR / CVaR 风险分解', wm_f5: '蒙特卡洛模拟 (GBM)',
        ib_title: 'IB & Private Equity', ib_sub: '投行 & PE',
        ib_desc: 'CIM模版 · Deal Scoring · LBO · Comps',
        ib_f1: 'CIM 备忘录自动生成', ib_f2: '8维 Deal Scoring 评分矩阵', ib_f3: 'LBO 杠杆收购模型',
        ib_f4: '可比公司分析 (Comps)', ib_f5: 'IRR / MOIC 收益计算',
    },
    EN: {
        hub_title: 'Financial Command Center',
        hub_subtitle: 'Five Financial Service Plugins · Institutional-Grade Toolkit',
        system_online: 'System Online',
        plugins_active: '5 Plugins Active',
        mcp_ready: 'MCP Protocol Ready',
        math_engine: 'Math Engine v1.0',
        enter_workspace: 'Enter Workspace',
        bottom_title: 'Financial Services Plugin Suite — v1.0',
        bottom_sub: 'Powered by Markowitz MPT · Gordon Growth DCF · Black-Scholes · MCP Protocol',
        all_operational: 'All Systems Operational',
        fa_title: 'Financial Analysis', fa_sub: 'Modeling',
        fa_desc: 'DCF · WACC · 3-Statement · Black-Scholes',
        fa_f1: 'Dynamic WACC (CAPM)', fa_f2: 'Gordon Growth DCF', fa_f3: 'Auto-Balanced 3-Statement Model',
        fa_f4: 'Black-Scholes Pricing', fa_f5: '2D Sensitivity Matrix',
        er_title: 'Equity Research', er_sub: 'Research',
        er_desc: 'Report Generation · Guidance · Quant Rating',
        er_f1: 'Institutional Research Reports', er_f2: 'Management Guidance Extraction', er_f3: 'Quantitative Multi-Factor Rating',
        er_f4: 'Comparable Valuation Analysis', er_f5: 'Semantic Document Search (RAG)',
        wm_title: 'Wealth Management', wm_sub: 'Portfolio',
        wm_desc: 'Markowitz Frontier · Tax Optimization · Monte Carlo',
        wm_f1: 'Markowitz Efficient Frontier', wm_f2: 'Sharpe Ratio Maximization', wm_f3: 'Tax-Loss Harvesting Strategy',
        wm_f4: 'VaR / CVaR Risk Decomposition', wm_f5: 'Monte Carlo Simulation (GBM)',
        ib_title: 'IB & Private Equity', ib_sub: 'IB & PE',
        ib_desc: 'CIM · Deal Scoring · LBO · Comps',
        ib_f1: 'CIM Memo Generation', ib_f2: '8D Deal Scoring Matrix', ib_f3: 'LBO Leveraged Buyout Model',
        ib_f4: 'Comparable Company Analysis', ib_f5: 'IRR / MOIC Return Calculation',
    },
    JA: {
        hub_title: 'ファイナンシャル・コマンドセンター',
        hub_subtitle: '5つの金融プラグイン · 機関投資家レベルのツール',
        system_online: 'システムオンライン',
        plugins_active: '5 プラグイン稼働中',
        mcp_ready: 'MCP プロトコル準備完了',
        math_engine: '数学エンジン v1.0',
        enter_workspace: 'ワークスペースへ',
        bottom_title: 'Financial Services Plugin Suite — v1.0',
        bottom_sub: 'Markowitz MPT · Gordon Growth DCF · Black-Scholes · MCP Protocol',
        all_operational: '全システム稼働中',
        fa_title: 'ファイナンシャル分析', fa_sub: 'モデリング',
        fa_desc: 'DCF · WACC · 三表モデル · Black-Scholes',
        fa_f1: '動的 WACC 計算 (CAPM)', fa_f2: '永久成長 DCF', fa_f3: '三表自動連動モデル',
        fa_f4: 'Black-Scholes オプション', fa_f5: '2D 感度分析マトリクス',
        er_title: 'エクイティリサーチ', er_sub: 'リサーチ',
        er_desc: 'レポート生成 · ガイダンス · 定量評価',
        er_f1: '機関投資家向けレポート', er_f2: '経営陣ガイダンス抽出', er_f3: 'マルチファクター評価',
        er_f4: '比較分析', er_f5: 'ベクトル文書検索 (RAG)',
        wm_title: 'ウェルスマネジメント', wm_sub: 'ポートフォリオ',
        wm_desc: 'Markowitz · 税務最適化 · モンテカルロ',
        wm_f1: 'マーコウィッツ有効フロンティア', wm_f2: 'シャープレシオ最大化', wm_f3: 'タックスロスハーベスト',
        wm_f4: 'VaR / CVaR リスク分解', wm_f5: 'モンテカルロシミュレーション',
        ib_title: 'IB & プライベートエクイティ', ib_sub: 'IB & PE',
        ib_desc: 'CIM · ディールスコアリング · LBO · Comps',
        ib_f1: 'CIM メモ自動生成', ib_f2: '8D ディールスコアリング', ib_f3: 'LBO レバレッジドバイアウト',
        ib_f4: '類似会社分析', ib_f5: 'IRR / MOIC 計算',
    },
    KO: {
        hub_title: '파이낸셜 커맨드 센터',
        hub_subtitle: '5대 금융 서비스 플러그인 · 기관급 전문 도구',
        system_online: '시스템 온라인',
        plugins_active: '5개 플러그인 활성',
        mcp_ready: 'MCP 프로토콜 준비 완료',
        math_engine: '수학 엔진 v1.0',
        enter_workspace: '워크스페이스 입장',
        bottom_title: 'Financial Services Plugin Suite — v1.0',
        bottom_sub: 'Markowitz MPT · Gordon Growth DCF · Black-Scholes · MCP Protocol',
        all_operational: '전 시스템 가동 중',
        fa_title: '재무 분석', fa_sub: '모델링',
        fa_desc: 'DCF · WACC · 3표 연동 · Black-Scholes',
        fa_f1: '동적 WACC 계산 (CAPM)', fa_f2: '영구 성장 DCF', fa_f3: '3표 자동 균형 모델',
        fa_f4: 'Black-Scholes 옵션 가격', fa_f5: '2D 민감도 분석',
        er_title: '에쿼티 리서치', er_sub: '리서치',
        er_desc: '보고서 생성 · 가이던스 · 정량 평가',
        er_f1: '기관급 리서치 보고서', er_f2: '경영진 가이던스 추출', er_f3: '멀티팩터 정량 평가',
        er_f4: '비교 밸류에이션 분석', er_f5: '의미론적 문서 검색 (RAG)',
        wm_title: '자산 관리', wm_sub: '포트폴리오',
        wm_desc: 'Markowitz 프론티어 · 세금 최적화 · 몬테카를로',
        wm_f1: '마코위츠 효율적 프론티어', wm_f2: '샤프 비율 최대화', wm_f3: '세금 손실 수확 전략',
        wm_f4: 'VaR / CVaR 위험 분해', wm_f5: '몬테카를로 시뮬레이션 (GBM)',
        ib_title: 'IB & 프라이빗 에쿼티', ib_sub: 'IB & PE',
        ib_desc: 'CIM · 딜 스코어링 · LBO · Comps',
        ib_f1: 'CIM 메모 자동 생성', ib_f2: '8D 딜 스코어링 매트릭스', ib_f3: 'LBO 레버리지 바이아웃',
        ib_f4: '비교 회사 분석', ib_f5: 'IRR / MOIC 수익 계산',
    },
};

interface PluginConfig {
    id: PluginId;
    titleKey: string;
    subKey: string;
    descKey: string;
    featureKeys: string[];
    icon: React.ReactNode;
    gradient: string;
    borderColor: string;
    bgColor: string;
}

const PLUGINS: PluginConfig[] = [
    {
        id: 'financial_analysis',
        titleKey: 'fa_title', subKey: 'fa_sub', descKey: 'fa_desc',
        featureKeys: ['fa_f1', 'fa_f2', 'fa_f3', 'fa_f4', 'fa_f5'],
        icon: <Calculator size={28} />,
        gradient: 'from-indigo-500 to-blue-600',
        borderColor: 'border-indigo-200',
        bgColor: 'bg-indigo-50',
    },
    {
        id: 'equity_research',
        titleKey: 'er_title', subKey: 'er_sub', descKey: 'er_desc',
        featureKeys: ['er_f1', 'er_f2', 'er_f3', 'er_f4', 'er_f5'],
        icon: <FileText size={28} />,
        gradient: 'from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50',
    },
    {
        id: 'wealth_management',
        titleKey: 'wm_title', subKey: 'wm_sub', descKey: 'wm_desc',
        featureKeys: ['wm_f1', 'wm_f2', 'wm_f3', 'wm_f4', 'wm_f5'],
        icon: <PieChart size={28} />,
        gradient: 'from-violet-500 to-purple-600',
        borderColor: 'border-violet-200',
        bgColor: 'bg-violet-50',
    },
    {
        id: 'ib_pe',
        titleKey: 'ib_title', subKey: 'ib_sub', descKey: 'ib_desc',
        featureKeys: ['ib_f1', 'ib_f2', 'ib_f3', 'ib_f4', 'ib_f5'],
        icon: <Building2 size={28} />,
        gradient: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50',
    },
];

export default function FinancialCommandCenter({ activeSymbol = 'AAPL', lang = 'ZH' as LangKey }: { activeSymbol?: string; lang?: LangKey }) {
    const [activePlugin, setActivePlugin] = useState<PluginId>('hub');
    const t = FCC_I18N[lang] || FCC_I18N.ZH;

    // ── Sub-component rendering ──
    if (activePlugin === 'financial_analysis') {
        return <DCFCalculator activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} lang={lang} />;
    }
    if (activePlugin === 'equity_research') {
        return <ResearchViewer activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} lang={lang} />;
    }
    if (activePlugin === 'wealth_management') {
        return <PortfolioVisualizer activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} lang={lang} />;
    }
    if (activePlugin === 'ib_pe') {
        return <DealWorkspace activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} lang={lang} />;
    }

    // ── Hub View ──
    return (
        <div className="h-full flex flex-col overflow-auto">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30">
                        <Zap size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.hub_title}</h1>
                        <p className="text-sm text-slate-500 font-medium">{t.hub_subtitle}</p>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center gap-6 mt-4 py-3 px-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t.system_online}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Activity size={12} className="text-indigo-500" />
                        <span className="font-mono font-bold">{t.plugins_active}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Shield size={12} className="text-emerald-500" />
                        <span className="font-mono font-bold">{t.mcp_ready}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Brain size={12} className="text-violet-500" />
                        <span className="font-mono font-bold">{t.math_engine}</span>
                    </div>
                </div>
            </div>

            {/* Plugin Grid */}
            <div className="flex-1 px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {PLUGINS.map((plugin) => (
                        <div
                            key={plugin.id}
                            onClick={() => setActivePlugin(plugin.id)}
                            className={`group relative bg-white border ${plugin.borderColor} rounded-3xl overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all duration-300`}
                        >
                            {/* Gradient accent bar */}
                            <div className={`h-1.5 bg-gradient-to-r ${plugin.gradient}`} />

                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 ${plugin.bgColor} rounded-2xl border ${plugin.borderColor} group-hover:scale-110 transition-transform`}>
                                            <span className="text-slate-700">{plugin.icon}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{t[plugin.titleKey]}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t[plugin.subKey]}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                                        <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>

                                {/* Subtitle */}
                                <p className="text-xs text-slate-500 font-mono mb-4 flex items-center gap-1.5">
                                    <Sparkles size={10} className="text-amber-500" />
                                    {t[plugin.descKey]}
                                </p>

                                {/* Features */}
                                <div className="space-y-1.5">
                                    {plugin.featureKeys.map((fk, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${plugin.gradient}`} />
                                            <span className="text-[11px] text-slate-600 font-medium">{t[fk]}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Enter button */}
                                <div className="mt-5 flex justify-end">
                                    <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${plugin.gradient} rounded-xl text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all shadow-lg`}>
                                        <span>{t.enter_workspace}</span>
                                        <ChevronRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom info bar */}
                <div className="mt-6 p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Target size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{t.bottom_title}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {t.bottom_sub}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t.all_operational}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
