/**
 * MCPDataLayer — Model Context Protocol (MCP) Compliant Data Abstraction
 * 
 * Implements a standardized interface for all external data sources following
 * the Model Context Protocol specification. Provides URI-based resource
 * addressing, rate limiting, circuit-breaker patterns, and extensible
 * adapter architecture for future data provider integration.
 * 
 * MCP Resource URI Scheme:
 *   market://quote/{symbol}        → Real-time quote data
 *   market://chart/{symbol}        → Historical chart data
 *   market://fundamentals/{symbol} → Company fundamentals
 *   research://news/{category}     → News feed by category
 *   research://search/{query}      → Asset search
 * 
 * @module FinancialServices/core — MCP Integration Layer
 */

// ============================================================
// MCP Type Definitions
// ============================================================

export interface MCPResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
}

export interface MCPToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}

export interface MCPToolResult {
    content: { type: 'text' | 'json'; text?: string; data?: any }[];
    isError?: boolean;
}

export interface MCPDataRequest {
    uri: string;
    params?: Record<string, string>;
}

export interface MCPDataResponse<T = any> {
    success: boolean;
    data: T | null;
    error?: string;
    source: string;
    timestamp: number;
    cached: boolean;
    latencyMs: number;
}

export interface QuoteData {
    symbol: string;
    name: string;
    price: number;
    prevClose: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: number;
    exchange: string;
}

export interface ChartDataPoint {
    time: string;
    price: number;
    volume: number;
    high?: number;
    low?: number;
    open?: number;
}

export interface FundamentalsData {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    marketCap: number;
    pe: number;
    eps: number;
    revenue: number;
    revenueGrowth: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    debtToEquity: number;
    roe: number;
    dividendYield: number;
    beta: number;
}

// ============================================================
// Rate Limiter
// ============================================================

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number = 30, windowMs: number = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    canProceed(key: string): boolean {
        const now = Date.now();
        const entry = this.limits.get(key);

        if (!entry || now - entry.windowStart > this.windowMs) {
            this.limits.set(key, { count: 1, windowStart: now });
            return true;
        }

        if (entry.count < this.maxRequests) {
            entry.count++;
            return true;
        }

        return false;
    }

    getRemainingRequests(key: string): number {
        const entry = this.limits.get(key);
        if (!entry || Date.now() - entry.windowStart > this.windowMs) return this.maxRequests;
        return Math.max(0, this.maxRequests - entry.count);
    }
}

// ============================================================
// Circuit Breaker
// ============================================================

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
    state: CircuitState;
    failures: number;
    lastFailure: number;
    lastSuccess: number;
}

class CircuitBreaker {
    private circuits: Map<string, CircuitBreakerState> = new Map();
    private threshold: number;
    private resetTimeout: number;

    constructor(failureThreshold: number = 5, resetTimeoutMs: number = 30000) {
        this.threshold = failureThreshold;
        this.resetTimeout = resetTimeoutMs;
    }

    canExecute(service: string): boolean {
        const circuit = this.circuits.get(service);
        if (!circuit) return true;

        if (circuit.state === 'OPEN') {
            // Check if enough time has passed to try again
            if (Date.now() - circuit.lastFailure > this.resetTimeout) {
                circuit.state = 'HALF_OPEN';
                return true;
            }
            return false;
        }

        return true;
    }

    recordSuccess(service: string): void {
        this.circuits.set(service, {
            state: 'CLOSED',
            failures: 0,
            lastFailure: 0,
            lastSuccess: Date.now()
        });
    }

    recordFailure(service: string): void {
        const circuit = this.circuits.get(service) || {
            state: 'CLOSED' as CircuitState,
            failures: 0,
            lastFailure: 0,
            lastSuccess: 0
        };

        circuit.failures++;
        circuit.lastFailure = Date.now();

        if (circuit.failures >= this.threshold) {
            circuit.state = 'OPEN';
        }

        this.circuits.set(service, circuit);
    }

    getState(service: string): CircuitState {
        return this.circuits.get(service)?.state || 'CLOSED';
    }
}

// ============================================================
// Simple In-Memory Cache
// ============================================================

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

class DataCache {
    private store: Map<string, CacheEntry<any>> = new Map();
    private defaultTTL: number;

    constructor(defaultTTLMs: number = 30000) {
        this.defaultTTL = defaultTTLMs;
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set<T>(key: string, data: T, ttl?: number): void {
        this.store.set(key, {
            data,
            expiry: Date.now() + (ttl || this.defaultTTL)
        });
    }

    clear(): void {
        this.store.clear();
    }
}

// ============================================================
// MCPDataLayer Class
// ============================================================

export class MCPDataLayer {
    private rateLimiter: RateLimiter;
    private circuitBreaker: CircuitBreaker;
    private cache: DataCache;

    constructor() {
        this.rateLimiter = new RateLimiter(60, 60000);       // 60 req/min
        this.circuitBreaker = new CircuitBreaker(5, 30000);   // 5 failures → 30s cooldown
        this.cache = new DataCache(15000);                     // 15s default TTL
    }

    /**
     * List all available MCP resources.
     * Follows MCP `resources/list` specification.
     */
    listResources(): MCPResource[] {
        return [
            {
                uri: 'market://quote/{symbol}',
                name: 'Real-time Quote',
                description: 'Current market quote including price, change, volume, and market cap',
                mimeType: 'application/json'
            },
            {
                uri: 'market://chart/{symbol}',
                name: 'Historical Chart',
                description: 'OHLCV chart data with configurable time range and interval',
                mimeType: 'application/json'
            },
            {
                uri: 'market://fundamentals/{symbol}',
                name: 'Company Fundamentals',
                description: 'Key financial metrics including margins, ratios, and growth rates',
                mimeType: 'application/json'
            },
            {
                uri: 'research://news/{category}',
                name: 'News Feed',
                description: 'Aggregated financial news by category (markets, tech, economics, politics)',
                mimeType: 'application/json'
            },
            {
                uri: 'research://search/{query}',
                name: 'Asset Search',
                description: 'Multi-source asset search across A-shares, US stocks, crypto, and commodities',
                mimeType: 'application/json'
            }
        ];
    }

    /**
     * List all available MCP tools.
     * Follows MCP `tools/list` specification.
     */
    listTools(): MCPToolDefinition[] {
        return [
            {
                name: 'get_quote',
                description: 'Get real-time market quote for a symbol',
                inputSchema: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string', description: 'Ticker symbol (e.g., AAPL, 000001.SS)' }
                    },
                    required: ['symbol']
                }
            },
            {
                name: 'get_chart',
                description: 'Get historical price chart data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string' },
                        range: { type: 'string', enum: ['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y'] },
                        interval: { type: 'string', enum: ['5m', '15m', '1h', '1d', '1wk'] }
                    },
                    required: ['symbol']
                }
            },
            {
                name: 'get_fundamentals',
                description: 'Get company fundamental financial data',
                inputSchema: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string' }
                    },
                    required: ['symbol']
                }
            },
            {
                name: 'search_assets',
                description: 'Search for stocks, ETFs, crypto, and commodities',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query (name, ticker, or Chinese pinyin)' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'get_news',
                description: 'Get latest financial news by category',
                inputSchema: {
                    type: 'object',
                    properties: {
                        category: { type: 'string', enum: ['markets', 'tech', 'economics', 'politics'] }
                    },
                    required: ['category']
                }
            }
        ];
    }

    /**
     * Execute an MCP tool call.
     * This is the primary interface for AI model → data source interaction.
     */
    async callTool(name: string, args: Record<string, any>): Promise<MCPToolResult> {
        try {
            switch (name) {
                case 'get_quote':
                    return await this.handleGetQuote(args.symbol);
                case 'get_chart':
                    return await this.handleGetChart(args.symbol, args.range, args.interval);
                case 'get_fundamentals':
                    return await this.handleGetFundamentals(args.symbol);
                case 'search_assets':
                    return await this.handleSearchAssets(args.query);
                case 'get_news':
                    return await this.handleGetNews(args.category);
                default:
                    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
            }
        } catch (error: any) {
            return { content: [{ type: 'text', text: `Tool error: ${error.message}` }], isError: true };
        }
    }

    /**
     * Read an MCP resource by URI.
     * Follows MCP `resources/read` specification.
     */
    async readResource(uri: string): Promise<MCPDataResponse> {
        const start = Date.now();

        // Parse URI: scheme://type/value
        const match = uri.match(/^(\w+):\/\/(\w+)\/(.+)$/);
        if (!match) {
            return { success: false, data: null, error: 'Invalid URI format', source: 'mcp', timestamp: Date.now(), cached: false, latencyMs: 0 };
        }

        const [, scheme, type, value] = match;
        const cacheKey = uri;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return { success: true, data: cached, source: `${scheme}://${type}`, timestamp: Date.now(), cached: true, latencyMs: Date.now() - start };
        }

        // Check rate limiter
        const rateLimitKey = `${scheme}://${type}`;
        if (!this.rateLimiter.canProceed(rateLimitKey)) {
            return { success: false, data: null, error: 'Rate limit exceeded', source: rateLimitKey, timestamp: Date.now(), cached: false, latencyMs: Date.now() - start };
        }

        // Check circuit breaker
        if (!this.circuitBreaker.canExecute(rateLimitKey)) {
            return { success: false, data: null, error: `Circuit open for ${rateLimitKey}`, source: rateLimitKey, timestamp: Date.now(), cached: false, latencyMs: Date.now() - start };
        }

        try {
            // Route to appropriate internal API
            let data: any = null;
            const internalBaseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

            if (scheme === 'market' && type === 'quote') {
                const res = await fetch(`${internalBaseUrl}/api/market-data?symbols=${value}`);
                data = await res.json();
            } else if (scheme === 'market' && type === 'chart') {
                const res = await fetch(`${internalBaseUrl}/api/stock-detail?symbol=${value}&range=1D`);
                data = await res.json();
            } else if (scheme === 'market' && type === 'fundamentals') {
                const res = await fetch(`${internalBaseUrl}/api/fundamentals?symbol=${value}`);
                data = await res.json();
            } else if (scheme === 'research' && type === 'news') {
                const res = await fetch(`${internalBaseUrl}/api/news?category=${value}`);
                data = await res.json();
            } else if (scheme === 'research' && type === 'search') {
                const res = await fetch(`${internalBaseUrl}/api/search?q=${value}`);
                data = await res.json();
            }

            this.circuitBreaker.recordSuccess(rateLimitKey);
            if (data) this.cache.set(cacheKey, data);

            return { success: true, data, source: rateLimitKey, timestamp: Date.now(), cached: false, latencyMs: Date.now() - start };
        } catch (error: any) {
            this.circuitBreaker.recordFailure(rateLimitKey);
            return { success: false, data: null, error: error.message, source: rateLimitKey, timestamp: Date.now(), cached: false, latencyMs: Date.now() - start };
        }
    }

    // ── Private Tool Handlers ──

    private async handleGetQuote(symbol: string): Promise<MCPToolResult> {
        const response = await this.readResource(`market://quote/${symbol}`);
        if (!response.success) {
            return { content: [{ type: 'text', text: response.error || 'Failed to fetch quote' }], isError: true };
        }
        return { content: [{ type: 'json', data: response.data }] };
    }

    private async handleGetChart(symbol: string, range?: string, _interval?: string): Promise<MCPToolResult> {
        const r = range || '1D';
        const response = await this.readResource(`market://chart/${symbol}?range=${r}`);
        if (!response.success) {
            return { content: [{ type: 'text', text: response.error || 'Failed to fetch chart' }], isError: true };
        }
        return { content: [{ type: 'json', data: response.data }] };
    }

    private async handleGetFundamentals(symbol: string): Promise<MCPToolResult> {
        const response = await this.readResource(`market://fundamentals/${symbol}`);
        if (!response.success) {
            return { content: [{ type: 'text', text: response.error || 'Failed to fetch fundamentals' }], isError: true };
        }
        return { content: [{ type: 'json', data: response.data }] };
    }

    private async handleSearchAssets(query: string): Promise<MCPToolResult> {
        const response = await this.readResource(`research://search/${query}`);
        if (!response.success) {
            return { content: [{ type: 'text', text: response.error || 'Search failed' }], isError: true };
        }
        return { content: [{ type: 'json', data: response.data }] };
    }

    private async handleGetNews(category: string): Promise<MCPToolResult> {
        const response = await this.readResource(`research://news/${category}`);
        if (!response.success) {
            return { content: [{ type: 'text', text: response.error || 'Failed to fetch news' }], isError: true };
        }
        return { content: [{ type: 'json', data: response.data }] };
    }

    /**
     * Get diagnostic information about the MCP layer's health.
     */
    getDiagnostics(): {
        rateLimits: { resource: string; remaining: number }[];
        circuitStates: { service: string; state: CircuitState }[];
    } {
        const resources = ['market://quote', 'market://chart', 'research://news', 'research://search'];
        return {
            rateLimits: resources.map(r => ({ resource: r, remaining: this.rateLimiter.getRemainingRequests(r) })),
            circuitStates: resources.map(r => ({ service: r, state: this.circuitBreaker.getState(r) }))
        };
    }
}
