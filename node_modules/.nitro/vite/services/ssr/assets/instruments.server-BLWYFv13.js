//#region src/lib/instruments.server.ts
/**
* Full NSE + BSE listed-equity universe, loaded from the exchanges' own free
* public files and cached in memory:
*  - NSE: EQUITY_L.csv (every listed symbol, series EQ/BE/SM/ST)
*  - BSE: ListofScripData (every active equity scrip, with market cap + industry)
* Live prices come from the public Yahoo India chart feed (.NS / .BO tickers).
*/
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
var TTL = 216e5;
var cache = null;
var inflight = null;
/** Split a CSV line honouring quoted fields. */
function splitCsv(line) {
	const out = [];
	let cur = "";
	let quoted = false;
	for (const ch of line) if (ch === "\"") quoted = !quoted;
	else if (ch === "," && !quoted) {
		out.push(cur);
		cur = "";
	} else cur += ch;
	out.push(cur);
	return out.map((s) => s.trim());
}
async function fetchText(url, headers = {}) {
	try {
		const res = await fetch(url, { headers: {
			"User-Agent": UA,
			...headers
		} });
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}
async function loadNse() {
	const text = await fetchText("https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv") ?? await fetchText("https://archives.nseindia.com/content/equities/EQUITY_L.csv");
	if (!text) return [];
	const lines = text.split(/\r?\n/).slice(1);
	const out = [];
	for (const line of lines) {
		if (!line.trim()) continue;
		const cols = splitCsv(line);
		const symbol = (cols[0] ?? "").toUpperCase();
		const name = cols[1] ?? "";
		const series = (cols[2] ?? "").toUpperCase();
		if (!symbol || !name) continue;
		if (![
			"EQ",
			"BE",
			"BZ",
			"SM",
			"ST",
			"IV"
		].includes(series)) continue;
		out.push({
			symbol,
			name,
			exchange: "NSE",
			sector: "Listed equity",
			isin: cols[6] ?? ""
		});
	}
	return out;
}
async function loadBse() {
	const text = await fetchText("https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active", {
		Referer: "https://www.bseindia.com/",
		Accept: "application/json"
	});
	if (!text) return [];
	try {
		const rows = JSON.parse(text);
		const out = [];
		for (const r of rows) {
			const symbol = (r.scrip_id ?? "").trim().toUpperCase();
			const name = (r.Scrip_Name ?? "").trim();
			if (!symbol || !name) continue;
			out.push({
				symbol,
				name,
				exchange: "BSE",
				sector: (r.INDUSTRY ?? "").trim() || "Listed equity",
				isin: (r.ISIN_NUMBER ?? "").trim()
			});
		}
		return out;
	} catch {
		return [];
	}
}
async function build() {
	const [nse, bse] = await Promise.all([loadNse(), loadBse()]);
	const bySymbol = /* @__PURE__ */ new Map();
	for (const i of nse) if (!bySymbol.has(i.symbol)) bySymbol.set(i.symbol, i);
	for (const i of bse) if (!bySymbol.has(i.symbol)) bySymbol.set(i.symbol, i);
	const list = [...bySymbol.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
	return {
		at: Date.now(),
		list,
		bySymbol
	};
}
async function universe() {
	if (cache && Date.now() - cache.at < TTL && cache.list.length) return cache;
	if (!inflight) inflight = build().then((c) => {
		if (c.list.length) cache = c;
		return cache ?? c;
	}).finally(() => {
		inflight = null;
	});
	return inflight;
}
async function resolveInstrument(symbol) {
	return (await universe()).bySymbol.get(symbol.toUpperCase()) ?? null;
}
var norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
async function searchUniverse(query, limit = 12) {
	const q = norm(query);
	if (!q) return [];
	const { list } = await universe();
	const scored = [];
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
		if (v > 0) scored.push({
			i,
			v: v + (i.exchange === "NSE" ? 2 : 0)
		});
		if (scored.length > 4e3) break;
	}
	return scored.sort((a, b) => b.v - a.v || a.i.symbol.length - b.i.symbol.length).slice(0, limit).map((x) => x.i);
}
async function chartQuote(ticker) {
	for (const host of ["query1", "query2"]) try {
		const res = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`, { headers: { "User-Agent": UA } });
		if (!res.ok) continue;
		const meta = (await res.json()).chart?.result?.[0]?.meta;
		if (typeof meta?.regularMarketPrice !== "number") continue;
		const price = meta.regularMarketPrice;
		const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
		return {
			price: +price.toFixed(2),
			prevClose: +prevClose.toFixed(2)
		};
	} catch {}
	return null;
}
/** Live price for any listed symbol; tries the listing exchange first, then the other. */
async function livePrice(symbol, exchange) {
	const up = symbol.toUpperCase();
	const meta = await resolveInstrument(up);
	const order = (exchange ?? meta?.exchange ?? "NSE") === "NSE" ? ["NSE", "BSE"] : ["BSE", "NSE"];
	for (const ex of order) {
		const quote = await chartQuote(`${up}${ex === "NSE" ? ".NS" : ".BO"}`);
		if (quote) return {
			symbol: up,
			exchange: ex,
			price: quote.price,
			prevClose: quote.prevClose,
			change: +(quote.price - quote.prevClose).toFixed(2),
			changePercent: +((quote.price - quote.prevClose) / (quote.prevClose || quote.price) * 100).toFixed(2),
			live: true
		};
	}
	return null;
}
async function livePrices(items, concurrency = 6) {
	const out = [];
	let cursor = 0;
	const worker = async () => {
		while (cursor < items.length) {
			const item = items[cursor++];
			const q = await livePrice(item.symbol, item.exchange);
			if (q) out.push(q);
		}
	};
	await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
	return out;
}
//#endregion
export { livePrice, livePrices, resolveInstrument, searchUniverse, universe };
