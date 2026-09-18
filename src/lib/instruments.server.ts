/**
 * Full NSE + BSE listed-equity universe, loaded from the exchanges' own free
 * public files and cached in memory:
 *  - NSE: EQUITY_L.csv (every listed symbol, series EQ/BE/SM/ST)
 *  - BSE: ListofScripData (every active equity scrip, with market cap + industry)
 * Live prices come from the public Yahoo India chart feed (.NS / .BO tickers).
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export interface Instrument {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  isin: string;
}

interface Cache {
  at: number;
  list: Instrument[];
  bySymbol: Map<string, Instrument>;
}

const TTL = 6 * 60 * 60 * 1000; // exchange lists change at most daily
let cache: Cache | null = null;
let inflight: Promise<Cache> | null = null;

/** Split a CSV line honouring quoted fields. */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, ...headers } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function loadNse(): Promise<Instrument[]> {
  const text =
    (await fetchText("https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv")) ??
    (await fetchText("https://archives.nseindia.com/content/equities/EQUITY_L.csv"));
  if (!text) return [];
  const lines = text.split(/\r?\n/).slice(1);
  const out: Instrument[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = splitCsv(line);
    const symbol = (cols[0] ?? "").toUpperCase();
    const name = cols[1] ?? "";
    const series = (cols[2] ?? "").toUpperCase();
    if (!symbol || !name) continue;
    if (!["EQ", "BE", "BZ", "SM", "ST", "IV"].includes(series)) continue;
    out.push({ symbol, name, exchange: "NSE", sector: "Listed equity", isin: cols[6] ?? "" });
  }
  return out;
}

async function loadBse(): Promise<Instrument[]> {
  const text = await fetchText(
    "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active",
    { Referer: "https://www.bseindia.com/", Accept: "application/json" },
  );
  if (!text) return [];
  try {
    const rows = JSON.parse(text) as Array<{
      scrip_id?: string;
      Scrip_Name?: string;
      INDUSTRY?: string | null;
      ISIN_NUMBER?: string;
    }>;
    const out: Instrument[] = [];
    for (const r of rows) {
      const symbol = (r.scrip_id ?? "").trim().toUpperCase();
      const name = (r.Scrip_Name ?? "").trim();
      if (!symbol || !name) continue;
      out.push({
        symbol,
        name,
        exchange: "BSE",
        sector: (r.INDUSTRY ?? "").trim() || "Listed equity",
        isin: (r.ISIN_NUMBER ?? "").trim(),
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function build(): Promise<Cache> {
  const [nse, bse] = await Promise.all([loadNse(), loadBse()]);
  const bySymbol = new Map<string, Instrument>();
  // NSE takes precedence for dual-listed names; BSE-only scrips are added after.
  for (const i of nse) if (!bySymbol.has(i.symbol)) bySymbol.set(i.symbol, i);
  for (const i of bse) if (!bySymbol.has(i.symbol)) bySymbol.set(i.symbol, i);
  const list = [...bySymbol.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
  return { at: Date.now(), list, bySymbol };
}

export async function universe(): Promise<Cache> {
  if (cache && Date.now() - cache.at < TTL && cache.list.length) return cache;
  if (!inflight) {
    inflight = build()
      .then((c) => {
        if (c.list.length) cache = c;
        return cache ?? c;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function resolveInstrument(symbol: string): Promise<Instrument | null> {
  const u = await universe();
  return u.bySymbol.get(symbol.toUpperCase()) ?? null;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export async function searchUniverse(query: string, limit = 12): Promise<Instrument[]> {
  const q = norm(query);
  if (!q) return [];
  const { list } = await universe();
  const scored: Array<{ i: Instrument; v: number }> = [];
  for (const i of list) {
    const sym = i.symbol.toLowerCase();
    const name = norm(i.name);
    let v = 0;
    if (sym === q) v = 100;
    else if (sym.startsWith(q)) v = 92;
    else if (name.startsWith(q)) v = 86;
    else if (name.includes(` ${q}`)) v = 74;
    else if (name.includes(q)) v = 66;
    else if (sym.includes(q)) v = 58;
    else if (norm(i.sector).includes(q)) v = 30;
    if (v > 0) scored.push({ i, v: v + (i.exchange === "NSE" ? 2 : 0) });
    if (scored.length > 4000) break;
  }
  return scored
    .sort((a, b) => b.v - a.v || a.i.symbol.length - b.i.symbol.length)
    .slice(0, limit)
    .map((x) => x.i);
}

export interface LivePrice {
  symbol: string;
  exchange: "NSE" | "BSE";
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  live: boolean;
}

async function chartQuote(ticker: string): Promise<{ price: number; prevClose: number } | null> {
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
        { headers: { "User-Agent": UA } },
      );
      if (!res.ok) continue;
      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number };
          }>;
        };
      };
      const meta = json.chart?.result?.[0]?.meta;
      if (typeof meta?.regularMarketPrice !== "number") continue;
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
      return { price: +price.toFixed(2), prevClose: +prevClose.toFixed(2) };
    } catch {
      /* next host */
    }
  }
  return null;
}

/** Live price for any listed symbol; tries the listing exchange first, then the other. */
export async function livePrice(symbol: string, exchange?: "NSE" | "BSE"): Promise<LivePrice | null> {
  const up = symbol.toUpperCase();
  const meta = await resolveInstrument(up);
  const primary = exchange ?? meta?.exchange ?? "NSE";
  const order: Array<"NSE" | "BSE"> = primary === "NSE" ? ["NSE", "BSE"] : ["BSE", "NSE"];
  for (const ex of order) {
    const quote = await chartQuote(`${up}${ex === "NSE" ? ".NS" : ".BO"}`);
    if (quote) {
      return {
        symbol: up,
        exchange: ex,
        price: quote.price,
        prevClose: quote.prevClose,
        change: +(quote.price - quote.prevClose).toFixed(2),
        changePercent: +(((quote.price - quote.prevClose) / (quote.prevClose || quote.price)) * 100).toFixed(2),
        live: true,
      };
    }
  }
  return null;
}

export async function livePrices(
  items: Array<{ symbol: string; exchange?: "NSE" | "BSE" }>,
  concurrency = 6,
): Promise<LivePrice[]> {
  const out: LivePrice[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const item = items[cursor++]!;
      const q = await livePrice(item.symbol, item.exchange);
      if (q) out.push(q);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}
