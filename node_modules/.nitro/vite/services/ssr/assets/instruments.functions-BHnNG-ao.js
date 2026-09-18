import { t as createServerFn } from "./createServerFn-CIHAFgYl.js";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.js";
import { z } from "zod";
//#region src/lib/instruments.functions.ts?tss-serverfn-split
var getUniverseStats_createServerFn_handler = createServerRpc({
	id: "a0ff6caa2ca9fb8bc59a7b61fd447c72026a4ec94dbddeb899f7a639ee93443d",
	name: "getUniverseStats",
	filename: "src/lib/instruments.functions.ts"
}, (opts) => getUniverseStats.__executeServer(opts));
var getUniverseStats = createServerFn({ method: "GET" }).handler(getUniverseStats_createServerFn_handler, async () => {
	const { universe } = await import("./instruments.server-BLWYFv13.js");
	const { list } = await universe();
	return {
		total: list.length,
		nse: list.filter((i) => i.exchange === "NSE").length,
		bse: list.filter((i) => i.exchange === "BSE").length
	};
});
var searchListedStocks_createServerFn_handler = createServerRpc({
	id: "cfec0ba8ea2612f579174c9493ccaa498c65872a5a540a69aef5c99134ec9fdc",
	name: "searchListedStocks",
	filename: "src/lib/instruments.functions.ts"
}, (opts) => searchListedStocks.__executeServer(opts));
var searchListedStocks = createServerFn({ method: "GET" }).inputValidator((input) => z.object({ query: z.string().min(1).max(40) }).parse(input)).handler(searchListedStocks_createServerFn_handler, async ({ data }) => {
	const { searchUniverse, livePrices } = await import("./instruments.server-BLWYFv13.js");
	const hits = await searchUniverse(data.query, 10);
	const quotes = await livePrices(hits.map((h) => ({
		symbol: h.symbol,
		exchange: h.exchange
	})));
	const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
	return { results: hits.map((h) => {
		const q = bySymbol.get(h.symbol);
		return {
			symbol: h.symbol,
			name: h.name,
			exchange: q?.exchange ?? h.exchange,
			sector: h.sector,
			price: q?.price ?? 0,
			changePercent: q?.changePercent ?? 0,
			live: !!q
		};
	}) };
});
var getListedQuote_createServerFn_handler = createServerRpc({
	id: "17245f5fe191173c270467ee9be68f0c34b87f85f2b71a0814649ffc5460424d",
	name: "getListedQuote",
	filename: "src/lib/instruments.functions.ts"
}, (opts) => getListedQuote.__executeServer(opts));
var getListedQuote = createServerFn({ method: "GET" }).inputValidator((input) => z.object({ symbol: z.string().min(1).max(24) }).parse(input)).handler(getListedQuote_createServerFn_handler, async ({ data }) => {
	const { resolveInstrument, livePrice } = await import("./instruments.server-BLWYFv13.js");
	const symbol = data.symbol.toUpperCase();
	const [meta, quote] = await Promise.all([resolveInstrument(symbol), livePrice(symbol)]);
	if (!quote) return null;
	return {
		symbol,
		name: meta?.name ?? symbol,
		exchange: quote.exchange,
		sector: meta?.sector ?? "Listed equity",
		price: quote.price,
		prevClose: quote.prevClose,
		change: quote.change,
		changePercent: quote.changePercent,
		live: quote.live
	};
});
//#endregion
export { getListedQuote_createServerFn_handler, getUniverseStats_createServerFn_handler, searchListedStocks_createServerFn_handler };
