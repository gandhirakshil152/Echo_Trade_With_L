/** Server-only market data helpers backed by free public feeds (Yahoo Finance India, Stooq). */
import { ALL_STOCKS, findStock } from "./stocks";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const SUFFIX: Record<string, string> = { NSE: ".NS", BSE: ".BO" };

export const INDEX_TICKER: Record<string, string> = {
  NIFTY50: "^NSEI",
  SENSEX: "^BSESN",
  BANKNIFTY: "^NSEBANK",
  NIFTYIT: "^CNXIT",
};

export interface Candle {
  t: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fundamentals {
  marketCap: number | null;
  pe: number | null;
  pb: number | null;
  eps: number | null;
  dividendYield: number | null;
  high52: number | null;
  low52: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  open: number | null;
  volume: number | null;
  avgVolume: number | null;
  bookValue: number | null;
  sector: string;
  currency: string;
}

export interface NewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
}

export function tickerFor(symbol: string): string {
  const up = symbol.toUpperCase();
  if (INDEX_TICKER[up]) return INDEX_TICKER[up]!;
  const meta = findStock(up);
  return `${up}${SUFFIX[meta?.exchange ?? "NSE"]}`;
}

export const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
};

async function getJson(url: string): Promise<any | null> {
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetch(url.replace("QUERYHOST", host), {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      /* next host */
    }
  }
  return null;
}

/** Synthetic candles so a chart always renders when the public feed is unavailable. */
function syntheticCandles(symbol: string, points: number, stepMs: number): Candle[] {
  const base = findStock(symbol)?.base ?? 1000;
  const out: Candle[] = [];
  let price = base * 0.94;
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const drift = (Math.sin(i / 7) + (Math.random() - 0.5)) * base * 0.006;
    const open = price;
    price = Math.max(base * 0.6, open + drift);
    const high = Math.max(open, price) * (1 + Math.random() * 0.004);
    const low = Math.min(open, price) * (1 - Math.random() * 0.004);
    const t = now - i * stepMs;
    out.push({
      t,
      time: new Date(t).toISOString(),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume: Math.round(200000 + Math.random() * 900000),
    });
  }
  return out;
}

export async function loadCandles(
  symbol: string,
  rangeKey: string,
): Promise<{ candles: Candle[]; live: boolean; prevClose: number | null }> {
  const cfg = RANGE_MAP[rangeKey] ?? RANGE_MAP["1M"]!;
  const primary = tickerFor(symbol);
  // BSE-only scrips resolve on the .BO ticker; try both listings.
  const attempts = primary.startsWith("^")
    ? [primary]
    : [primary, primary.endsWith(".NS") ? primary.replace(/\.NS$/, ".BO") : primary.replace(/\.BO$/, ".NS")];
  let result: any = null;
  for (const ticker of attempts) {
    const json = await getJson(
      `https://QUERYHOST.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${cfg.range}&interval=${cfg.interval}`,
    );
    const r = json?.chart?.result?.[0];
    if (r?.timestamp?.length) {
      result = r;
      break;
    }
  }
  const stamps: number[] = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0] ?? {};
  const candles: Candle[] = [];
  for (let i = 0; i < stamps.length; i++) {
    const close = q.close?.[i];
    if (typeof close !== "number") continue;
    const t = stamps[i]! * 1000;
    candles.push({
      t,
      time: new Date(t).toISOString(),
      open: +(q.open?.[i] ?? close).toFixed(2),
      high: +(q.high?.[i] ?? close).toFixed(2),
      low: +(q.low?.[i] ?? close).toFixed(2),
      close: +close.toFixed(2),
      volume: Math.round(q.volume?.[i] ?? 0),
    });
  }
  if (candles.length >= 5) {
    return {
      candles,
      live: true,
      prevClose: result?.meta?.chartPreviousClose ?? result?.meta?.previousClose ?? null,
    };
  }
  const stepMs = cfg.interval === "5m" ? 300000 : cfg.interval === "30m" ? 1800000 : cfg.interval === "1wk" ? 604800000 : 86400000;
  return { candles: syntheticCandles(symbol, 80, stepMs), live: false, prevClose: null };
}

export async function loadFundamentals(symbol: string): Promise<{ data: Fundamentals; live: boolean }> {
  const meta = findStock(symbol);
  const primary = tickerFor(symbol);
  // The legacy v7 quote API rejects anonymous callers, so derive live stats from
  // the open chart endpoint meta block plus the returned daily candles.
  const attempts = primary.startsWith("^")
    ? [primary]
    : [primary, primary.endsWith(".NS") ? primary.replace(/\.NS$/, ".BO") : primary.replace(/\.BO$/, ".NS")];
  let result: any = null;
  for (const ticker of attempts) {
    const json = await getJson(
      `https://QUERYHOST.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1y&interval=1d`,
    );
    const r = json?.chart?.result?.[0];
    if (r?.timestamp?.length) {
      result = r;
      break;
    }
  }
  const m = result?.meta;
  const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const volumes: number[] = (result?.indicators?.quote?.[0]?.volume ?? []).filter(
    (v: unknown): v is number => typeof v === "number" && v > 0,
  );
  const recent = volumes.slice(-60);
  const avgVolume = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : null;
  const opens: number[] = (result?.indicators?.quote?.[0]?.open ?? []).filter(
    (v: unknown): v is number => typeof v === "number" && v > 0,
  );
  const data: Fundamentals = {
    marketCap: null,
    pe: null,
    pb: null,
    eps: null,
    dividendYield: null,
    high52: num(m?.fiftyTwoWeekHigh),
    low52: num(m?.fiftyTwoWeekLow),
    dayHigh: num(m?.regularMarketDayHigh),
    dayLow: num(m?.regularMarketDayLow),
    open: opens.length ? +opens[opens.length - 1]!.toFixed(2) : null,
    volume: num(m?.regularMarketVolume),
    avgVolume,
    bookValue: null,
    sector: meta?.sector ?? "—",
    currency: m?.currency ?? "INR",
  };
  return { data, live: !!m };
}


const decodeEntities = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;[^&]*&gt;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

const tag = (block: string, name: string): string => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m?.[1] ? decodeEntities(m[1]) : "";
};

/**
 * Live headlines from the Google News India RSS feed — free, no key, and it
 * actually returns Indian market stories (the Yahoo search feed now answers
 * with an empty news array for anonymous callers).
 */
export async function loadNews(symbol?: string): Promise<NewsItem[]> {
  const name = symbol ? findStock(symbol)?.name ?? symbol : "";
  const query = symbol
    ? `${name} ${symbol} share price NSE`
    : "Indian stock market NSE BSE Sensex Nifty";
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`,
      { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml" } },
    );
    if (res.ok) {
      const xml = await res.text();
      const items: NewsItem[] = (xml.match(/<item>[\s\S]*?<\/item>/g) ?? [])
        .map((block) => {
          const pub = tag(block, "pubDate");
          const parsed = pub ? new Date(pub) : new Date();
          return {
            title: tag(block, "title"),
            link: tag(block, "link"),
            publisher: tag(block, "source") || "Google News",
            publishedAt: (Number.isNaN(parsed.getTime()) ? new Date() : parsed).toISOString(),
          };
        })
        .filter((n) => n.title && n.link);
      if (items.length) return items.slice(0, 12);
    }
  } catch {
    // fall through to the Yahoo search feed
  }

  const json = await getJson(
    `https://QUERYHOST.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      name || "Indian stock market",
    )}&newsCount=12&quotesCount=0`,
  );
  const items: NewsItem[] = (json?.news ?? [])
    .map((n: any) => ({
      title: String(n.title ?? ""),
      link: String(n.link ?? ""),
      publisher: String(n.publisher ?? "Market wire"),
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
    }))
    .filter((n: NewsItem) => n.title && n.link);
  return items.slice(0, 10);
}

export function marketMovers(): { symbols: string[] } {
  return { symbols: ALL_STOCKS.map((s) => s.symbol) };
}
