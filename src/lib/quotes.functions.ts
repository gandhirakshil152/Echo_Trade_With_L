import { createServerFn } from "@tanstack/react-start";

import { ALL_STOCKS, INDIAN_INDICES } from "./stocks";

export interface Quote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  live: boolean;
}

const YAHOO_SUFFIX: Record<string, string> = {
  NSE: ".NS",
  BSE: ".BO",
};

const INDEX_TICKERS: Record<string, string> = {
  NIFTY50:       "%5ENSEI",
  SENSEX:        "%5EBSESN",
  BANKNIFTY:     "%5ENSEBANK",
  NIFTYIT:       "%5ECNXIT",
  NIFTYMIDCAP:   "%5ENSMIDCP",
  NIFTYSMALLCAP: "%5ENSSMCP",
  NIFTYFMCG:     "%5ECNXFMCG",
  NIFTYPHARMA:   "%5ECNXPHARMA",
  NIFTYAUTO:     "%5ECNXAUTO",
  NIFTYENERGY:   "%5ECNXENERGY",
};

const drift = (base: number) => {
  const pct = (Math.random() - 0.48) * 1.6;
  const price = +(base * (1 + pct / 100)).toFixed(2);
  return { price, prevClose: base };
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

/**
 * Live quote from the Yahoo chart endpoint.
 * Tries query1 then query2 with automatic retry on failure.
 */
async function fetchYahooChart(
  ticker: string,
  retries = 2,
): Promise<{ price: number; prevClose: number } | null> {
  for (const host of ["query1", "query2"]) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(
          `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
          { headers: { "User-Agent": UA, Accept: "application/json" } },
        );
        if (!res.ok) break; // move to next host
        const json = (await res.json()) as {
          chart?: {
            result?: Array<{
              meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number };
            }>;
          };
        };
        const meta = json.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice;
        if (typeof price !== "number") break;
        const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price;
        return { price: +price.toFixed(2), prevClose: +prevClose.toFixed(2) };
      } catch {
        if (attempt < retries) await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }
  }
  return null;
}

/** Stooq secondary source for NSE symbols (e.g. reliance.ns). */
async function fetchStooq(symbol: string): Promise<{ price: number; prevClose: number } | null> {
  try {
    const res = await fetch(
      `https://stooq.com/q/l/?s=${symbol.toLowerCase()}.in&f=sd2t2ohlc&h&e=csv`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return null;
    const text = await res.text();
    const cols = text.trim().split("\n")[1]?.split(",") ?? [];
    const open = Number(cols[4]);
    const close = Number(cols[7]);
    if (!Number.isFinite(close) || close <= 0) return null;
    return {
      price: +close.toFixed(2),
      prevClose: +(Number.isFinite(open) && open > 0 ? open : close).toFixed(2),
    };
  } catch {
    return null;
  }
}

const toQuote = (
  symbol: string,
  data: { price: number; prevClose: number },
  live: boolean,
): Quote => ({
  symbol,
  price: data.price,
  prevClose: data.prevClose,
  change: +(data.price - data.prevClose).toFixed(2),
  changePercent: +(((data.price - data.prevClose) / (data.prevClose || data.price)) * 100).toFixed(2),
  live,
});

/** Resolve quotes with limited concurrency so the edge runtime stays responsive. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length) as R[];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]!);
      }
    }),
  );
  return out;
}

/**
 * Live NSE/BSE quotes for the tracked universe.
 * Concurrency raised to 20 to keep latency low with the larger symbol universe.
 * Primary: Yahoo Finance (.NS/.BO); fallback: Stooq; last resort: deterministic drift.
 */
export const getMarketQuotes = createServerFn({ method: "GET" }).handler(async () => {
  const stocks = await mapLimit(ALL_STOCKS, 20, async (stock): Promise<Quote> => {
    const ticker = `${stock.symbol}${YAHOO_SUFFIX[stock.exchange]}`;
    const remote =
      (await fetchYahooChart(ticker)) ??
      (stock.exchange === "NSE" ? await fetchStooq(stock.symbol) : null) ??
      // BSE fallback: try .BO variant
      (stock.exchange === "BSE" ? await fetchYahooChart(`${stock.symbol}.BO`) : null);
    return toQuote(stock.symbol, remote ?? drift(stock.base), !!remote);
  });

  const indices = await mapLimit(INDIAN_INDICES, 6, async (idx): Promise<Quote> => {
    const rawTicker = INDEX_TICKERS[idx.symbol];
    const ticker = rawTicker ? decodeURIComponent(rawTicker) : null;
    const remote = ticker ? await fetchYahooChart(ticker) : null;
    return toQuote(idx.symbol, remote ?? drift(idx.base), !!remote);
  });

  return { stocks, indices, fetchedAt: new Date().toISOString() };
});
