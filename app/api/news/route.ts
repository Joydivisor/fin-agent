import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import yahooFinance from 'yahoo-finance2';

const parser = new Parser({
    requestOptions: {
        follow: 5,
        timeout: 8000, 
    },
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
});

// --- 🌍 终极新闻源矩阵 (修复新浪宕机问题) ---
const SOURCE_MAP: Record<string, any[]> = {
  markets: [
    // 🔴 更换为极高稳定性的 RSSHub 镜像，并增加华尔街见闻
    { id: 'sina_roll', name: '新浪7x24', url: 'https://rsshub.rssforever.com/sina/finance/auto/10', lang: 'zh' },
    { id: 'wallstreetcn', name: '华尔街见闻', url: 'https://rsshub.rssforever.com/wallstreetcn/news/global', lang: 'zh' },
    { id: 'wsj_market', name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', lang: 'en' },
    { id: 'investing', name: 'Investing.com', url: 'https://cn.investing.com/rss/news.rss', lang: 'zh' }
  ],
  tech: [
    { id: '36kr', name: '36Kr', url: 'https://36kr.com/feed', lang: 'zh' },
    { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', lang: 'en' },
    { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', lang: 'en' }
  ],
  economics: [
    { id: 'caixin', name: '财新网', url: 'http://www.caixin.com/rss/finance.xml', lang: 'zh' },
    { id: 'cnbc_eco', name: 'CNBC Economy', url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html', lang: 'en' },
    { id: 'ft', name: 'Financial Times', url: 'https://www.ft.com/?format=rss', lang: 'en' }
  ],
  politics: [
    { id: 'wsj_world', name: 'WSJ World', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', lang: 'en' },
    { id: 'bbc', name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', lang: 'en' },
    { id: 'lianhe', name: '联合早报', url: 'https://www.zaobao.com.sg/rss/realtime/world', lang: 'zh' }
  ]
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || 'markets';
  
  console.log(`📰 [News Engine] Fetching abundant news for: ${category}`);

  let yahooQuery = 'finance';
  if (category === 'tech') yahooQuery = 'technology stocks';
  if (category === 'economics') yahooQuery = 'macro economy';
  if (category === 'politics') yahooQuery = 'geopolitics';

  let yahooNews: any[] = [];
  try {
    const result = await yahooFinance.search(yahooQuery, { newsCount: 8 }); 
    if (result.news) {
        yahooNews = result.news.map((item: any) => {
            const ts = item.providerPublishTime * 1000;
            return {
                id: item.uuid || Math.random().toString(),
                title: item.title,
                source: item.publisher || 'Yahoo',
                time: new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                timestamp: ts,
                link: item.link,
                sentiment: 'Neutral',
                tags: ['Yahoo']
            };
        });
    }
  } catch (e) { console.error("Yahoo Fetch Error (Ignored)"); }

  const targetSources = SOURCE_MAP[category] || SOURCE_MAP['markets'];
  
  const rssPromises = targetSources.map(async (source) => {
    try {
      const feed = await parser.parseURL(source.url);
      return feed.items.slice(0, 12).map(item => {
        let ts = Date.now(); 
        if (item.pubDate) {
            const parsedTs = new Date(item.pubDate).getTime();
            if (!isNaN(parsedTs)) ts = parsedTs;
        }
        return {
          id: item.guid || item.link || Math.random().toString(),
          title: item.title,
          source: source.name, 
          time: new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          timestamp: ts,
          link: item.link,
          sentiment: 'Neutral',
          tags: [source.lang === 'zh' ? 'CN' : 'Global']
        };
      });
    } catch (e) {
      console.warn(`⚠️ RSS Failed: ${source.name}`); 
      return [];
    }
  });

  const rssResults = await Promise.all(rssPromises);
  const rssNews = rssResults.flat();

  const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; 
  const currentTimestamp = Date.now();

  const allNews = [...yahooNews, ...rssNews]
    .filter(item => item.title && item.link) 
    .filter(item => (currentTimestamp - item.timestamp) < MAX_AGE_MS) 
    .filter((item, index, self) => index === self.findIndex((t) => (t.title === item.title)))
    .sort((a, b) => b.timestamp - a.timestamp);

  return NextResponse.json(allNews);
}