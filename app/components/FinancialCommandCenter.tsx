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

type PluginId = 'hub' | 'financial_analysis' | 'equity_research' | 'wealth_management' | 'ib_pe';

interface PluginConfig {
    id: PluginId;
    title: string;
    titleZH: string;
    subtitle: string;
    icon: React.ReactNode;
    gradient: string;
    borderColor: string;
    bgColor: string;
    features: string[];
}

const PLUGINS: PluginConfig[] = [
    {
        id: 'financial_analysis',
        title: 'Financial Analysis',
        titleZH: '金融建模',
        subtitle: 'DCF · WACC · 三表联动 · Black-Scholes',
        icon: <Calculator size={28} />,
        gradient: 'from-indigo-500 to-blue-600',
        borderColor: 'border-indigo-200',
        bgColor: 'bg-indigo-50',
        features: ['动态 WACC 计算 (CAPM)', '永续增长法 DCF', '自动配平三表模型', 'Black-Scholes 期权定价', '二维敏感性分析矩阵'],
    },
    {
        id: 'equity_research',
        title: 'Equity Research',
        titleZH: '权益研究',
        subtitle: '研报生成 · 管理层指引 · 量化评级',
        icon: <FileText size={28} />,
        gradient: 'from-emerald-500 to-teal-600',
        borderColor: 'border-emerald-200',
        bgColor: 'bg-emerald-50',
        features: ['机构级研究报告自动生成', '管理层指引 (Guidance) 提取', '量化多因子评级模型', '同业可比估值分析', '语义文档检索 (Vector RAG)'],
    },
    {
        id: 'wealth_management',
        title: 'Wealth Management',
        titleZH: '财富管理',
        subtitle: 'Markowitz前沿 · 税务优化 · 蒙特卡洛',
        icon: <PieChart size={28} />,
        gradient: 'from-violet-500 to-purple-600',
        borderColor: 'border-violet-200',
        bgColor: 'bg-violet-50',
        features: ['马科维茨有效前沿优化', '夏普比率最大化', 'Tax-Loss Harvesting 策略', 'VaR / CVaR 风险分解', '蒙特卡洛模拟 (GBM)'],
    },
    {
        id: 'ib_pe',
        title: 'IB & Private Equity',
        titleZH: '投行 & PE',
        subtitle: 'CIM模版 · Deal Scoring · LBO · Comps',
        icon: <Building2 size={28} />,
        gradient: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-200',
        bgColor: 'bg-amber-50',
        features: ['CIM 备忘录自动生成', '8维 Deal Scoring 评分矩阵', 'LBO 杠杆收购模型', '可比公司分析 (Comps)', 'IRR / MOIC 收益计算'],
    },
];

export default function FinancialCommandCenter({ activeSymbol = 'AAPL' }: { activeSymbol?: string }) {
    const [activePlugin, setActivePlugin] = useState<PluginId>('hub');

    // ── Sub-component rendering ──
    if (activePlugin === 'financial_analysis') {
        return <DCFCalculator activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} />;
    }
    if (activePlugin === 'equity_research') {
        return <ResearchViewer activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} />;
    }
    if (activePlugin === 'wealth_management') {
        return <PortfolioVisualizer activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} />;
    }
    if (activePlugin === 'ib_pe') {
        return <DealWorkspace activeSymbol={activeSymbol} onBack={() => setActivePlugin('hub')} />;
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
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Command Center</h1>
                        <p className="text-sm text-slate-500 font-medium">五大金融服务插件 · 投行级专业工具矩阵</p>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center gap-6 mt-4 py-3 px-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">System Online</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Activity size={12} className="text-indigo-500" />
                        <span className="font-mono font-bold">5 Plugins Active</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Shield size={12} className="text-emerald-500" />
                        <span className="font-mono font-bold">MCP Protocol Ready</span>
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Brain size={12} className="text-violet-500" />
                        <span className="font-mono font-bold">Math Engine v1.0</span>
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
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{plugin.title}</h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{plugin.titleZH}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                                        <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>

                                {/* Subtitle */}
                                <p className="text-xs text-slate-500 font-mono mb-4 flex items-center gap-1.5">
                                    <Sparkles size={10} className="text-amber-500" />
                                    {plugin.subtitle}
                                </p>

                                {/* Features */}
                                <div className="space-y-1.5">
                                    {plugin.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2.5">
                                            <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${plugin.gradient}`} />
                                            <span className="text-[11px] text-slate-600 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Enter button */}
                                <div className="mt-5 flex justify-end">
                                    <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${plugin.gradient} rounded-xl text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all shadow-lg`}>
                                        <span>进入工作台</span>
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
                            <p className="text-sm font-bold text-white">Financial Services Plugin Suite — v1.0</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Powered by Markowitz MPT · Gordon Growth DCF · Black-Scholes · MCP Protocol
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
