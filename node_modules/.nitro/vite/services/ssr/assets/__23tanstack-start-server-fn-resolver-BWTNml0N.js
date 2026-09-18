//#region \0%23tanstack-start-server-fn-resolver
var manifest = {
	"17245f5fe191173c270467ee9be68f0c34b87f85f2b71a0814649ffc5460424d": {
		functionName: "getListedQuote_createServerFn_handler",
		importer: () => import("./instruments.functions-BHnNG-ao.js")
	},
	"2994df9aec10d8b9d530ef423d178df090389e311a0939fa48060714fd408c41": {
		functionName: "getWorkspace_createServerFn_handler",
		importer: () => import("./trading.functions-DTFUZcTC.js")
	},
	"328cf9afeeec2d0968cc984014148dc301d63743c99ae531e47cb216b6e27a99": {
		functionName: "savePinnedIndices_createServerFn_handler",
		importer: () => import("./funds.functions-Quk6mtRO.js")
	},
	"3c6ff3ed6eb0e7e8c6ee3b2fe54366e7021028037093581d6d971dcb18fb9985": {
		functionName: "setupBrokerAccount_createServerFn_handler",
		importer: () => import("./trading.functions-DTFUZcTC.js")
	},
	"501e1e023065ed332a71c6bc58cadd003f3c588463d39afedc9122cd01b95fe1": {
		functionName: "getNews_createServerFn_handler",
		importer: () => import("./market.functions-CkaHDkQo.js")
	},
	"5c7924311a663fb6e413d782896aff9466a5fd36b00810f9e33ce861eefce2b1": {
		functionName: "placeOrder_createServerFn_handler",
		importer: () => import("./trading.functions-DTFUZcTC.js")
	},
	"60d5251e95a57bad598f0fe11aa04d9d7d7ba9457def2a69fa513d4ab654853c": {
		functionName: "getAdminOverview_createServerFn_handler",
		importer: () => import("./trading.functions-DTFUZcTC.js")
	},
	"7056c011ce4dfa43d515fbe7cf71e12f168e4df5051fb1efb4a67aa9255279f7": {
		functionName: "verifyBrokerPin_createServerFn_handler",
		importer: () => import("./trading.functions-DTFUZcTC.js")
	},
	"75d163c6f2fdd191ae0bf4cf511d38a8b81b24246b3260c45481a54bff3842cc": {
		functionName: "setBrokerConnection_createServerFn_handler",
		importer: () => import("./trading.functions-DTFUZcTC.js")
	},
	"920aac9b211d7f3f61459d7f58c7d76356e6ccef0ae6677363db36b3fa392c8c": {
		functionName: "getFundamentals_createServerFn_handler",
		importer: () => import("./market.functions-CkaHDkQo.js")
	},
	"a0ff6caa2ca9fb8bc59a7b61fd447c72026a4ec94dbddeb899f7a639ee93443d": {
		functionName: "getUniverseStats_createServerFn_handler",
		importer: () => import("./instruments.functions-BHnNG-ao.js")
	},
	"a20941986320f5004c3ecd7b28087c4fbce1a299098b970e6c99fdb6bd6dba33": {
		functionName: "getFundHistory_createServerFn_handler",
		importer: () => import("./funds.functions-Quk6mtRO.js")
	},
	"b5d791ef9fc79dea3f77964563a37fbc68ee0cf64a636c96a11a8334093ee057": {
		functionName: "getMarketQuotes_createServerFn_handler",
		importer: () => import("./quotes.functions-DQyr6SLC.js")
	},
	"cfec0ba8ea2612f579174c9493ccaa498c65872a5a540a69aef5c99134ec9fdc": {
		functionName: "searchListedStocks_createServerFn_handler",
		importer: () => import("./instruments.functions-BHnNG-ao.js")
	},
	"d71dbebeaf6cbb06579da82f15a383103d5164d5efe1515b56a2341591e196a0": {
		functionName: "toggleWatchlist_createServerFn_handler",
		importer: () => import("./trading.functions-DTFUZcTC.js")
	},
	"e58c90fafd1e3659c9805345d7bd09ddb73c1e00f7f997bbd4f78cd61c7aa028": {
		functionName: "addFunds_createServerFn_handler",
		importer: () => import("./funds.functions-Quk6mtRO.js")
	},
	"eb7e2159cff2f51019bc79b101130349a11b50ddf1c5a0676e0c1273c2610165": {
		functionName: "getCandles_createServerFn_handler",
		importer: () => import("./market.functions-CkaHDkQo.js")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
