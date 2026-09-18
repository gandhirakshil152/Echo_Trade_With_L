import { t as createServerFn } from "./createServerFn-CIHAFgYl.js";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.js";
import { t as requireSupabaseAuth } from "./auth-middleware-BpbeoxIM.js";
import { z } from "zod";
//#region src/lib/trading.functions.ts?tss-serverfn-split
var brokerEnum = z.enum([
	"zerodha",
	"upstox",
	"angel_one"
]);
var getWorkspace_createServerFn_handler = createServerRpc({
	id: "2994df9aec10d8b9d530ef423d178df090389e311a0939fa48060714fd408c41",
	name: "getWorkspace",
	filename: "src/lib/trading.functions.ts"
}, (opts) => getWorkspace.__executeServer(opts));
var getWorkspace = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getWorkspace_createServerFn_handler, async ({ context }) => {
	const { supabase, userId } = context;
	const [profile, brokers, orders, holdings, watchlist, roles, funds, prefs] = await Promise.all([
		supabase.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle(),
		supabase.from("broker_accounts").select("*").eq("user_id", userId).order("broker"),
		supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
		supabase.from("holdings").select("*").eq("user_id", userId).gt("quantity", 0),
		supabase.from("watchlist").select("*").eq("user_id", userId).order("created_at"),
		supabase.from("user_roles").select("role").eq("user_id", userId),
		supabase.from("fund_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
		supabase.from("user_preferences").select("pinned_indices").eq("user_id", userId).maybeSingle()
	]);
	return {
		profile: profile.data,
		brokers: brokers.data ?? [],
		orders: orders.data ?? [],
		holdings: holdings.data ?? [],
		watchlist: watchlist.data ?? [],
		fundTransactions: funds.data ?? [],
		pinnedIndices: prefs.data?.pinned_indices ?? [
			"NIFTY50",
			"SENSEX",
			"BANKNIFTY"
		],
		isAdmin: (roles.data ?? []).some((r) => r.role === "admin")
	};
});
var verifyBrokerPin_createServerFn_handler = createServerRpc({
	id: "7056c011ce4dfa43d515fbe7cf71e12f168e4df5051fb1efb4a67aa9255279f7",
	name: "verifyBrokerPin",
	filename: "src/lib/trading.functions.ts"
}, (opts) => verifyBrokerPin.__executeServer(opts));
var verifyBrokerPin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	pin: z.string().min(4).max(6)
}).parse(input)).handler(verifyBrokerPin_createServerFn_handler, async ({ data, context }) => {
	const { data: account } = await context.supabase.from("broker_accounts").select("id, pin, is_connected, client_code, balance_inr").eq("user_id", context.userId).eq("broker", data.broker).maybeSingle();
	if (!account) return {
		ok: false,
		message: "Broker account not linked."
	};
	if (account.pin !== data.pin) return {
		ok: false,
		message: "Incorrect broker PIN."
	};
	return {
		ok: true,
		accountId: account.id,
		clientCode: account.client_code,
		balance: Number(account.balance_inr)
	};
});
var placeOrder_createServerFn_handler = createServerRpc({
	id: "5c7924311a663fb6e413d782896aff9466a5fd36b00810f9e33ce861eefce2b1",
	name: "placeOrder",
	filename: "src/lib/trading.functions.ts"
}, (opts) => placeOrder.__executeServer(opts));
var placeOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	symbol: z.string().min(1).max(20),
	exchange: z.enum(["NSE", "BSE"]),
	side: z.enum(["buy", "sell"]),
	quantity: z.number().int().positive().max(1e5),
	price: z.number().positive(),
	orderType: z.enum(["market", "limit"]),
	pin: z.string().min(4).max(6),
	source: z.enum(["voice", "manual"])
}).parse(input)).handler(placeOrder_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: account } = await supabase.from("broker_accounts").select("id, pin, balance_inr, is_connected").eq("user_id", userId).eq("broker", data.broker).maybeSingle();
	if (!account) return {
		ok: false,
		message: "Broker account not linked."
	};
	if (!account.is_connected) return {
		ok: false,
		message: "Broker account is disconnected."
	};
	if (account.pin !== data.pin) return {
		ok: false,
		message: "Broker verification failed. Wrong PIN."
	};
	const symbol = data.symbol.toUpperCase();
	const total = +(data.quantity * data.price).toFixed(2);
	const balance = Number(account.balance_inr);
	const { data: holding } = await supabase.from("holdings").select("id, quantity, avg_price").eq("broker_account_id", account.id).eq("symbol", symbol).maybeSingle();
	if (data.side === "buy") {
		if (total > balance) return {
			ok: false,
			message: `Insufficient funds. Available ₹${balance.toLocaleString("en-IN")}.`
		};
		const newQty = (holding?.quantity ?? 0) + data.quantity;
		const newAvg = ((holding?.quantity ?? 0) * Number(holding?.avg_price ?? 0) + total) / newQty;
		if (holding) await supabase.from("holdings").update({
			quantity: newQty,
			avg_price: +newAvg.toFixed(2),
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", holding.id);
		else await supabase.from("holdings").insert({
			user_id: userId,
			broker_account_id: account.id,
			symbol,
			exchange: data.exchange,
			quantity: newQty,
			avg_price: +newAvg.toFixed(2)
		});
		await supabase.from("broker_accounts").update({ balance_inr: +(balance - total).toFixed(2) }).eq("id", account.id);
	} else {
		if (!holding || holding.quantity < data.quantity) return {
			ok: false,
			message: `Not enough ${symbol} in this broker account. Held: ${holding?.quantity ?? 0}.`
		};
		await supabase.from("holdings").update({
			quantity: holding.quantity - data.quantity,
			updated_at: (/* @__PURE__ */ new Date()).toISOString()
		}).eq("id", holding.id);
		await supabase.from("broker_accounts").update({ balance_inr: +(balance + total).toFixed(2) }).eq("id", account.id);
	}
	const { data: order, error } = await supabase.from("orders").insert({
		user_id: userId,
		broker_account_id: account.id,
		broker: data.broker,
		symbol,
		exchange: data.exchange,
		side: data.side,
		quantity: data.quantity,
		price: data.price,
		order_type: data.orderType,
		total_inr: total,
		source: data.source,
		status: "executed"
	}).select().maybeSingle();
	if (error) return {
		ok: false,
		message: error.message
	};
	return {
		ok: true,
		order,
		total
	};
});
var toggleWatchlist_createServerFn_handler = createServerRpc({
	id: "d71dbebeaf6cbb06579da82f15a383103d5164d5efe1515b56a2341591e196a0",
	name: "toggleWatchlist",
	filename: "src/lib/trading.functions.ts"
}, (opts) => toggleWatchlist.__executeServer(opts));
var toggleWatchlist = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	symbol: z.string().min(1).max(20),
	exchange: z.enum(["NSE", "BSE"]),
	remove: z.boolean()
}).parse(input)).handler(toggleWatchlist_createServerFn_handler, async ({ data, context }) => {
	const symbol = data.symbol.toUpperCase();
	if (data.remove) {
		await context.supabase.from("watchlist").delete().eq("user_id", context.userId).eq("symbol", symbol);
		return {
			ok: true,
			removed: true
		};
	}
	await context.supabase.from("watchlist").upsert({
		user_id: context.userId,
		symbol,
		exchange: data.exchange
	}, { onConflict: "user_id,symbol" });
	return {
		ok: true,
		removed: false
	};
});
var setBrokerConnection_createServerFn_handler = createServerRpc({
	id: "75d163c6f2fdd191ae0bf4cf511d38a8b81b24246b3260c45481a54bff3842cc",
	name: "setBrokerConnection",
	filename: "src/lib/trading.functions.ts"
}, (opts) => setBrokerConnection.__executeServer(opts));
var setBrokerConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	connected: z.boolean()
}).parse(input)).handler(setBrokerConnection_createServerFn_handler, async ({ data, context }) => {
	await context.supabase.from("broker_accounts").update({ is_connected: data.connected }).eq("user_id", context.userId).eq("broker", data.broker);
	return { ok: true };
});
var setupBrokerAccount_createServerFn_handler = createServerRpc({
	id: "3c6ff3ed6eb0e7e8c6ee3b2fe54366e7021028037093581d6d971dcb18fb9985",
	name: "setupBrokerAccount",
	filename: "src/lib/trading.functions.ts"
}, (opts) => setupBrokerAccount.__executeServer(opts));
var setupBrokerAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	accountName: z.string().trim().min(2).max(60),
	clientCode: z.string().trim().min(3).max(20),
	pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits")
}).parse(input)).handler(setupBrokerAccount_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: existing } = await supabase.from("broker_accounts").select("id, balance_inr").eq("user_id", userId).eq("broker", data.broker).maybeSingle();
	const clientCode = data.clientCode.toUpperCase();
	const randomBalance = Math.round((5e3 + Math.random() * 1995e3) * 100) / 100;
	if (existing) {
		const { error } = await supabase.from("broker_accounts").update({
			account_name: data.accountName,
			client_code: clientCode,
			pin: data.pin
		}).eq("id", existing.id);
		if (error) return {
			ok: false,
			message: error.message
		};
		return {
			ok: true,
			balance: Number(existing.balance_inr),
			created: false
		};
	}
	const { error } = await supabase.from("broker_accounts").insert({
		user_id: userId,
		broker: data.broker,
		account_name: data.accountName,
		client_code: clientCode,
		pin: data.pin,
		balance_inr: randomBalance,
		is_connected: true
	});
	if (error) return {
		ok: false,
		message: error.message
	};
	return {
		ok: true,
		balance: randomBalance,
		created: true
	};
});
var getAdminOverview_createServerFn_handler = createServerRpc({
	id: "60d5251e95a57bad598f0fe11aa04d9d7d7ba9457def2a69fa513d4ab654853c",
	name: "getAdminOverview",
	filename: "src/lib/trading.functions.ts"
}, (opts) => getAdminOverview.__executeServer(opts));
var getAdminOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getAdminOverview_createServerFn_handler, async ({ context }) => {
	const { supabase, userId } = context;
	const { data: isAdmin } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Forbidden: admin access required");
	const [profiles, brokers, orders, holdings] = await Promise.all([
		supabase.from("profiles").select("id, email, full_name, created_at").order("created_at"),
		supabase.from("broker_accounts").select("*"),
		supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300),
		supabase.from("holdings").select("*").gt("quantity", 0)
	]);
	return {
		users: (profiles.data ?? []).map((p) => {
			const userOrders = (orders.data ?? []).filter((o) => o.user_id === p.id);
			const userBrokers = (brokers.data ?? []).filter((b) => b.user_id === p.id);
			return {
				...p,
				brokers: userBrokers,
				funds: userBrokers.reduce((sum, b) => sum + Number(b.balance_inr), 0),
				orderCount: userOrders.length,
				turnover: userOrders.reduce((sum, o) => sum + Number(o.total_inr), 0),
				voiceOrders: userOrders.filter((o) => o.source === "voice").length,
				holdings: (holdings.data ?? []).filter((h) => h.user_id === p.id)
			};
		}),
		orders: orders.data ?? []
	};
});
//#endregion
export { getAdminOverview_createServerFn_handler, getWorkspace_createServerFn_handler, placeOrder_createServerFn_handler, setBrokerConnection_createServerFn_handler, setupBrokerAccount_createServerFn_handler, toggleWatchlist_createServerFn_handler, verifyBrokerPin_createServerFn_handler };
