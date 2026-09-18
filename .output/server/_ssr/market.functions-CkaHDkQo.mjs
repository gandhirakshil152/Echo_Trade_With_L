import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { a as objectType, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market.functions-CkaHDkQo.js
var getCandles_createServerFn_handler = createServerRpc({
	id: "eb7e2159cff2f51019bc79b101130349a11b50ddf1c5a0676e0c1273c2610165",
	name: "getCandles",
	filename: "src/lib/market.functions.ts"
}, (opts) => getCandles.__executeServer(opts));
var getCandles = createServerFn({ method: "GET" }).inputValidator((input) => objectType({
	symbol: stringType().min(1).max(20),
	range: enumType([
		"1D",
		"1W",
		"1M",
		"6M",
		"1Y",
		"5Y"
	])
}).parse(input)).handler(getCandles_createServerFn_handler, async ({ data }) => {
	const { loadCandles } = await import("./market.server-D0d7uVjJ.mjs");
	return loadCandles(data.symbol.toUpperCase(), data.range);
});
var getFundamentals_createServerFn_handler = createServerRpc({
	id: "920aac9b211d7f3f61459d7f58c7d76356e6ccef0ae6677363db36b3fa392c8c",
	name: "getFundamentals",
	filename: "src/lib/market.functions.ts"
}, (opts) => getFundamentals.__executeServer(opts));
var getFundamentals = createServerFn({ method: "GET" }).inputValidator((input) => objectType({ symbol: stringType().min(1).max(20) }).parse(input)).handler(getFundamentals_createServerFn_handler, async ({ data }) => {
	const { loadFundamentals } = await import("./market.server-D0d7uVjJ.mjs");
	return loadFundamentals(data.symbol.toUpperCase());
});
var getNews_createServerFn_handler = createServerRpc({
	id: "501e1e023065ed332a71c6bc58cadd003f3c588463d39afedc9122cd01b95fe1",
	name: "getNews",
	filename: "src/lib/market.functions.ts"
}, (opts) => getNews.__executeServer(opts));
var getNews = createServerFn({ method: "GET" }).inputValidator((input) => objectType({ symbol: stringType().max(20).optional() }).parse(input ?? {})).handler(getNews_createServerFn_handler, async ({ data }) => {
	const { loadNews } = await import("./market.server-D0d7uVjJ.mjs");
	return { items: await loadNews(data.symbol ? data.symbol.toUpperCase() : void 0) };
});
//#endregion
export { getCandles_createServerFn_handler, getFundamentals_createServerFn_handler, getNews_createServerFn_handler };
