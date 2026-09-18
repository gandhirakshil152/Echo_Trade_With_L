import { t as createServerFn } from "./createServerFn-CIHAFgYl.js";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.js";
import { r as INDIAN_INDICES, t as ALL_STOCKS } from "./stocks-BlNLqOub.js";
//#region src/lib/quotes.functions.ts?tss-serverfn-split
var YAHOO_SUFFIX = {
	NSE: ".NS",
	BSE: ".BO"
};
var INDEX_TICKERS = {
	NIFTY50: "%5ENSEI",
	SENSEX: "%5EBSESN",
	BANKNIFTY: "%5ENSEBANK",
	NIFTYIT: "%5ECNXIT"
};
var drift = (base) => {
	return {
		price: +(base * (1 + (Math.random() - .48) * 1.6 / 100)).toFixed(2),
		prevClose: base
	};
};
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
/**
* Live quote from the Yahoo chart endpoint. This is the primary source: the
* legacy batch quote API now returns 401 for anonymous callers, while the
* chart endpoint stays open and exposes regularMarketPrice + previousClose.
*/
async function fetchYahooChart(ticker) {
	for (const host of ["query1", "query2"]) try {
		const res = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`, { headers: {
			"User-Agent": UA,
			Accept: "application/json"
		} });
		if (!res.ok) continue;
		const meta = (await res.json()).chart?.result?.[0]?.meta;
		const price = meta?.regularMarketPrice;
		if (typeof price !== "number") continue;
		const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price;
		return {
			price: +price.toFixed(2),
			prevClose: +prevClose.toFixed(2)
		};
	} catch {}
	return null;
}
/** Stooq secondary source for NSE symbols (e.g. reliance.ns). */
async function fetchStooq(symbol) {
	try {
		const res = await fetch(`https://stooq.com/q/l/?s=${symbol.toLowerCase()}.in&f=sd2t2ohlc&h&e=csv`, { headers: { "User-Agent": UA } });
		if (!res.ok) return null;
		const cols = (await res.text()).trim().split("\n")[1]?.split(",") ?? [];
		const open = Number(cols[4]);
		const close = Number(cols[7]);
		if (!Number.isFinite(close) || close <= 0) return null;
		return {
			price: +close.toFixed(2),
			prevClose: +(Number.isFinite(open) && open > 0 ? open : close).toFixed(2)
		};
	} catch {
		return null;
	}
}
var toQuote = (symbol, data, live) => ({
	symbol,
	price: data.price,
	prevClose: data.prevClose,
	change: +(data.price - data.prevClose).toFixed(2),
	changePercent: +((data.price - data.prevClose) / (data.prevClose || data.price) * 100).toFixed(2),
	live
});
/**
* Live NSE/BSE quotes for the tracked universe. Yahoo Finance India feed is the
* primary source (.NS for NSE, .BO for BSE), with a per-symbol chart call and
* Stooq India as fallbacks, and a simulated tape as the last resort so the
* terminal always renders.
*/
/** Resolve quotes with limited concurrency so the edge runtime stays responsive. */
async function mapLimit(items, limit, fn) {
	const out = new Array(items.length);
	let cursor = 0;
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const i = cursor++;
			out[i] = await fn(items[i]);
		}
	}));
	return out;
}
var getMarketQuotes_createServerFn_handler = createServerRpc({
	id: "b5d791ef9fc79dea3f77964563a37fbc68ee0cf64a636c96a11a8334093ee057",
	name: "getMarketQuotes",
	filename: "src/lib/quotes.functions.ts"
}, (opts) => getMarketQuotes.__executeServer(opts));
var getMarketQuotes = createServerFn({ method: "GET" }).handler(getMarketQuotes_createServerFn_handler, async () => {
	return {
		stocks: await mapLimit(ALL_STOCKS, 8, async (stock) => {
			const remote = await fetchYahooChart(`${stock.symbol}${YAHOO_SUFFIX[stock.exchange]}`) ?? (stock.exchange === "NSE" ? await fetchStooq(stock.symbol) : null);
			return toQuote(stock.symbol, remote ?? drift(stock.base), !!remote);
		}),
		indices: await mapLimit(INDIAN_INDICES, 4, async (idx) => {
			const ticker = decodeURIComponent(INDEX_TICKERS[idx.symbol] ?? "");
			const remote = ticker ? await fetchYahooChart(ticker) : null;
			return toQuote(idx.symbol, remote ?? drift(idx.base), !!remote);
		}),
		fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
});
//#endregion
export { getMarketQuotes_createServerFn_handler };
