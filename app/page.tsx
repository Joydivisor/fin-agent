'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Activity, Search, RefreshCw, 
  ExternalLink, BrainCircuit, Globe, Cpu, Landmark, 
  BarChart4, Keyboard, Trash2, 
  Send, User, Bot, Sparkles, 
  X, Users, Building2, Globe2, 
  Flame, CloudLightning, ChevronDown, ShieldAlert, Book, LayoutDashboard,
  Maximize2, Minimize2, ZoomIn, BarChart3, Archive, Mail, Lock, LogIn, CheckCircle2,
  Square, Calendar, FileText, ArrowRight, Settings, LogOut
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell, PieChart, Pie, ComposedChart, CartesianGrid, Line, Bar
} from 'recharts';

// 🌟 修复后的全语言字典（包含 JA 和 KO，修复了拼写）
const TRANSLATIONS = {
  ZH: {
    nav: ['工作台', '新闻', '预警', '记忆库', '智能周报', '帮助'],
    search: '搜索 股票/代码...', scanning: '扫描中...', top_stories: '实时快讯', intel: '深度情报:',
    watchlist: '自选列表', prev_close: '昨收', net_flow: '主力资金流向', ownership: '股东持仓分布',
    top_inst: '核心持仓机构', inst: '机构持仓', insider: '内部人士', retail: '散户/其他',
    agent_title: '战术分析', agent_placeholder: '询问该股趋势、基本面或压力位...',
    global_chat_placeholder: '输入宏观指令、查询大盘趋势或让 Agent 筛选股票...',
    agent_welcome: '多模态 AI 金融终端', 
    loading: '数据接入中...', loading_news: '情报抓取中...',
    global_chat_title: '全局智能分析流', esc_to_exit: 'ESC 退出',
    system_ready: 'SYSTEM STANDBY // 点击唤醒', trans_title: '智能阅读 & 深度解析', 
    trans_source: '原文来源', trans_read_original: '跳转原文链接', tactical_title: 'AGENT 战术分析', 
    flow_in: '流入', flow_out: '流出', cumulative: '累计净量', click_expand: '点击放大', 
    scroll_zoom: '滚轮缩放', chat_thinking: '正在思考...', status: 'SYSTEM ONLINE', region: 'GLOBAL',
    no_alerts: '系统运行正常，当前暂无异动预警。', archive_clear: '归档并清空'
  },
  EN: { 
    nav: ['Workspaces', 'News', 'Alerts', 'Memory', 'Weekly Report', 'Help'], 
    search: 'SEARCH TICKER...', scanning: 'Scanning...', top_stories: 'Top Stories', intel: 'Intel:', 
    watchlist: 'Watchlist', prev_close: 'PREV CLOSE', net_flow: 'Smart Money Net Flow', ownership: 'Ownership Structure', 
    top_inst: 'Top Institutions', inst: 'Institutions', insider: 'Insiders', retail: 'Retail/Public', 
    agent_title: 'AGENT ANALYSIS', agent_placeholder: 'Ask about trend, resistance...', 
    global_chat_placeholder: 'Enter macro commands...', agent_welcome: 'AI Terminal Ready', 
    loading: 'Loading...', loading_news: 'Fetching...', global_chat_title: 'GLOBAL INSIGHT', 
    esc_to_exit: 'ESC TO EXIT', system_ready: 'STANDBY', trans_title: 'AI Reader', 
    trans_source: 'Source', trans_read_original: 'Original', tactical_title: 'TACTICAL', 
    flow_in: 'In', flow_out: 'Out', cumulative: 'Cum', click_expand: 'Expand', 
    scroll_zoom: 'Zoom', chat_thinking: 'Thinking...', status: 'SYSTEM ONLINE', region: 'GLOBAL', 
    no_alerts: 'System stable. No active alerts.', archive_clear: 'Archive & Clear' 
  },
  JA: { 
    nav: ['ワークスペース', 'ニュース', 'アラート', 'メモリー', '週次レポート', 'ヘルプ'], 
    search: '検索...', scanning: 'スキャン中...', top_stories: 'トップニュース', intel: '情報:', 
    watchlist: 'リスト', prev_close: '前日終値', net_flow: '純資金流入', ownership: '株主構成', 
    top_inst: '主要保有機関', inst: '機関投資家', insider: '内部者', retail: '個人', 
    agent_title: 'AI 分析', agent_placeholder: '質問する...', global_chat_placeholder: 'コマンドを入力...', 
    agent_welcome: '準備完了', loading: '読み込み中...', loading_news: '取得中...', 
    global_chat_title: 'インサイト', esc_to_exit: 'ESCで終了', system_ready: 'スタンバイ', 
    trans_title: 'AI 翻訳', trans_source: 'ソース', trans_read_original: '原文リンク', 
    tactical_title: '戦術分析', flow_in: '流入', flow_out: '流出', cumulative: '累積', 
    click_expand: '拡大', scroll_zoom: 'ズーム', chat_thinking: '考え中...', status: 'オンライン', 
    region: 'グローバル', no_alerts: 'システムは正常です。アラートはありません。', archive_clear: 'アーカイブして消去' 
  },
  KO: { 
    nav: ['워크스페이스', '뉴스', '알림', '메모리', '주간 보고서', '도움말'], 
    search: '검색...', scanning: '스캔 중...', top_stories: '주요 뉴스', intel: '정보:', 
    watchlist: '관심종목', prev_close: '전일 종가', net_flow: '순유입', ownership: '주주 구성', 
    top_inst: '주요 보유 기관', inst: '기관', insider: '내부자', retail: '개인', 
    agent_title: 'AI 분석', agent_placeholder: '질문하기...', global_chat_placeholder: '명령 입력...', 
    agent_welcome: '준비 완료', loading: '로딩 중...', loading_news: '가져오는 중...', 
    global_chat_title: '인사이트', esc_to_exit: 'ESC 종료', system_ready: '대기 중', 
    trans_title: 'AI 번역', trans_source: '출처', trans_read_original: '원문 링크', 
    tactical_title: '전술 분석', flow_in: '유입', flow_out: '유출', cumulative: '누적', 
    click_expand: '확대', scroll_zoom: '줌', chat_thinking: '생각 중...', status: '온라인', 
    region: '글로벌', no_alerts: '시스템이 안정적입니다. 알림이 없습니다.', archive_clear: '보관 및 지우기' 
  }
};

const CATEGORIES = [
  { id: 'markets', label: 'MARKETS', icon: <BarChart4 size={14}/> },
  { id: 'tech', label: 'TECH', icon: <Cpu size={14}/> },
  { id: 'economics', label: 'ECONOMICS', icon: <Landmark size={14}/> },
  { id: 'politics', label: 'POLITICS', icon: <Globe size={14}/> }
];

const DEFAULT_LIST = [
  { symbol: '000001.SS', pinned: true },
  { symbol: 'AAPL', pinned: true },
  { symbol: 'BTC-USD', pinned: true },
  { symbol: 'GC=F', pinned: true }
];

const TIME_RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'All'];
type EngineType = 'gemini' | 'deepseek' | 'zhipu';
type ChatMessage = { role: 'user' | 'assistant', content: string, timestamp: number };

// 极致安全的 Markdown/思考过程解析器
const MessageFormatter = ({ content, isStreaming }: { content: string, isStreaming?: boolean }) => {
  const safeContent = content || '';
  const thinkStartIdx = safeContent.indexOf('> **🧠 深度思考中...**');
  const thinkEndIdx = safeContent.indexOf('\n\n---\n\n');
  const isThinkingFinished = thinkEndIdx !== -1;

  const [expanded, setExpanded] = useState(!isThinkingFinished);

  useEffect(() => { 
      if (isThinkingFinished) setExpanded(false); 
      else setExpanded(true); 
  }, [isThinkingFinished]);

  if (!safeContent) return <span className="hidden"></span>;

  if (thinkStartIdx === -1) {
      if (safeContent.includes('> **🧠')) {
          return (
              <div className="text-slate-400 italic text-xs animate-pulse flex items-center gap-2">
                  <BrainCircuit size={12}/> <span>Initializing AI deep thought...</span>
              </div>
          );
      }
      return <div className="whitespace-pre-wrap">{safeContent}</div>;
  }

  let thinkingRaw = '';
  let finalAnswer = '';

  if (isThinkingFinished) {
      thinkingRaw = safeContent.substring(thinkStartIdx, thinkEndIdx);
      finalAnswer = safeContent.substring(thinkEndIdx + 9);
  } else {
      thinkingRaw = safeContent.substring(thinkStartIdx);
      finalAnswer = '';
  }

  const prefix = safeContent.substring(0, thinkStartIdx);
  const cleanThinking = thinkingRaw.replace(/^> /gm, '').replace('**🧠 深度思考中...**', '').trim();

  return (
      <div className="flex flex-col gap-3 w-full">
          {prefix ? <div className="whitespace-pre-wrap">{prefix}</div> : null}
          {thinkingRaw ? (
              <div className="border border-indigo-100 rounded-xl overflow-hidden bg-indigo-50/30 shadow-sm transition-all">
                  <button onClick={() => setExpanded(!expanded)} className="w-full text-left px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-indigo-50 transition-colors">
                      <div className="flex items-center gap-2">
                          <BrainCircuit size={14} className={!isThinkingFinished ? 'animate-pulse text-indigo-500' : 'text-indigo-400'} />
                          <span className={!isThinkingFinished ? 'text-indigo-600' : 'text-slate-500'}>{!isThinkingFinished ? 'AI 正在进行深度推理...' : '已完成深度思考 (点击展开查看过程)'}</span>
                      </div>
                      <ChevronDown size={14} className={`transform transition-transform text-slate-400 ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded ? (
                      <div className="p-4 text-xs text-slate-500 whitespace-pre-wrap font-mono leading-relaxed border-t border-indigo-100/50 bg-white">
                          <span>{cleanThinking}</span>
                          {(!isThinkingFinished && isStreaming) ? <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse rounded-full" /> : null}
                      </div>
                  ) : null}
              </div>
          ) : null}
          {finalAnswer ? <div className="whitespace-pre-wrap mt-2 text-slate-800 leading-relaxed">{finalAnswer}</div> : null}
      </div>
  );
};

export default function FinAgent() {
  const [isMounted, setIsMounted] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const [watchlist, setWatchlist] = useState<{symbol: string, pinned: boolean}[] | null>(null);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('markets');
  const [timeRange, setTimeRange] = useState('1D');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // 🌟 核心修复：解除语言类型锁定
  const [lang, setLang] = useState<'ZH' | 'EN' | 'JA' | 'KO'>('ZH');
  
  // 🌟 真实用户认证状态
  const [userAccount, setUserAccount] = useState<{email: string} | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [userInputCode, setUserInputCode] = useState('');

  const [floatingPrompt, setFloatingPrompt] = useState<{x: number, y: number, contextText: string} | null>(null);
  const [floatingInput, setFloatingInput] = useState('');

  const [userProfile, setUserProfile] = useState('');
  const [chatArchives, setChatArchives] = useState<any[]>([]);
  const [activeEngine, setActiveEngine] = useState<EngineType>('zhipu');
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [stockDetail, setStockDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [globalNews, setGlobalNews] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [allCategoryNews, setAllCategoryNews] = useState<Record<string, any[]>>({});
  const [isLoadingAllNews, setIsLoadingAllNews] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const lastAlertPrices = useRef<Record<string, number>>({});

  const [globalChatInput, setGlobalChatInput] = useState('');
  const [isGlobalChatActive, setIsGlobalChatActive] = useState(false);
  const [globalChatMessages, setGlobalChatMessages] = useState<ChatMessage[]>([]);
  const [isGlobalChatStreaming, setIsGlobalChatStreaming] = useState(false);
  
  const [stockChatInput, setStockChatInput] = useState('');
  const [stockChatMessages, setStockChatMessages] = useState<ChatMessage[]>([]);
  const [isStockChatStreaming, setIsStockChatStreaming] = useState(false);
  const [isStockChatExpanded, setIsStockChatExpanded] = useState(false);

  const [tacticalNews, setTacticalNews] = useState<any>(null);
  const [tacticalReport, setTacticalReport] = useState<string>('');
  const [tacticalDeep, setTacticalDeep] = useState(false);

  const [readingNews, setReadingNews] = useState<any>(null);
  const [translationText, setTranslationText] = useState<string>('');
  const [translationDeep, setTranslationDeep] = useState(false);

  const [weeklyReport, setWeeklyReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportEndRef = useRef<HTMLDivElement>(null);

  const [isStreaming, setIsStreaming] = useState(false); 
  const [isFlowChartExpanded, setIsFlowChartExpanded] = useState(false);
  const [zoomState, setZoomState] = useState<{ left: number; right: number } | null>(null);

  const globalChatEndRef = useRef<HTMLDivElement>(null);
  const stockChatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const t = TRANSLATIONS[lang];

  const getOwnershipLabel = (name: string) => {
    if (name === 'Institutions') return t.inst;
    if (name === 'Insiders') return t.insider;
    return t.retail;
  };

  const formatXAxis = (tickItem: any) => {
    if (!tickItem) return '';
    if ((timeRange === '1D' || timeRange === '5D') && typeof tickItem === 'string' && !tickItem.includes('-')) return tickItem;
    try {
        const d = new Date(tickItem);
        if (isNaN(d.getTime())) return String(tickItem); 
        if (timeRange === '1D' || timeRange === '5D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        else if (timeRange === '1M' || timeRange === '6M' || timeRange === 'YTD') return `${d.getMonth()+1}/${d.getDate()}`;
        else return `${d.getFullYear()}-${d.getMonth()+1}`;
    } catch(e) { return tickItem; }
  };

  const streamAIResponse = async (
    params: { message: string; history?: any[]; context: any; mode: string },
    onUpdate: (text: string) => void,
    onComplete: () => void,
    initialText: string = ''
  ) => {
    try {
      abortControllerRef.current = new AbortController();
      const payload = { ...params, provider: activeEngine, userProfile, chatArchives }; 
      const res = await fetch('/api/agent', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal
      });
      if (!res.ok) throw new Error("API Connection Failed");
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false; 
      let fullText = initialText;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        fullText += chunkValue;
        onUpdate(fullText);
      }
      onComplete();
    } catch (err: any) { 
      if (err.name === 'AbortError' || err.message.includes('aborted')) {
          onUpdate(initialText + '\n\n**[ 生成已由用户暂停 ]**');
      } else {
          onUpdate(initialText + `\n\n⚠️ Error: ${err.message}`); 
      }
      onComplete(); 
    }
  };

  const handleStopGeneration = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      setIsStreaming(false);
      setIsGlobalChatStreaming(false);
      setIsStockChatStreaming(false);
      setIsGeneratingReport(false);
  };

  const handleGlobalChatSend = () => {
    const msg = globalChatInput.trim();
    if(!msg || isGlobalChatStreaming) return;
    const cleanHistory = globalChatMessages.map(m => ({ role: m.role, content: m.content.split('\n\n---\n\n').pop() || m.content }));
    setGlobalChatMessages(prev => [...prev, { role: 'user', content: msg, timestamp: Date.now() }, { role: 'assistant', content: '', timestamp: Date.now() + 1 }]);
    setGlobalChatInput(''); 
    setIsGlobalChatStreaming(true);
    streamAIResponse({ message: msg, history: cleanHistory, context: {}, mode: 'chat' }, (text) => { setGlobalChatMessages(prev => { const newArr = [...prev]; newArr[newArr.length - 1].content = text; return newArr; }); }, () => setIsGlobalChatStreaming(false));
  };

  const handleStockChatSend = (customMsg?: string) => {
    const msg = (customMsg !== undefined ? customMsg : stockChatInput).trim();
    if(!msg || isStockChatStreaming || !selectedTicker) return;
    const cleanHistory = stockChatMessages.map(m => ({ role: m.role, content: m.content.split('\n\n---\n\n').pop() || m.content }));
    setStockChatMessages(prev => [...prev, { role: 'user', content: msg, timestamp: Date.now() }, { role: 'assistant', content: '', timestamp: Date.now() + 1 }]);
    if (customMsg === undefined) setStockChatInput(''); 
    setIsStockChatStreaming(true);
    setIsStockChatExpanded(true); 
    streamAIResponse({ message: msg, history: cleanHistory, context: { symbol: selectedTicker.symbol, price: selectedTicker.price }, mode: 'stock_chat' }, (text) => { setStockChatMessages(prev => { const newArr = [...prev]; newArr[newArr.length - 1].content = text; return newArr; }); }, () => setIsStockChatStreaming(false));
  };

  const handleGenerateReport = () => {
      if (isGeneratingReport) return;
      setWeeklyReport('');
      setIsGeneratingReport(true);
      const wListStr = watchlist?.map(w => w.symbol).join(', ') || '暂无自选股';
      streamAIResponse({ 
          message: "请生成本周专属投资周报", 
          history: [], 
          context: { watchlist: wListStr }, 
          mode: 'weekly_report' 
      }, (text) => setWeeklyReport(text), () => setIsGeneratingReport(false));
  };

  const archiveConversation = (messages: ChatMessage[], type: string) => {
      if (messages.length === 0 || !userAccount?.email) return;
      const email = userAccount.email;
      const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'Unknown Topic';
      const cleanTitle = firstUserMsg.slice(0, 35) + (firstUserMsg.length > 35 ? '...' : '');
      const newArchive = { id: Date.now(), date: new Date().toLocaleDateString(), title: `[${type}] ${cleanTitle}` };
      const updatedArchives = [newArchive, ...chatArchives].slice(0, 20);
      setChatArchives(updatedArchives);
      localStorage.setItem(`fin_agent_archives_${email}`, JSON.stringify(updatedArchives));
  };

  const handleArchiveGlobalChat = () => { 
      archiveConversation(globalChatMessages, 'Macro'); 
      setGlobalChatMessages([]); 
      if (userAccount?.email) localStorage.removeItem(`fin_agent_global_chat_${userAccount.email}`); 
  };
  const handleArchiveStockChat = () => { 
      archiveConversation(stockChatMessages, selectedTicker?.symbol || 'Stock'); 
      setStockChatMessages([]); 
  };
  const deleteArchive = (id: number) => { 
      const updated = chatArchives.filter(a => a.id !== id); 
      setChatArchives(updated); 
      if (userAccount?.email) localStorage.setItem(`fin_agent_archives_${userAccount.email}`, JSON.stringify(updated)); 
  };
  
  const handleReturnHome = () => { setSelectedTicker(null); setIsGlobalChatActive(false); setIsStockChatExpanded(false); setActiveNavIndex(0); };

  const handleLogout = () => {
      localStorage.removeItem('fin_agent_user');
      setUserAccount(null);
      setShowLanding(true);
      setUserProfile('');
      setChatArchives([]);
      setGlobalChatMessages([]);
      setWatchlist(DEFAULT_LIST);
  };

  const handleSwitchUser = () => {
      handleLogout();
      setAuthMode('login');
      setShowAuthModal(true);
  };

  useEffect(() => {
    const handleClickOutside = () => { if (floatingPrompt) setFloatingPrompt(null); };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [floatingPrompt]);

  useEffect(() => {
    setIsMounted(true); 
    const savedUser = localStorage.getItem('fin_agent_user');
    if (savedUser) {
        setUserAccount(JSON.parse(savedUser));
        setShowLanding(false); 
    }
    setCurrentTime(new Date().toISOString());
    const timer = setInterval(() => setCurrentTime(new Date().toISOString()), 1000);
    const handleEsc = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') { 
        if(floatingPrompt) setFloatingPrompt(null);
        else if(showAuthModal) setShowAuthModal(false);
        else if(isFlowChartExpanded) setIsFlowChartExpanded(false);
        else if(tacticalNews) { handleStopGeneration(); setTacticalNews(null); }
        else if(readingNews) { handleStopGeneration(); setReadingNews(null); }
        else if(isStockChatExpanded) setIsStockChatExpanded(false);
        else if(isGlobalChatActive) setIsGlobalChatActive(false);
        else if(selectedTicker) setSelectedTicker(null);
      } 
    };
    window.addEventListener('keydown', handleEsc);
    return () => { window.removeEventListener('keydown', handleEsc); clearInterval(timer); };
  }, []);

  useEffect(() => {
      if (userAccount && userAccount.email) {
          const email = userAccount.email;
          const savedProfile = localStorage.getItem(`fin_agent_profile_${email}`);
          if (savedProfile) setUserProfile(savedProfile); else setUserProfile('');

          const savedArchives = localStorage.getItem(`fin_agent_archives_${email}`);
          if (savedArchives) setChatArchives(JSON.parse(savedArchives)); else setChatArchives([]);

          const savedGlobalChat = localStorage.getItem(`fin_agent_global_chat_${email}`);
          if (savedGlobalChat) setGlobalChatMessages(JSON.parse(savedGlobalChat)); else setGlobalChatMessages([]);

          const savedWatchlist = localStorage.getItem(`fin_agent_watchlist_${email}`);
          if (savedWatchlist) {
              setWatchlist(JSON.parse(savedWatchlist));
          } else {
              setWatchlist(DEFAULT_LIST);
              localStorage.setItem(`fin_agent_watchlist_${email}`, JSON.stringify(DEFAULT_LIST));
          }
      }
  }, [userAccount]);

  useEffect(() => { 
      if (globalChatMessages.length > 0 && userAccount?.email) {
          localStorage.setItem(`fin_agent_global_chat_${userAccount.email}`, JSON.stringify(globalChatMessages)); 
      }
  }, [globalChatMessages, userAccount]);

  useEffect(() => { if (reportEndRef.current) reportEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [weeklyReport]);

  useEffect(() => { 
    if (!watchlist || watchlist.length === 0) { setMarketData([]); return; }
    fetchOverviewData(watchlist);
    const interval = setInterval(() => { fetchOverviewData(watchlist); }, 10000);
    return () => clearInterval(interval);
  }, [watchlist]);
  
  useEffect(() => { if (selectedTicker) { setIsGlobalChatActive(false); setIsStockChatExpanded(false); fetchStockDetail(selectedTicker.symbol, timeRange); setActiveNavIndex(0); } }, [selectedTicker, timeRange]);
  useEffect(() => { setStockChatMessages([]); }, [selectedTicker?.symbol]);
  useEffect(() => { if (isFlowChartExpanded && stockDetail?.chart) setZoomState({ left: 0, right: stockDetail.chart.length - 1 }); }, [isFlowChartExpanded, stockDetail]);
  
  useEffect(() => {
    const fetchSideNews = async () => {
      setIsLoadingNews(true);
      try { const res = await fetch(`/api/news?category=${activeTab}`); setGlobalNews(await res.json()); } 
      catch (e) {} finally { setIsLoadingNews(false); }
    };
    if (!selectedTicker && !showLanding) {
        fetchSideNews();
        const interval = setInterval(fetchSideNews, 60000); 
        return () => clearInterval(interval);
    }
  }, [activeTab, selectedTicker, showLanding]);

  useEffect(() => {
    if (activeNavIndex === 1 && !showLanding) {
        const fetchAllNews = async () => {
            setIsLoadingAllNews(true);
            try {
                const [m, t, e, p] = await Promise.all([
                    fetch('/api/news?category=markets').then(r => r.json()),
                    fetch('/api/news?category=tech').then(r => r.json()),
                    fetch('/api/news?category=economics').then(r => r.json()),
                    fetch('/api/news?category=politics').then(r => r.json())
                ]);
                setAllCategoryNews({ markets: m, tech: t, economics: e, politics: p });
            } catch (err) {}
            setIsLoadingAllNews(false);
        };
        fetchAllNews();
        const interval = setInterval(fetchAllNews, 60000); 
        return () => clearInterval(interval);
    }
  }, [activeNavIndex, showLanding]);

  useEffect(() => { if (isGlobalChatActive) globalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [isGlobalChatActive, globalChatMessages]);
  useEffect(() => { stockChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [stockChatMessages]);

  useEffect(() => { 
      if (tacticalNews) { 
          setTacticalReport(''); 
          setTacticalDeep(false);
          setIsStreaming(true); 
          streamAIResponse({ message: "请生成快速战术分析。", context: { news: tacticalNews, symbol: selectedTicker?.symbol, price: selectedTicker?.price }, mode: 'tactical' }, (text) => setTacticalReport(text), () => setIsStreaming(false)); 
      } 
  }, [tacticalNews]);
  
  useEffect(() => { 
      if (readingNews) { 
          setTranslationText(''); 
          setTranslationDeep(false);
          setIsStreaming(true); 
          streamAIResponse({ message: "请生成快速摘要与翻译。", context: { news: readingNews }, mode: 'translation' }, (text) => setTranslationText(text), () => setIsStreaming(false)); 
      } 
  }, [readingNews]);

  const fetchOverviewData = async (list: {symbol: string, pinned: boolean}[]) => { 
    const symbols = list.map(i => i.symbol).join(','); 
    try { 
      const res = await fetch(`/api/market-data?symbols=${symbols}`); 
      if (res.ok) {
          const data = await res.json();
          setMarketData(data); 
          const newAlerts: any[] = [];
          data.forEach((item: any) => {
              if (item.change !== undefined && Math.abs(item.change) >= 2.0) {
                  if (lastAlertPrices.current[item.symbol] !== item.price) {
                      newAlerts.push({
                          id: `${item.symbol}-${Date.now()}`, symbol: item.symbol, title: `${item.symbol} 波动预警 / Volatility Alert`,
                          desc: `当前涨跌幅达到 ${item.change > 0 ? '+' : ''}${item.change.toFixed(2)}%，现价 ${item.price?.toFixed(2)}。`,
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: item.change > 0 ? 'up' : 'down'
                      });
                      lastAlertPrices.current[item.symbol] = item.price; 
                  }
              }
          });
          if (newAlerts.length > 0) setSystemAlerts(prev => [...newAlerts, ...prev].slice(0, 30)); 
      }
    } catch (e) { } 
  };

  const fetchStockDetail = async (symbol: string, range: string) => { 
    setIsLoadingDetail(true); 
    try { 
      const res = await fetch(`/api/stock-detail?symbol=${symbol}&range=${range}`); 
      if (res.ok) { 
        const data = await res.json(); 
        let cumulative = 0; 
        data.chart = data.chart.map((item: any) => { 
          const mockFlow = item.netFlow ?? (Math.random() * 1000000 - 500000);
          cumulative += mockFlow; 
          const validTime = item.time || item.date || item.label || item.timestamp;
          return { ...item, netFlow: mockFlow, cumulativeFlow: cumulative, normalizedTime: validTime }; 
        }); 
        setStockDetail(data); 
      } 
    } catch (e) { } 
    finally { setIsLoadingDetail(false); } 
  };

  const performSearch = async () => { if (!searchQuery) return; setIsSearching(true); try { const res = await fetch(`/api/search?q=${searchQuery}`); setSearchResults(await res.json()); } catch (e) { setSearchResults([]); } finally { setIsSearching(false); } };
  
  const addToWatchlist = (symbol: string) => { 
      const current = watchlist || []; 
      if (!current.find(i => i.symbol === symbol)) { 
          const newList = [...current, { symbol, pinned: false }]; 
          setWatchlist(newList); 
          if (userAccount?.email) localStorage.setItem(`fin_agent_watchlist_${userAccount.email}`, JSON.stringify(newList)); 
      } 
      setSearchQuery(''); setSearchResults([]); setActiveNavIndex(0); 
  };
  
  const removeTicker = (symbol: string) => { 
      if (!watchlist) return; 
      const newList = watchlist.filter(i => i.symbol !== symbol); 
      setWatchlist(newList); 
      if (userAccount?.email) localStorage.setItem(`fin_agent_watchlist_${userAccount.email}`, JSON.stringify(newList)); 
      if (selectedTicker?.symbol === symbol) setSelectedTicker(null); 
  };

  const getChangeColor = (change: number) => change > 0 ? 'text-rose-600' : change < 0 ? 'text-emerald-600' : 'text-slate-400';
  const getChartColor = () => { if (!stockDetail?.chart || stockDetail.chart.length === 0) return '#f97316'; const last = stockDetail.chart[stockDetail.chart.length - 1].price; const first = stockDetail.chart[0].price; return last >= first ? '#e11d48' : '#059669'; };
  const getFlowColor = (val: number) => val > 0 ? '#e11d48' : '#059669';
  const formatNumber = (num: number) => { if (Math.abs(num) >= 1.0e+9) return (num / 1.0e+9).toFixed(1) + "B"; if (Math.abs(num) >= 1.0e+6) return (num / 1.0e+6).toFixed(1) + "M"; if (Math.abs(num) >= 1.0e+3) return (num / 1.0e+3).toFixed(1) + "K"; return num.toString(); };
  
  const handleZoomWheel = (e: React.WheelEvent) => { 
     if (!stockDetail?.chart || !zoomState) return;
     const ZOOM_SPEED = Math.max(1, Math.floor(stockDetail.chart.length * 0.05)); 
     const direction = e.deltaY < 0 ? 1 : -1;
     let { left, right } = zoomState;
     const len = stockDetail.chart.length;
     if (direction === 1) {
       const newLeft = left + ZOOM_SPEED; const newRight = right - ZOOM_SPEED;
       if (newRight - newLeft > 10) setZoomState({ left: newLeft, right: newRight });
     } else {
       const newLeft = Math.max(0, left - ZOOM_SPEED); const newRight = Math.min(len - 1, right + ZOOM_SPEED);
       setZoomState({ left: newLeft, right: newRight });
     }
  };

  const handleAuthAction = async () => {
      if (!authEmail || !authEmail.includes('@')) return alert('请输入有效的邮箱地址');
      if (!authPassword || authPassword.length < 6) return alert('密码长度不能少于6位');
      
      setIsSendingEmail(true);
      try {
          if (authMode === 'login') {
              const res = await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'login', email: authEmail, password: authPassword })
              });
              const data = await res.json();
              if (res.ok) {
                  const newUser = { email: authEmail };
                  setUserAccount(newUser);
                  localStorage.setItem('fin_agent_user', JSON.stringify(newUser));
                  setAuthEmail('');
                  setAuthPassword('');
                  setShowAuthModal(false);
                  setShowLanding(false);
              } else {
                  alert(data.error || '登录失败');
              }
          } else if (authMode === 'register') {
              const res = await fetch('/api/auth', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'send', email: authEmail }) 
              });
              if (res.ok) {
                  setAuthMode('verify');
              } else {
                  alert('验证码发送失败，请检查网络或后端配置。');
              }
          }
      } catch(e) {
          console.error(e);
          alert("服务连接失败，请检查网络。");
      } finally {
          setIsSendingEmail(false);
      }
  };

  const handleVerifyCode = async () => {
      try {
          const res = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'verify', email: authEmail, code: userInputCode, password: authPassword })
          });
          const data = await res.json();
          
          if (res.ok) {
              const newUser = { email: authEmail };
              setUserAccount(newUser);
              localStorage.setItem('fin_agent_user', JSON.stringify(newUser));
              setAuthEmail('');
              setUserInputCode('');
              setAuthPassword('');
              setShowAuthModal(false);
              setShowLanding(false); 
          } else {
              alert(data.error || "验证码错误，请重试！(开发测试期可直接输入万能码 123456)");
          }
      } catch (e) {
          alert("验证服务请求失败，请检查网络环境。");
      }
  };

  const renderAuthModal = () => {
      if (!showAuthModal) return null;
      return (
          <div className="fixed inset-0 z-[6000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                  <div className="absolute top-4 right-4 z-10">
                      <button onClick={() => setShowAuthModal(false)} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={16}/></button>
                  </div>
                  
                  <div className="p-10">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm mb-6">
                          <Lock size={24} className="text-indigo-600" />
                      </div>
                      
                      {authMode === 'verify' ? (
                          <div className="text-center py-6 animate-in slide-in-from-right-4">
                              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"><Mail size={32} className="text-emerald-500"/></div>
                              <h2 className="text-2xl font-black text-slate-900 mb-2"><span>Verify your email</span></h2>
                              <div className="text-sm text-slate-500 mb-6 px-4"><span>We've sent a 6-digit code to <b>{authEmail}</b>. Check your inbox.</span></div>
                              <input 
                                  type="text" 
                                  maxLength={6}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all mb-6"
                                  placeholder="••••••"
                                  value={userInputCode}
                                  onChange={e => setUserInputCode(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                              />
                              <button onClick={handleVerifyCode} className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2">
                                  <CheckCircle2 size={18}/> <span>确认验证 (Verify)</span>
                              </button>
                          </div>
                      ) : (
                          <div className="animate-in slide-in-from-left-4">
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                                  <span>{authMode === 'login' ? 'Welcome back' : 'Create account'}</span>
                              </h2>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                                  <span>{authMode === 'login' ? 'Sign in to access your terminal' : 'Register for real-time alerts'}</span>
                              </div>
                              
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"><span>Email Address</span></label>
                                      <input 
                                          type="email" 
                                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                                          placeholder="name@company.com"
                                          value={authEmail}
                                          onChange={e => setAuthEmail(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide"><span>Password</span></label>
                                      <input 
                                          type="password" 
                                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
                                          placeholder="••••••••"
                                          value={authPassword}
                                          onChange={e => setAuthPassword(e.target.value)}
                                          onKeyDown={e => e.key === 'Enter' && handleAuthAction()}
                                      />
                                  </div>
                                  <button disabled={isSendingEmail} onClick={handleAuthAction} className="w-full mt-2 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50">
                                      <span>{isSendingEmail ? (authMode === 'login' ? 'Signing In...' : 'Sending...') : (authMode === 'login' ? 'Sign In' : 'Register & Send Email')}</span>
                                  </button>
                              </div>
                              
                              <div className="mt-6 text-center text-xs text-slate-500">
                                  <span>{authMode === 'login' ? "Don't have an account? " : "Already have an account? "}</span>
                                  <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                                      <span>{authMode === 'login' ? 'Sign up' : 'Log in'}</span>
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const currentNewsData = selectedTicker ? (stockDetail?.news || []) : globalNews;
  const zoomedChartData = (isFlowChartExpanded && stockDetail?.chart && zoomState) ? stockDetail.chart.slice(zoomState.left, zoomState.right + 1) : (stockDetail?.chart || []);

  const axisColor = '#64748b';
  const gridColor = '#e2e8f0';

  if (!isMounted) return null;

  // ==========================================
  // 🌟 欢迎页面 (Landing Page)
  // ==========================================
  if (showLanding) {
      return (
          <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-800 flex flex-col relative selection:bg-indigo-500/20">
              <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      <Activity size={16} className="animate-pulse" /> 
                      <span className="font-black italic tracking-tighter text-sm">FIN-AGENT</span>
                  </div>
                  <button onClick={() => {setAuthMode('login'); setShowAuthModal(true);}} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"><span>Sign In</span></button>
              </header>
              
              <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-50">
                  <div className="w-20 h-20 bg-white border border-slate-100 rounded-3xl shadow-xl flex items-center justify-center mb-8 relative">
                      <div className="absolute -inset-8 bg-indigo-400/20 rounded-full blur-2xl animate-pulse" />
                      <Bot size={40} className="text-indigo-600 relative z-10" />
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 max-w-4xl leading-tight">
                      <span>The Autonomous </span><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">AI Financial</span><span> Terminal</span>
                  </h1>
                  <div className="text-lg md:text-xl text-slate-500 max-w-2xl mb-12 leading-relaxed font-medium">
                      <span>Deep research, real-time alerts, and personalized tactical analysis powered by next-gen reasoning models. Your 24/7 intelligent investment copilot.</span>
                  </div>
                  <button 
                      onClick={() => {setAuthMode('register'); setShowAuthModal(true);}} 
                      className="px-8 py-4 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-3"
                  >
                      <span>Let's get started</span> <ArrowRight size={20} />
                  </button>
                  
                  <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-left">
                      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100"><BrainCircuit size={24}/></div>
                          <h3 className="text-xl font-black text-slate-900 mb-3"><span>Deep Reasoning</span></h3>
                          <div className="text-sm text-slate-500 leading-relaxed"><span>Powered by DeepSeek V3/R1 and GLM-5. Uncover hidden market logic beyond surface-level data with dual-track analysis.</span></div>
                      </div>
                      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100"><Archive size={24}/></div>
                          <h3 className="text-xl font-black text-slate-900 mb-3"><span>Auto-RAG Memory</span></h3>
                          <div className="text-sm text-slate-500 leading-relaxed"><span>The Agent automatically archives your conversations and preferences to provide highly contextualized tactical advice over time.</span></div>
                      </div>
                      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 border border-rose-100"><Activity size={24}/></div>
                          <h3 className="text-xl font-black text-slate-900 mb-3"><span>Real-time Intel</span></h3>
                          <div className="text-sm text-slate-500 leading-relaxed"><span>24/7 global news scraping and smart money flow tracking with automated volatility alerts delivered straight to your dashboard.</span></div>
                      </div>
                  </div>
              </main>
              {renderAuthModal()}
          </div>
      );
  }

  // ==========================================
  // 🌟 控制台主页面 (Dashboard)
  // ==========================================
  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden selection:bg-indigo-500/20 bg-slate-50 text-slate-800 relative">

      {/* --- Top Header --- */}
      <div className="h-10 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-30 shadow-sm relative">
        <div className="flex gap-6 text-[11px] font-medium tracking-tight items-center">
            <div className="flex gap-2 items-center text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                <Activity size={14} className="animate-pulse" /> 
                <span className="font-black italic tracking-tighter text-xs">FIN-AGENT</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex gap-5 overflow-hidden text-slate-500 font-mono items-center">
                {marketData.slice(0, 5).map(m => (
                    <div key={m.symbol} className="flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        <span className="text-slate-500 font-bold">{m.symbol}</span> 
                        <b className={getChangeColor(m.change)}>{m.price?.toFixed(2)}</b>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block"><span>AI Core:</span></span>
            <div className="relative group z-50">
                <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all shadow-sm hover:shadow ${
                    activeEngine === 'deepseek' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' :
                    activeEngine === 'zhipu' ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100' :
                    'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}>
                    {activeEngine === 'deepseek' ? <Flame size={12} /> : activeEngine === 'zhipu' ? <BrainCircuit size={12} /> : <CloudLightning size={12} />}
                    <span>{activeEngine === 'deepseek' ? 'DeepSeek V3' : activeEngine === 'zhipu' ? 'Zhipu GLM-5' : 'Gemini 1.5'}</span>
                    <ChevronDown size={10} className="opacity-50" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden">
                    <div className="p-1.5 flex flex-col gap-1">
                        <div onClick={() => setActiveEngine('deepseek')} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors ${activeEngine === 'deepseek' ? 'bg-indigo-50 border border-indigo-100' : 'border border-transparent'}`}>
                            <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600"><Flame size={14} /></div>
                            <div><div className="text-xs font-bold text-slate-800"><span>DeepSeek V3</span></div><div className="text-[9px] text-slate-500"><span>Advanced Reasoning (R1)</span></div></div>
                        </div>
                        <div onClick={() => setActiveEngine('zhipu')} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors ${activeEngine === 'zhipu' ? 'bg-teal-50 border border-teal-100' : 'border border-transparent'}`}>
                            <div className="p-1.5 bg-teal-100 rounded-md text-teal-600"><BrainCircuit size={14} /></div>
                            <div><div className="text-xs font-bold text-slate-800"><span>Zhipu GLM-5</span></div><div className="text-[9px] text-slate-500"><span>Forced Thinking Mode</span></div></div>
                        </div>
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-50 cursor-not-allowed bg-slate-50 border border-slate-100`}>
                            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600"><CloudLightning size={14} /></div>
                            <div>
                                <div className="text-xs font-bold text-slate-800 flex items-center gap-2"><span>Google Gemini</span></div>
                                <div className="text-[9px] font-bold text-orange-600 mt-0.5"><span>即将上线</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="w-px h-4 bg-slate-200 mx-1" />
            
            {userAccount ? (
                <div className="relative group z-50">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <User size={12} className="text-indigo-500"/>
                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-[100px]">{userAccount.email}</span>
                        <ChevronDown size={10} className="text-slate-400" />
                    </div>
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden">
                        <div className="p-1.5 flex flex-col gap-1">
                            <div onClick={() => setActiveNavIndex(3)} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors">
                                <Settings size={14} className="text-slate-500" />
                                <span className="text-xs font-bold text-slate-700"><span>Settings & Memory</span></span>
                            </div>
                            <div onClick={handleSwitchUser} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-slate-50 transition-colors">
                                <RefreshCw size={14} className="text-slate-500" />
                                <span className="text-xs font-bold text-slate-700"><span>Switch User</span></span>
                            </div>
                            <div className="h-px bg-slate-100 my-0.5" />
                            <div onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-rose-50 transition-colors">
                                <LogOut size={14} className="text-rose-500" />
                                <span className="text-xs font-bold text-rose-600"><span>Logout</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <button onClick={() => {setAuthMode('login'); setShowAuthModal(true);}} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white border border-indigo-700 rounded-lg hover:bg-indigo-500 transition-all shadow-sm">
                    <LogIn size={12}/>
                    <span className="text-[10px] font-bold"><span>Sign In</span></span>
                </button>
            )}
        </div>
      </div>

      {/* --- Main Navigation Menu --- */}
      <nav className="h-14 border-b border-slate-200 flex items-center px-4 justify-between bg-white shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-4 w-2/5 relative">
          <div 
             onClick={handleReturnHome} 
             className="cursor-pointer bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-500 p-2.5 rounded-xl transition-all shadow-sm group relative flex items-center justify-center"
          >
             <LayoutDashboard size={16} />
             <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-xl transition-opacity">
                <span>返回工作台主页</span>
             </div>
          </div>

          <div className="relative w-full max-w-md group z-50">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-mono placeholder:text-slate-400 shadow-inner" 
                  placeholder={t.search} 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()} 
              />
              {isSearching ? <div className="absolute top-full left-0 w-full bg-white border border-slate-200 mt-2 rounded-2xl shadow-2xl py-4 px-4 text-[11px] font-bold text-indigo-500 flex items-center gap-2"><Activity size={14} className="animate-pulse"/> <span>{t.scanning}</span></div> : null}
              {searchResults.length > 0 ? (
                  <div className="absolute top-full left-0 w-full bg-white border border-slate-200 mt-2 rounded-2xl shadow-2xl max-h-[400px] overflow-y-auto py-2">
                      {searchResults.map((res) => (
                          <div key={res.symbol} onClick={() => addToWatchlist(res.symbol)} className="px-5 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0 group transition-colors">
                              <div>
                                  <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 font-mono transition-colors">{res.symbol}</div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">{res.name}</div>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                  <span className="text-slate-400 group-hover:text-indigo-500">+</span>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : null}
          </div>
        </div>
        <div className="flex gap-2 items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
           {t.nav.map((item, idx) => (
             <button 
               key={item} 
               onClick={() => { setActiveNavIndex(idx); setSelectedTicker(null); setIsGlobalChatActive(false); setIsStockChatExpanded(false); }}
               className={`px-5 py-2 text-[11px] font-bold rounded-lg transition-all uppercase tracking-tight ${activeNavIndex === idx ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'}`}
             >
               <span>{item}</span>
             </button>
           ))}
        </div>
        <div className="flex gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
           {['ZH', 'EN', 'JA', 'KO'].map(l => (
               <button key={l} onClick={() => setLang(l as any)} className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${lang === l ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-400 hover:text-slate-700'}`}><span>{l}</span></button>
           ))}
        </div>
      </nav>

      {/* --- Dynamic Main Views --- */}
      <main className="flex-1 bg-slate-50 min-h-0 overflow-hidden flex flex-col p-4 relative z-0">
        
        {/* VIEW 0: Workspaces */}
        {activeNavIndex === 0 && (
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
             
             {/* Left: Watchlist */}
             <section className="col-span-2 bg-white rounded-2xl flex flex-col border border-slate-200 shadow-sm min-h-0 overflow-hidden relative">
               <header className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex justify-between items-center shrink-0 backdrop-blur-sm z-10">
                   <div className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2"><BarChart4 size={14} className="text-indigo-500"/> <span>{t.watchlist}</span></div>
                   <button onClick={() => watchlist && fetchOverviewData(watchlist)} className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all text-slate-500">
                       <RefreshCw size={12} />
                   </button>
               </header>
               <div className="flex-1 overflow-y-auto p-2 space-y-1">
                   {marketData.map(item => (
                       <div key={item.symbol} onClick={() => {setSelectedTicker(item); setTimeRange('1D');}} className={`px-4 py-3 rounded-xl cursor-pointer group transition-all border ${selectedTicker?.symbol === item.symbol ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}>
                           <div className="flex justify-between items-center mb-1.5">
                               <span className={`text-sm font-bold font-mono transition-colors ${selectedTicker?.symbol === item.symbol ? 'text-indigo-700' : 'text-slate-800'}`}>{item.symbol}</span>
                               <Trash2 size={12} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => {e.stopPropagation(); removeTicker(item.symbol)}}/>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-xs text-slate-500 font-mono font-medium">{item.price?.toFixed(2)}</span>
                               <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-md ${item.change > 0 ? 'bg-rose-50 text-rose-600' : item.change < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                   {item.change ? (item.change > 0 ? '+' : '') + item.change.toFixed(2) + '%' : '0.00%'}
                               </span>
                           </div>
                       </div>
                   ))}
               </div>
             </section>

             {/* Center: Agent Logic or Stock */}
             <section className="col-span-7 bg-white rounded-2xl flex flex-col relative min-h-0 border border-slate-200 shadow-sm overflow-hidden">
                {selectedTicker ? (
                  <>
                    <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 z-10">
                      <div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                              <span>{selectedTicker.symbol}</span> 
                              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-semibold border border-slate-200">{selectedTicker.name}</span>
                          </h1>
                      </div>
                      <div className="text-right flex flex-col items-end">
                          <span className={`text-2xl font-mono font-black ${getChangeColor(selectedTicker.change)}`}>{selectedTicker.price?.toFixed(2)}</span>
                          <span className={`text-xs font-mono font-bold mt-0.5 ${getChangeColor(selectedTicker.change)}`}>{selectedTicker.change ? (selectedTicker.change > 0 ? '+' : '') + selectedTicker.change.toFixed(2) + '%' : '0.00%'}</span>
                      </div>
                    </div>

                    {isLoadingDetail || !stockDetail ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                          <Activity size={32} className="animate-pulse text-indigo-400" />
                          <div className="text-xs font-bold tracking-widest uppercase"><span>{t.loading}</span></div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col relative">
                        
                        {!isStockChatExpanded ? (
                            <>
                                {/* Chart Section */}
                                <div className="h-[320px] w-full p-4 relative border-b border-slate-200 shrink-0 bg-white">
                                   <div className="absolute top-6 left-8 z-10 flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                       {TIME_RANGES.map(r => (
                                           <button key={r} onClick={() => setTimeRange(r)} className={`text-[10px] font-bold px-3.5 py-1.5 rounded-lg transition-all ${timeRange === r ? 'bg-white text-indigo-600 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}><span>{r}</span></button>
                                       ))}
                                   </div>
                                   <ResponsiveContainer width="100%" height="100%">
                                     <AreaChart data={stockDetail.chart} margin={{top:50,right:10,left:10,bottom:0}}>
                                       <defs>
                                           <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e11d48" stopOpacity={0.15}/><stop offset="95%" stopColor="#e11d48" stopOpacity={0}/></linearGradient>
                                           <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.15}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
                                       </defs>
                                       <XAxis dataKey="normalizedTime" axisLine={false} tickLine={false} tick={{fontSize:11, fill: axisColor, fontWeight: 500}} minTickGap={40} tickFormatter={formatXAxis} dy={10} />
                                       <YAxis domain={['auto','auto']} orientation="right" hide/>
                                       <Tooltip contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', fontSize:'12px', borderRadius:'12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'}} cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray:'4 4'}} labelFormatter={formatXAxis}/>
                                       <ReferenceLine y={stockDetail.prevClose} stroke={gridColor} strokeWidth={2} strokeDasharray="4 4"/>
                                       <Area type="monotone" dataKey="price" stroke={getChartColor()} fill={`url(#${getChartColor() === '#e11d48' ? "gradUp" : "gradDown"})`} strokeWidth={2.5} connectNulls={true}/>
                                     </AreaChart>
                                   </ResponsiveContainer>
                                </div>
                                
                                <div className="min-h-[220px] border-b border-slate-200 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-4 p-5 shrink-0">
                                   
                                   <div className="flex flex-col bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                                       <div className="flex items-center gap-2 mb-4">
                                           <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100"><Users size={14} className="text-indigo-600"/></div>
                                           <div className="text-xs font-black text-slate-700 uppercase tracking-widest"><span>{t.ownership}</span></div>
                                       </div>
                                       <div className="flex-1 flex items-center gap-6">
                                           <div className="w-28 h-28 relative shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFloatingPrompt({x: e.clientX, y: e.clientY, contextText: `分析 ${selectedTicker.symbol} 的总体股东结构和筹码集中度`}); }}>
                                               <ResponsiveContainer width="100%" height="100%">
                                                   <PieChart><Pie data={stockDetail.ownership} innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value" isAnimationActive={false} stroke="none"><Cell fill="#6366f1"/><Cell fill="#eab308"/><Cell fill="#10b981"/></Pie></PieChart>
                                               </ResponsiveContainer>
                                               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 rounded-full"><Sparkles size={16} className="text-indigo-600"/></div>
                                           </div>
                                           <div className="flex flex-col gap-2.5 w-full min-w-0">
                                               {stockDetail.ownership?.map((o: any) => (
                                                   <div key={o.name} 
                                                        onClick={(e) => { e.stopPropagation(); setFloatingPrompt({x: e.clientX, y: e.clientY, contextText: `深度分析 ${selectedTicker.symbol} 的 ${getOwnershipLabel(o.name)} 持仓占比 (${o.value}%) 说明了什么`}); }}
                                                        className="flex items-center justify-between bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 px-3 py-2 rounded-lg border border-slate-100 cursor-pointer transition-colors"
                                                   >
                                                       <div className="flex items-center gap-2 min-w-0">
                                                           <div className="w-2 h-2 rounded-full shadow-sm shrink-0" style={{backgroundColor:o.color}}/>
                                                           <span className="text-[11px] font-bold text-slate-600 truncate">
                                                               <span>{getOwnershipLabel(o.name)}</span>
                                                           </span>
                                                       </div>
                                                       <span className="text-xs font-bold font-mono text-slate-800">{o.value}%</span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                   </div>

                                   <div className="flex flex-col bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                                       <div className="flex items-center gap-2 mb-4 shrink-0">
                                           <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100"><Building2 size={14} className="text-emerald-600"/></div>
                                           <div className="text-xs font-black text-slate-700 uppercase tracking-widest"><span>{t.top_inst}</span></div>
                                       </div>
                                       <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-0">
                                           {stockDetail.topInstitutions && stockDetail.topInstitutions.length > 0 ? (
                                               stockDetail.topInstitutions.map((inst: any, idx: number) => (
                                                   <div key={idx} 
                                                        onClick={(e) => { e.stopPropagation(); setFloatingPrompt({x: e.clientX, y: e.clientY, contextText: `分析机构 ${inst.name} 在 ${selectedTicker.symbol} 中的持仓策略及历史风格`}); }}
                                                        className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-colors border border-slate-100 rounded-xl cursor-pointer group"
                                                   >
                                                       <span className="text-xs font-bold text-slate-700 truncate max-w-[65%] group-hover:text-emerald-700">{inst.name}</span>
                                                       <span className="text-xs font-bold font-mono text-emerald-600 bg-white px-2 py-1 rounded-md shadow-sm border border-emerald-50">{inst.value}</span>
                                                   </div>
                                               ))
                                           ) : (<div className="text-xs text-slate-400 italic py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50"><span>No data available</span></div>)}
                                       </div>
                                   </div>

                                </div>

                                {/* Flow Chart */}
                                <div className="h-[160px] bg-white p-6 flex flex-col relative border-b border-slate-200 shrink-0 group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setIsFlowChartExpanded(true)}>
                                    <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity"><div className="p-2 bg-white rounded-lg shadow border border-slate-200"><Maximize2 size={14} className="text-indigo-600" /></div></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2"><div className="p-1.5 bg-rose-50 rounded-lg"><BarChart3 size={14} className="text-rose-600"/></div><div className="text-xs font-black text-slate-700 uppercase tracking-widest"><span>{t.net_flow} ({timeRange})</span></div></div>
                                        <div className="flex gap-4 text-[10px] font-mono items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-600"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"/> <span>{t.flow_in}</span></div>
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-600"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"/> <span>{t.flow_out}</span></div>
                                            <div className="flex items-center gap-1.5 font-semibold text-slate-600"><div className="w-4 h-1 bg-slate-300 rounded-full"/> <span>{t.cumulative}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 pointer-events-none">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={stockDetail.chart} margin={{top:5, right:0, left:-20, bottom:0}}>
                                                <CartesianGrid stroke={gridColor} vertical={false} strokeDasharray="3 3" />
                                                <XAxis dataKey="normalizedTime" hide />
                                                <YAxis yAxisId="left" tick={{fontSize: 10, fill: axisColor, fontWeight: 500}} tickFormatter={formatNumber} axisLine={false} tickLine={false} />
                                                <YAxis yAxisId="right" orientation="right" hide />
                                                <ReferenceLine y={0} yAxisId="left" stroke={'#cbd5e1'} strokeWidth={1} />
                                                <Bar yAxisId="left" dataKey="netFlow" barSize={6} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                                                    {stockDetail.chart?.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={getFlowColor(entry.netFlow)} />))}
                                                </Bar>
                                                <Line yAxisId="right" type="monotone" dataKey="cumulativeFlow" stroke="#94a3b8" dot={false} strokeWidth={2} isAnimationActive={false} connectNulls={true} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : null}

                        {/* Agent Insight Chat */}
                        <div className={`bg-white flex flex-col transition-all duration-500 ease-in-out ${isStockChatExpanded ? 'flex-1' : 'h-[280px] shrink-0'}`}>
                          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
                              <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                                      {activeEngine === 'deepseek' ? <Flame size={16} className="text-indigo-600"/> : activeEngine === 'zhipu' ? <BrainCircuit size={16} className="text-teal-600"/> : <CloudLightning size={16} className="text-blue-600"/>}
                                  </div>
                                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                      <span>DEEP DIVE: {selectedTicker.symbol}</span>
                                  </div>
                              </div>
                              <div className="flex gap-3 items-center">
                                  <button onClick={handleArchiveStockChat} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-500 hover:text-white transition-all shadow-sm flex items-center gap-1.5">
                                      <Archive size={12}/> <span>{t.archive_clear}</span>
                                  </button>
                                  <button onClick={() => setIsStockChatExpanded(!isStockChatExpanded)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm">
                                      {isStockChatExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                  </button>
                              </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                              {stockChatMessages.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200"><Bot size={32} /></div>
                                      <div className="text-sm font-medium"><span>Ask about {selectedTicker.symbol}&apos;s technicals or fundamentals...</span></div>
                                  </div>
                              ) : null}
                              {stockChatMessages.map((msg, idx) => (
                                  <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-white border-slate-200 text-slate-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                          {msg.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                                      </div>
                                      <div className={`max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'}`}>
                                          {msg.role === 'user' ? (
                                              <span>{msg.content}</span> 
                                          ) : (
                                              <MessageFormatter content={msg.content} isStreaming={isStockChatStreaming && idx === stockChatMessages.length - 1} />
                                          )}
                                      </div>
                                  </div>
                              ))}
                              <div ref={stockChatEndRef} />
                          </div>
                          <div className="p-5 bg-white border-t border-slate-200">
                              <div className="bg-slate-50 border border-slate-300 rounded-2xl p-2 pl-4 flex gap-3 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all shadow-sm">
                                  <input 
                                      disabled={isStockChatStreaming} 
                                      className="bg-transparent border-none outline-none text-sm text-slate-800 w-full font-sans placeholder:text-slate-400" 
                                      placeholder={t.agent_placeholder} 
                                      value={stockChatInput} 
                                      onChange={(e) => setStockChatInput(e.target.value)} 
                                      onKeyDown={(e) => e.key === 'Enter' && handleStockChatSend()} 
                                  />
                                  {isStockChatStreaming ? (
                                      <button onClick={handleStopGeneration} className="p-2.5 bg-rose-500 rounded-xl text-white hover:bg-rose-600 transition shadow-lg"><Square size={16} fill="currentColor" /></button>
                                  ) : (
                                      <button disabled={!stockChatInput.trim()} onClick={() => handleStockChatSend()} className="bg-indigo-600 text-white p-2.5 rounded-xl disabled:opacity-50 hover:bg-indigo-500 transition-colors shadow-md">
                                          <Send size={16} />
                                      </button>
                                  )}
                              </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : isGlobalChatActive ? (
                  // Global Chat View
                  <div className="flex-1 flex flex-col bg-slate-50/50 animate-in fade-in zoom-in-95 duration-200 min-h-0 overflow-hidden">
                     <div className="px-8 py-5 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm"><Bot size={20} className="text-indigo-600" /></div>
                            <div><h1 className="text-lg font-black text-slate-900 tracking-widest uppercase"><span>{t.global_chat_title}</span></h1><div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> <span>ONLINE</span></div></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleArchiveGlobalChat} className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl cursor-pointer hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
                                <Archive size={14}/> <span>{t.archive_clear}</span>
                            </button>
                            <button onClick={() => setIsGlobalChatActive(false)} className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all flex items-center gap-2 shadow-sm"><Keyboard size={14} /> <span>{t.esc_to_exit}</span></button>
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                        <div className="flex gap-5 max-w-4xl mx-auto">
                           <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm"><Bot size={18} className="text-indigo-600" /></div>
                           <div className="space-y-1.5 w-full">
                               <div className="flex items-center gap-2"><span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider"><span>FIN-AGENT CORE</span></span><span className="text-[10px] font-bold text-slate-400 font-mono"><span>Live</span></span></div>
                               <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-5 text-sm text-slate-700 leading-relaxed shadow-sm"><div className="font-medium mb-2"><span>Connected to <b className="text-slate-900">{activeEngine === 'deepseek' ? 'DeepSeek V3/R1' : activeEngine === 'zhipu' ? 'Zhipu GLM-5' : 'Google Gemini'}</b>. Ask me anything.</span></div></div>
                           </div>
                        </div>
                        {globalChatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-5 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-white border-slate-200 text-slate-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                   {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                               </div>
                               <div className={`space-y-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                                   <div className="flex items-center gap-2">
                                       <span className={`text-[11px] font-black uppercase tracking-wider ${msg.role === 'user' ? 'text-slate-500' : 'text-indigo-600'}`}><span>{msg.role === 'user' ? 'YOU' : 'FIN-AGENT'}</span></span>
                                       {msg.role === 'user' ? null : <span className="text-[10px] font-bold text-slate-400 font-mono"><span>{new Date(msg.timestamp).toLocaleTimeString()}</span></span>}
                                   </div>
                                   <div className={`border rounded-2xl p-5 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-sm' : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                                       {msg.role === 'user' ? <span>{msg.content}</span> : <MessageFormatter content={msg.content} isStreaming={isGlobalChatStreaming && idx === globalChatMessages.length - 1} />}
                                   </div>
                               </div>
                            </div>
                        ))}
                        <div ref={globalChatEndRef} />
                     </div>
                     <div className="p-6 bg-white border-t border-slate-200 shrink-0">
                        <div className="max-w-4xl mx-auto relative flex items-center gap-4 bg-slate-50 border border-slate-300 rounded-2xl p-2 pl-5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all shadow-sm">
                           <div className="text-indigo-500 font-mono text-sm animate-pulse font-bold"><span>{'>'}</span></div>
                           <input className="bg-transparent border-none outline-none text-base text-slate-800 w-full placeholder:text-slate-400 font-sans" placeholder={t.global_chat_placeholder} value={globalChatInput} onChange={(e) => setGlobalChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGlobalChatSend()} autoFocus />
                           {isGlobalChatStreaming ? (
                               <button onClick={handleStopGeneration} className="p-3 bg-rose-500 rounded-xl text-white hover:bg-rose-600 transition shadow-lg"><Square size={18} fill="currentColor" /></button>
                           ) : (
                               <button disabled={!globalChatInput.trim()} className="p-3 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition shadow-lg disabled:opacity-50" onClick={handleGlobalChatSend}><Send size={18} /></button>
                           )}
                        </div>
                     </div>
                  </div>
                ) : (
                   // 🌟 修复：主工作台中控台对话框回归！
                   <div className="h-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-50">
                      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700 w-full max-w-3xl px-8">
                         
                         <div className="cursor-pointer group relative" onClick={() => setIsGlobalChatActive(true)}>
                             <div className="relative group-hover:scale-110 transition-transform duration-500 ease-out"><div className="absolute -inset-12 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" /><div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl shadow-xl flex items-center justify-center relative z-10"><Bot size={48} className="text-indigo-600" /></div></div>
                         </div>
                         
                         <div className="text-center space-y-2">
                             <div className="text-2xl font-light text-slate-800 tracking-wide flex items-center justify-center gap-3">
                                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]" />
                                 <span>{t.agent_welcome}</span>
                             </div>
                             <div className="text-xs font-mono font-bold tracking-[0.2em] text-slate-400 uppercase"><span>{t.system_ready}</span></div>
                         </div>
                         
                         {/* 🌟 巨大中心化对话框 */}
                         <div className="w-full relative z-50">
                             <div className="relative flex items-center gap-4 bg-white border border-slate-300 rounded-2xl p-2 pl-6 shadow-xl focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                                 <div className="text-indigo-500 font-mono text-lg animate-pulse font-bold"><span>{'>'}</span></div>
                                 <input 
                                     className="bg-transparent border-none outline-none text-lg text-slate-800 w-full placeholder:text-slate-400 font-sans py-3" 
                                     placeholder={t.global_chat_placeholder} 
                                     value={globalChatInput} 
                                     onChange={(e) => setGlobalChatInput(e.target.value)} 
                                     onKeyDown={(e) => {
                                         if (e.key === 'Enter' && globalChatInput.trim()) {
                                             setIsGlobalChatActive(true);
                                             setTimeout(handleGlobalChatSend, 0); // 利用异步确保状态切换完毕后再发请求
                                         }
                                     }} 
                                 />
                                 <button 
                                     disabled={!globalChatInput.trim()} 
                                     className="p-4 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition shadow-lg disabled:opacity-50" 
                                     onClick={() => {
                                         setIsGlobalChatActive(true);
                                         setTimeout(handleGlobalChatSend, 0);
                                     }}
                                 >
                                     <Send size={20} />
                                 </button>
                             </div>
                         </div>

                      </div>
                   </div>
                )}
             </section>

             {/* Right: News Sidebar */}
             <section className="col-span-3 bg-white rounded-2xl flex flex-col border border-slate-200 shadow-sm min-h-0 overflow-hidden">
                <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1 bg-orange-100 rounded-md"><Globe2 size={12} className="text-orange-600"/></div>
                        <div className="text-xs font-black text-slate-700 uppercase tracking-widest"><span>{selectedTicker ? `${t.intel} ${selectedTicker.symbol}` : t.top_stories}</span></div>
                    </div>
                </div>
                {!selectedTicker && (
                    <div className="bg-white border-b border-slate-200 flex shrink-0 p-1.5 gap-1.5">
                        {CATEGORIES.map((cat) => (
                            <button 
                                key={cat.id} 
                                onClick={() => setActiveTab(cat.id)} 
                                className={`flex-1 py-2.5 flex flex-col items-center gap-1.5 transition-all rounded-lg ${activeTab === cat.id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'bg-transparent border border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                            >
                                {cat.icon}
                                <span className="text-[10px] font-bold tracking-tight uppercase"><span>{cat.label}</span></span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-2 space-y-2">
                  {isLoadingNews || (selectedTicker && isLoadingDetail) ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <Activity size={24} className="animate-pulse text-indigo-400"/>
                        <div className="text-[10px] font-bold tracking-widest uppercase"><span>{t.loading_news}</span></div>
                    </div>
                  ) : currentNewsData.length > 0 ? (
                    currentNewsData.map((news: any) => (
                     <div key={news.id} onClick={() => setReadingNews(news)} className="p-4 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl transition-all group cursor-pointer relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTacticalNews(news); }} className="absolute top-3 right-3 z-20 p-1.5 bg-indigo-50 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-indigo-100 rounded-lg shadow-sm"><Sparkles size={14} /></button>
                        <div className="block pr-6">
                          <div className="flex items-center gap-2.5 mb-2.5">
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase border border-slate-200"><span>{news.source}</span></span>
                              <span className="text-[10px] font-mono font-medium text-slate-400"><span>{news.time}</span></span>
                          </div>
                          <div className="text-xs text-slate-700 group-hover:text-indigo-700 leading-relaxed font-bold transition-colors line-clamp-3"><span>{news.title}</span></div>
                        </div>
                     </div>
                    ))
                  ) : (<div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-dashed border-slate-200 rounded-xl m-2"><span>No news available</span></div>)}
                </div>
             </section>
          </div>
        )}

        {/* VIEW 1: News Terminal */}
        {activeNavIndex === 1 && (
           <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-10">
               <div className="max-w-7xl mx-auto">
                   <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-200">
                       <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm"><Globe2 size={24} className="text-indigo-600" /></div>
                       <div>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase"><span>GLOBAL NEWS TERMINAL</span></h2>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1"><span>Real-time Intel Aggregation</span></div>
                       </div>
                   </div>
                   
                   {isLoadingAllNews ? (
                       <div className="flex flex-col justify-center items-center h-64 text-slate-400 gap-4">
                           <Activity size={32} className="animate-pulse text-indigo-400" />
                           <div className="text-xs font-bold font-mono tracking-widest uppercase"><span>SCANNING GLOBAL INTEL...</span></div>
                       </div>
                   ) : (
                       <div className="space-y-16">
                           {CATEGORIES.map(cat => (
                               <div key={cat.id}>
                                   <div className="flex items-center gap-3 mb-6">
                                       <div className="p-2 bg-slate-100 rounded-lg text-slate-600 border border-slate-200 shadow-sm">{cat.icon}</div>
                                       <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase"><span>{cat.label}</span></h3>
                                       <div className="flex-1 h-px bg-slate-200 ml-4" />
                                       <div className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                          <span>LIVE FEED</span>
                                       </div>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                       {(allCategoryNews[cat.id] || []).slice(0, 9).map((news: any) => (
                                           <div key={news.id} onClick={() => setReadingNews(news)} className="bg-white border border-slate-200 p-6 rounded-2xl cursor-pointer hover:border-indigo-300 hover:shadow-xl transition-all group relative flex flex-col justify-between min-h-[160px]">
                                               <div>
                                                   <div className="flex justify-between items-start mb-4">
                                                       <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase border border-slate-200 shadow-sm"><span>{news.source}</span></span>
                                                       <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTacticalNews(news); }} className="p-1.5 bg-indigo-50 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 rounded-lg shadow-sm border border-indigo-100"><Sparkles size={14} /></button>
                                                   </div>
                                                   <div className="text-sm text-slate-800 group-hover:text-indigo-700 font-bold leading-relaxed line-clamp-3"><span>{news.title}</span></div>
                                               </div>
                                               <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                                   <span className="text-[10px] font-mono font-bold text-slate-400"><span>{news.time}</span></span>
                                                   <ExternalLink size={12} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                               </div>
                                           </div>
                                       ))}
                                       {(!allCategoryNews[cat.id] || allCategoryNews[cat.id].length === 0) ? (
                                           <div className="col-span-full flex items-center justify-center h-32 text-xs font-bold tracking-widest text-slate-400 uppercase bg-slate-50 rounded-2xl border border-dashed border-slate-200"><span>No intel detected</span></div>
                                       ) : null}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           </div>
        )}

        {/* VIEW 2: Alerts */}
        {activeNavIndex === 2 && (
           <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-10">
               <div className="max-w-4xl mx-auto">
                   <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-200">
                       <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm"><ShieldAlert size={24} className="text-rose-600" /></div>
                       <div>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase"><span>SYSTEM ALERTS</span></h2>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1"><span>Automated Volatility Detection</span></div>
                       </div>
                   </div>
                   <div className="space-y-4">
                       {systemAlerts.length > 0 ? (
                           systemAlerts.map(alert => (
                               <div key={alert.id} className={`${alert.type === 'up' ? 'bg-emerald-50 border-emerald-200 hover:shadow-md' : 'bg-rose-50 border-rose-200 hover:shadow-md'} border p-5 rounded-2xl flex items-center justify-between transition-all group`}>
                                   <div className="flex items-center gap-5">
                                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-white shadow-sm ${alert.type === 'up' ? 'border-emerald-100' : 'border-rose-100'}`}>
                                           <Activity size={20} className={`${alert.type === 'up' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                       </div>
                                       <div>
                                           <div className="text-sm font-black text-slate-900 group-hover:text-slate-700 transition-colors"><span>{alert.title}</span></div>
                                           <div className="text-xs font-medium text-slate-600 mt-1"><span>{alert.desc}</span></div>
                                       </div>
                                   </div>
                                   <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white shadow-sm border ${alert.type === 'up' ? 'text-emerald-600 border-emerald-100' : 'text-rose-600 border-rose-100'}`}><span>{alert.time}</span></div>
                               </div>
                           ))
                       ) : (
                           <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-4"><ShieldAlert size={32} className="text-slate-300" /></div>
                               <div className="text-sm font-bold text-slate-500"><span>{t.no_alerts}</span></div>
                           </div>
                       )}
                   </div>
               </div>
           </div>
        )}

        {/* VIEW 3: Memory */}
        {activeNavIndex === 3 && (
           <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-10">
               <div className="max-w-4xl mx-auto">
                   <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-200">
                       <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm"><Archive size={24} className="text-indigo-600" /></div>
                       <div>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase"><span>AGENT MEMORY</span></h2>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1"><span>Personalization & Auto-RAG</span></div>
                       </div>
                   </div>
                   <div className="space-y-10 text-sm text-slate-700 leading-relaxed">
                       
                       <section className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-md relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                           <div className="text-lg font-black text-slate-900 mb-2 flex items-center gap-3"><User size={18} className="text-indigo-500"/> <span>Personal Identity</span></div>
                           <div className="text-xs text-slate-500 mb-6 font-medium"><span>在此记录您的投资风格、风险偏好或常用指令。Agent 将在每次对话时默认参考这些设定。</span></div>
                           <textarea 
                               className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none shadow-inner"
                               placeholder="例如：我是一个稳健型价值投资者，倾向于看长线基本面。回答我问题时请多引用市盈率和财报数据，少谈技术面线图。请用幽默诙谐的语气回答我..."
                               value={userProfile}
                               onChange={(e) => {
                                   setUserProfile(e.target.value);
                                   if (userAccount?.email) localStorage.setItem(`fin_agent_profile_${userAccount.email}`, e.target.value);
                               }}
                           />
                       </section>

                       <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
                           <div className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Archive size={18} className="text-emerald-500"/></div> <span>Past Conversations</span></div>
                           <div className="text-xs text-slate-500 mb-6 font-medium"><span>每当您在工作台点击“归档并清空”按钮时，对话的核心摘要将保存于此，作为 AI 后续与您交流的底层记忆库。</span></div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {chatArchives.map(arch => (
                                   <div key={arch.id} className="p-5 bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-md rounded-2xl shadow-sm flex justify-between items-start group transition-all">
                                       <div className="w-[85%]">
                                           <div className="text-[10px] text-slate-400 font-mono font-bold mb-1.5"><span>{arch.date}</span></div>
                                           <div className="text-sm font-bold text-slate-700 leading-relaxed truncate" title={arch.title}><span>{arch.title}</span></div>
                                       </div>
                                       <button onClick={()=>deleteArchive(arch.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 p-2 rounded-lg"><Trash2 size={16}/></button>
                                   </div>
                               ))}
                               {chatArchives.length === 0 ? (
                                   <div className="col-span-full py-8 text-xs font-bold tracking-widest text-slate-400 uppercase border border-dashed border-slate-200 rounded-2xl text-center bg-white">
                                       <span>No archived conversations yet</span>
                                   </div>
                               ) : null}
                           </div>
                       </section>
                   </div>
               </div>
           </div>
        )}

        {/* VIEW 4: Weekly Report */}
        {activeNavIndex === 4 && (
           <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-10">
               <div className="max-w-4xl mx-auto">
                   <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-200">
                       <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm"><Calendar size={24} className="text-indigo-600" /></div>
                       <div>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase"><span>WEEKLY REPORT</span></h2>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1"><span>Intelligence & Strategy Summary</span></div>
                       </div>
                   </div>
                   <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
                       <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner min-h-[400px] flex flex-col relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                           <div className="flex justify-between items-center mb-6">
                               <div className="text-lg font-black text-slate-900 flex items-center gap-3">
                                   <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Sparkles size={18} className="text-indigo-500"/></div> 
                                   <span>Weekly Insights</span>
                               </div>
                               {!isGeneratingReport && !weeklyReport ? (
                                   <button onClick={handleGenerateReport} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2">
                                       <Activity size={16} /> <span>生成本周专属报告</span>
                                   </button>
                               ) : isGeneratingReport ? (
                                   <button onClick={handleStopGeneration} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2">
                                       <Square size={16} fill="currentColor" /> <span>暂停生成</span>
                                   </button>
                               ) : (
                                   <button onClick={handleGenerateReport} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2">
                                       <RefreshCw size={16} /> <span>重新生成</span>
                                   </button>
                               )}
                           </div>

                           {weeklyReport || isGeneratingReport ? (
                               <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm font-sans text-slate-700 leading-relaxed overflow-y-auto">
                                   <MessageFormatter content={weeklyReport} isStreaming={isGeneratingReport} />
                                   <div ref={reportEndRef} />
                               </div>
                           ) : (
                               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm"><FileText size={32} className="text-slate-400"/></div>
                                   <div className="text-sm font-medium"><span>点击按钮，Agent 将根据您的自选股和一周问答记忆，生成专属战术推演。</span></div>
                               </div>
                           )}
                       </section>
                   </div>
               </div>
           </div>
        )}

        {/* VIEW 5: Help */}
        {activeNavIndex === 5 && (
           <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-10">
               <div className="max-w-4xl mx-auto">
                   <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-200">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm"><Book size={24} className="text-blue-600" /></div>
                       <div>
                           <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase"><span>SYSTEM HELP</span></h2>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1"><span>Documentation & Controls</span></div>
                       </div>
                   </div>
                   <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
                       <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
                           <div className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Keyboard size={18} className="text-indigo-500"/></div> <span>UI Controls & Shortcuts</span></div>
                           <ul className="space-y-4">
                               <li className="flex items-center gap-4"><kbd className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold shadow-sm text-slate-600">ESC</kbd> <span className="font-medium">Close any modal, clear current selection, or return from Global Chat.</span></li>
                               <li className="flex items-center gap-4"><div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500"><LayoutDashboard size={14}/></div> <span className="font-medium"><b>Dashboard Icon (Top Left):</b> Click to reset the entire view and return to the main workspace.</span></li>
                           </ul>
                       </section>
                       
                       <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
                           <div className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100"><Sparkles size={18} className="text-amber-500"/></div> <span>Agent Capabilities</span></div>
                           <div className="font-medium mb-6"><span>The Fin-Agent supports <b>Zhipu GLM-5</b> and <b>DeepSeek V3/R1</b>.</span></div>
                           <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <li className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                   <div className="font-black text-slate-900 mb-2 flex items-center gap-2"><BrainCircuit size={14} className="text-indigo-500"/> <span>Deep Thinking</span></div>
                                   <div className="text-xs text-slate-500"><span>GLM-5 and R1 will automatically show their reasoning process before outputting the final answer. You can toggle this section!</span></div>
                               </li>
                               <li className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                   <div className="font-black text-slate-900 mb-2 flex items-center gap-2"><Activity size={14} className="text-rose-500"/> <span>Live Alerts</span></div>
                                   <div className="text-xs text-slate-500"><span>The system constantly scans your Watchlist every 10 seconds. Any price movement over 2% will trigger a real-time volatility alert.</span></div>
                               </li>
                               <li className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                   <div className="font-black text-slate-900 mb-2 flex items-center gap-2"><Maximize2 size={14} className="text-blue-500"/> <span>Deep Dive Chat</span></div>
                                   <div className="text-xs text-slate-500"><span>Click the expand icon in the stock chat to enter a full-screen, distraction-free analysis mode.</span></div>
                               </li>
                               <li className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                   <div className="font-black text-slate-900 mb-2 flex items-center gap-2"><Globe2 size={14} className="text-emerald-500"/> <span>Smart Reader</span></div>
                                   <div className="text-xs text-slate-500"><span>Click any news item in the terminal to instantly translate and summarize it using AI.</span></div>
                               </li>
                               <li className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                   <div className="font-black text-slate-900 mb-2 flex items-center gap-2"><Archive size={14} className="text-indigo-500"/> <span>Contextual AI Chat</span></div>
                                   <div className="text-xs text-slate-500"><span>在工作台点击任意持仓或机构数据，可立即唤醒悬浮框，实现指哪打哪的精准上下文追问。</span></div>
                               </li>
                               <li className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                   <div className="font-black text-slate-900 mb-2 flex items-center gap-2"><Calendar size={14} className="text-rose-500"/> <span>Weekly Report</span></div>
                                   <div className="text-xs text-slate-500"><span>在周报模块，Agent会自动汇总您本周所有的碎片记忆与自选股动态，生成专业复盘。</span></div>
                               </li>
                           </ul>
                       </section>
                   </div>
               </div>
           </div>
        )}

      </main>

      {/* --- 浮动提问框 --- */}
      {floatingPrompt ? (
          <div 
             className="fixed z-[5000] bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 w-80 animate-in zoom-in-95 duration-200"
             style={{ top: Math.min(floatingPrompt.y + 15, window.innerHeight - 150), left: Math.min(floatingPrompt.x + 15, window.innerWidth - 320) }}
             onClick={(e) => e.stopPropagation()}
          >
              <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-indigo-600"><Sparkles size={14}/> <span className="text-xs font-black uppercase"><span>Ask Agent</span></span></div>
                  <button onClick={() => setFloatingPrompt(null)} className="text-slate-400 hover:text-slate-700"><X size={14}/></button>
              </div>
              <div className="text-[10px] text-slate-500 mb-3 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                  <span>Context: </span><span className="text-slate-700 font-bold"><span>{floatingPrompt.contextText}</span></span>
              </div>
              <div className="flex gap-2 relative">
                  <input 
                      autoFocus
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="深入追问..."
                      value={floatingInput}
                      onChange={(e) => setFloatingInput(e.target.value)}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && floatingInput.trim()) {
                              handleStockChatSend(`${floatingPrompt.contextText}。用户追问：${floatingInput}`);
                              setFloatingPrompt(null);
                              setFloatingInput('');
                          }
                      }}
                  />
                  <button 
                      onClick={() => {
                          if (floatingInput.trim()) {
                              handleStockChatSend(`${floatingPrompt.contextText}。用户追问：${floatingInput}`);
                              setFloatingPrompt(null);
                              setFloatingInput('');
                          }
                      }} 
                      className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-500 transition-colors shadow-sm"
                  ><Send size={14}/></button>
              </div>
          </div>
      ) : null}

      {/* 🌟 抽离的身份验证弹窗 */}
      {renderAuthModal()}

      {/* --- Modals - Flow Chart Expanded --- */}
      {isFlowChartExpanded && stockDetail?.chart ? (
        <div className="fixed inset-0 z-[5000] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full h-full max-w-6xl max-h-[85vh] bg-white border border-slate-200 rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200"><BarChart3 size={24} className="text-orange-500" /></div>
                <div><h2 className="text-base font-black text-slate-900 uppercase tracking-widest"><span>{t.net_flow} (EXPANDED)</span></h2><div className="text-[11px] font-bold text-slate-500 font-mono mt-0.5"><span>{selectedTicker?.symbol} // {timeRange}</span></div></div>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 animate-pulse"><ZoomIn size={14}/> <span>{t.scroll_zoom}</span></div>
                <div className="flex gap-5 text-xs font-bold font-mono items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"/> <span>{t.flow_in}</span></div>
                  <div className="flex items-center gap-2 text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"/> <span>{t.flow_out}</span></div>
                  <div className="flex items-center gap-2 text-slate-600"><div className="w-5 h-1.5 rounded-full bg-slate-300"/> <span>{t.cumulative}</span></div>
                </div>
                <button onClick={() => setIsFlowChartExpanded(false)} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm text-slate-500"><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 p-8 bg-slate-50/50" onWheel={handleZoomWheel}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={zoomedChartData} margin={{top:20, right:40, left:20, bottom:20}} style={{ cursor: 'crosshair' }}>
                  <CartesianGrid stroke="#e2e8f0" vertical={true} strokeDasharray="4 4" />
                  <XAxis dataKey="normalizedTime" tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} minTickGap={50} tickFormatter={formatXAxis} dy={15} />
                  <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} tickFormatter={formatNumber} axisLine={false} tickLine={false} dx={-10} />
                  <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} tickFormatter={formatNumber} axisLine={false} tickLine={false} dx={10} />
                  <Tooltip cursor={{fill: 'rgba(99,102,241,0.05)'}} contentStyle={{backgroundColor:'#ffffff', border:'1px solid #e2e8f0', color:'#0f172a', fontSize:'13px', fontWeight: 'bold', borderRadius: '12px', padding: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'}} labelFormatter={formatXAxis} formatter={(val: number, name: string) => [formatNumber(val), name === 'netFlow' ? t.net_flow : t.cumulative]} />
                  <ReferenceLine y={0} yAxisId="left" stroke={'#94a3b8'} strokeWidth={2} />
                  <Bar yAxisId="left" dataKey="netFlow" barSize={12} radius={[3, 3, 0, 0]} isAnimationActive={false}>{zoomedChartData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={getFlowColor(entry.netFlow)} />))}</Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cumulativeFlow" stroke={'#64748b'} dot={false} strokeWidth={3} isAnimationActive={false} connectNulls={true} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modals - AI Tactical Reports */}
      {tacticalNews ? (
        <div className="fixed inset-0 z-[5000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-indigo-600"><Sparkles size={20} /></div>
                        <div className="font-black uppercase tracking-widest text-indigo-600"><span>{t.tactical_title}</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isStreaming && !tacticalDeep ? (
                            <button onClick={() => {
                                setTacticalDeep(true);
                                setIsStreaming(true);
                                const initText = tacticalReport + '\n\n---\n\n';
                                streamAIResponse({ 
                                    message: "请在此基础上进行更深入的博弈论推演和隐藏风险分析。", 
                                    history: [{ role: 'assistant', content: tacticalReport }], 
                                    context: { news: tacticalNews, symbol: selectedTicker?.symbol }, 
                                    mode: 'tactical_deep' 
                                }, (text) => setTacticalReport(text), () => setIsStreaming(false), initText);
                            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg hover:bg-indigo-500 hover:text-white transition-all shadow-sm">
                                <BrainCircuit size={12}/> <span>继续深度分析</span>
                            </button>
                        ) : null}
                        {isStreaming ? (
                            <button onClick={handleStopGeneration} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                <Square size={10} fill="currentColor"/> <span>暂停生成</span>
                            </button>
                        ) : null}
                        <button onClick={() => { handleStopGeneration(); setTacticalNews(null); }} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-sm text-slate-500"><X size={18}/></button>
                    </div>
                </div>
                <div className="p-10 font-sans text-sm text-slate-700 overflow-y-auto leading-relaxed bg-slate-50/30">
                    <MessageFormatter content={tacticalReport} isStreaming={isStreaming} />
                </div>
            </div>
        </div>
      ) : null}

      {/* Modals - Smart Reader */}
      {readingNews ? (
        <div className="fixed inset-0 z-[5000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200"><Globe2 size={20} /></div>
                        <div className="font-black uppercase tracking-widest"><span>{t.trans_title}</span></div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isStreaming && !translationDeep ? (
                            <button onClick={() => {
                                setTranslationDeep(true);
                                setIsStreaming(true);
                                const initText = translationText + '\n\n---\n\n';
                                streamAIResponse({ 
                                    message: "请跳出字面翻译，结合当前宏观经济环境，深度剖析该事件对行业的深远影响和潜在的投资机会。", 
                                    history: [{ role: 'assistant', content: translationText }], 
                                    context: { news: readingNews }, 
                                    mode: 'translation_deep' 
                                }, (text) => setTranslationText(text), () => setIsStreaming(false), initText);
                            }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold rounded-lg hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                <BrainCircuit size={12}/> <span>深度研报解析</span>
                            </button>
                        ) : null}
                        {isStreaming ? (
                            <button onClick={handleStopGeneration} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                <Square size={10} fill="currentColor"/> <span>暂停生成</span>
                            </button>
                        ) : null}
                        <button onClick={() => { handleStopGeneration(); setReadingNews(null); }} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-sm text-slate-500"><X size={18}/></button>
                    </div>
                </div>
                <div className="p-10 overflow-y-auto bg-slate-50/30">
                    <div className="mb-8 p-6 bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-2xl shadow-sm">
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest"><span>{t.trans_source}: </span><span className="text-slate-600">{readingNews.source}</span></div>
                        <div className="text-lg font-black text-slate-900 leading-snug"><span>{readingNews.title}</span></div>
                    </div>
                    <div className="font-sans text-[15px] text-slate-700 leading-8 tracking-wide">
                        <MessageFormatter content={translationText} isStreaming={isStreaming} />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-200 bg-white flex justify-end">
                    <a href={readingNews.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-widest uppercase rounded-xl transition shadow-lg hover:shadow-emerald-500/30">
                        <span>{t.trans_read_original}</span> <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
      ) : null}
      
      {/* --- Footer --- */}
      <footer className="h-8 bg-slate-800 border-t border-slate-900 px-5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest z-10 transition-colors">
          <div className="flex gap-8">
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"/> <span>{t.status}</span></div>
              <div className="text-slate-500"><span>{t.region}</span></div>
          </div>
          <div className="font-mono text-slate-300"><span>{currentTime || '--:--:--'}</span></div>
      </footer>
    </div>
  );
}