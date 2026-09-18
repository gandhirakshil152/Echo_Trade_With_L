import { o as findStock } from "./stocks-ey59sCnf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market.server-BpfRgxYA.js
/** Server-only market data helpers backed by free public feeds (Yahoo Finance India, Stooq). */
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
var SUFFIX = {
	NSE: ".NS",
	BSE: ".BO"
};
var INDEX_TICKER = {
	NIFTY50: "^NSEI",
	SENSEX: "^BSESN",
	BANKNIFTY: "^NSEBANK",
	NIFTYIT: "^CNXIT"
};
function tickerFor(symbol) {
	const up = symbol.toUpperCase();
	if (INDEX_TICKER[up]) return INDEX_TICKER[up];
	return `${up}${SUFFIX[findStock(up)?.exchange ?? "NSE"]}`;
}
var RANGE_MAP = {
	"1D": {
		range: "1d",
		interval: "5m"
	},
	"1W": {
		range: "5d",
		interval: "30m"
	},
	"1M": {
		range: "1mo",
		interval: "1d"
	},
	"6M": {
		range: "6mo",
		interval: "1d"
	},
	"1Y": {
		range: "1y",
		interval: "1d"
	},
	"5Y": {
		range: "5y",
		interval: "1wk"
	}
};
async function getJson(url) {
	for (const host of ["query1", "query2"]) try {
		const res = await fetch(url.replace("QUERYHOST", host), { headers: {
			"User-Agent": UA,
			Accept: "application/json"
		} });
		if (!res.ok) continue;
		return await res.json();
	} catch {}
	return null;
}
/** Synthetic candles so a chart always renders when the public feed is unavailable. */
function syntheticCandles(symbol, points, stepMs) {
	const base = findStock(symbol)?.base ?? 1e3;
	const out = [];
	let price = base * .94;
	const now = Date.now();
	for (let i = points - 1; i >= 0; i--) {
		const drift = (Math.sin(i / 7) + (Math.random() - .5)) * base * .006;
		const open = price;
		price = Math.max(base * .6, open + drift);
		const high = Math.max(open, price) * (1 + Math.random() * .004);
		const low = Math.min(open, price) * (1 - Math.random() * .004);
		const t = now - i * stepMs;
		out.push({
			t,
			time: new Date(t).toISOString(),
			open: +open.toFixed(2),
			high: +high.toFixed(2),
			low: +low.toFixed(2),
			close: +price.toFixed(2),
			volume: Math.round(2e5 + Math.random() * 9e5)
		});
	}
	return out;
}
async function loadCandles(symbol, rangeKey) {
	const cfg = RANGE_MAP[rangeKey] ?? RANGE_MAP["1M"];
	const primary = tickerFor(symbol);
	const attempts = primary.startsWith("^") ? [primary] : [primary, primary.endsWith(".NS") ? primary.replace(/\.NS$/, ".BO") : primary.replace(/\.BO$/, ".NS")];
	let result = null;
	for (const ticker of attempts) {
		const r = (await getJson(`https://QUERYHOST.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${cfg.range}&interval=${cfg.interval}`))?.chart?.result?.[0];
		if (r?.timestamp?.length) {
			result = r;
			break;
		}
	}
	const stamps = result?.timestamp ?? [];
	const q = result?.indicators?.quote?.[0] ?? {};
	const candles = [];
	for (let i = 0; i < stamps.length; i++) {
		const close = q.close?.[i];
		if (typeof close !== "number") continue;
		const t = stamps[i] * 1e3;
		candles.push({
			t,
			time: new Date(t).toISOString(),
			open: +(q.open?.[i] ?? close).toFixed(2),
			high: +(q.high?.[i] ?? close).toFixed(2),
			low: +(q.low?.[i] ?? close).toFixed(2),
			close: +close.toFixed(2),
			volume: Math.round(q.volume?.[i] ?? 0)
		});
	}
	if (candles.length >= 5) return {
		candles,
		live: true,
		prevClose: result?.meta?.chartPreviousClose ?? result?.meta?.previousClose ?? null
	};
	return {
		candles: syntheticCandles(symbol, 80, cfg.interval === "5m" ? 3e5 : cfg.interval === "30m" ? 18e5 : cfg.interval === "1wk" ? 6048e5 : 864e5),
		live: false,
		prevClose: null
	};
}
async function loadFundamentals(symbol) {
	const meta = findStock(symbol);
	const primary = tickerFor(symbol);
	const attempts = primary.startsWith("^") ? [primary] : [primary, primary.endsWith(".NS") ? primary.replace(/\.NS$/, ".BO") : primary.replace(/\.BO$/, ".NS")];
	let result = null;
	for (const ticker of attempts) {
		const r = (await getJson(`https://QUERYHOST.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1y&interval=1d`))?.chart?.result?.[0];
		if (r?.timestamp?.length) {
			result = r;
			break;
		}
	}
	const m = result?.meta;
	const num = (v) => typeof v === "number" && Number.isFinite(v) ? v : null;
	const recent = (result?.indicators?.quote?.[0]?.volume ?? []).filter((v) => typeof v === "number" && v > 0).slice(-60);
	const avgVolume = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : null;
	const opens = (result?.indicators?.quote?.[0]?.open ?? []).filter((v) => typeof v === "number" && v > 0);
	return {
		data: {
			marketCap: null,
			pe: null,
			pb: null,
			eps: null,
			dividendYield: null,
			high52: num(m?.fiftyTwoWeekHigh),
			low52: num(m?.fiftyTwoWeekLow),
			dayHigh: num(m?.regularMarketDayHigh),
			dayLow: num(m?.regularMarketDayLow),
			open: opens.length ? +opens[opens.length - 1].toFixed(2) : null,
			volume: num(m?.regularMarketVolume),
			avgVolume,
			bookValue: null,
			sector: meta?.sector ?? "—",
			currency: m?.currency ?? "INR"
		},
		live: !!m
	};
}
var decodeEntities = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;[^&]*&gt;/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").trim();
var tag = (block, name) => {
	const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
	return m?.[1] ? decodeEntities(m[1]) : "";
};
/**
* Live headlines from the Google News India RSS feed — free, no key, and it
* actually returns Indian market stories (the Yahoo search feed now answers
* with an empty news array for anonymous callers).
*/
async function loadNews(symbol) {
	const name = symbol ? findStock(symbol)?.name ?? symbol : "";
	const query = symbol ? `${name} ${symbol} share price NSE` : "Indian stock market NSE BSE Sensex Nifty";
	try {
		const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`, { headers: {
			"User-Agent": UA,
			Accept: "application/rss+xml, application/xml"
		} });
		if (res.ok) {
			const items = ((await res.text()).match(/<item>[\s\S]*?<\/item>/g) ?? []).map((block) => {
				const pub = tag(block, "pubDate");
				const parsed = pub ? new Date(pub) : /* @__PURE__ */ new Date();
				return {
					title: tag(block, "title"),
					link: tag(block, "link"),
					publisher: tag(block, "source") || "Google News",
					publishedAt: (Number.isNaN(parsed.getTime()) ? /* @__PURE__ */ new Date() : parsed).toISOString()
				};
			}).filter((n) => n.title && n.link);
			if (items.length) return items.slice(0, 12);
		}
	} catch {}
	return ((await getJson(`https://QUERYHOST.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(name || "Indian stock market")}&newsCount=12&quotesCount=0`))?.news ?? []).map((n) => ({
		title: String(n.title ?? ""),
		link: String(n.link ?? ""),
		publisher: String(n.publisher ?? "Market wire"),
		publishedAt: n.providerPublishTime ? (/* @__PURE__ */ new Date(n.providerPublishTime * 1e3)).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
	})).filter((n) => n.title && n.link).slice(0, 10);
}
//#endregion
export { loadCandles, loadFundamentals, loadNews };
