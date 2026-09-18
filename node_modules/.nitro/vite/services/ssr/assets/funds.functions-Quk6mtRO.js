import { t as createServerFn } from "./createServerFn-CIHAFgYl.js";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.js";
import { t as requireSupabaseAuth } from "./auth-middleware-BpbeoxIM.js";
import { z } from "zod";
//#region src/lib/funds.functions.ts?tss-serverfn-split
var brokerEnum = z.enum([
	"zerodha",
	"upstox",
	"angel_one"
]);
/**
* Simulated UPI top-up. Credits the broker's demo balance and writes a
* ledger row so the funds history is auditable. No real money moves.
*/
var addFunds_createServerFn_handler = createServerRpc({
	id: "e58c90fafd1e3659c9805345d7bd09ddb73c1e00f7f997bbd4f78cd61c7aa028",
	name: "addFunds",
	filename: "src/lib/funds.functions.ts"
}, (opts) => addFunds.__executeServer(opts));
var addFunds = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	amount: z.number().positive().max(5e6),
	method: z.enum(["upi_qr", "upi_id"]),
	upiId: z.string().trim().max(60).optional()
}).parse(input)).handler(addFunds_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: account } = await supabase.from("broker_accounts").select("id, balance_inr, is_connected").eq("user_id", userId).eq("broker", data.broker).maybeSingle();
	if (!account) return {
		ok: false,
		message: "Set up this broker panel first."
	};
	if (!account.is_connected) return {
		ok: false,
		message: "Connect the broker before adding funds."
	};
	const amount = +data.amount.toFixed(2);
	const balance = +(Number(account.balance_inr) + amount).toFixed(2);
	const upiRef = `UPI${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;
	const { error: txError } = await supabase.from("fund_transactions").insert({
		user_id: userId,
		broker_account_id: account.id,
		broker: data.broker,
		amount_inr: amount,
		direction: "credit",
		method: data.method,
		upi_ref: upiRef,
		upi_id: data.upiId ?? null,
		status: "success"
	});
	if (txError) return {
		ok: false,
		message: txError.message
	};
	const { error } = await supabase.from("broker_accounts").update({ balance_inr: balance }).eq("id", account.id);
	if (error) return {
		ok: false,
		message: error.message
	};
	return {
		ok: true,
		balance,
		amount,
		upiRef
	};
});
var getFundHistory_createServerFn_handler = createServerRpc({
	id: "a20941986320f5004c3ecd7b28087c4fbce1a299098b970e6c99fdb6bd6dba33",
	name: "getFundHistory",
	filename: "src/lib/funds.functions.ts"
}, (opts) => getFundHistory.__executeServer(opts));
var getFundHistory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getFundHistory_createServerFn_handler, async ({ context }) => {
	const { data } = await context.supabase.from("fund_transactions").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100);
	return { transactions: data ?? [] };
});
var savePinnedIndices_createServerFn_handler = createServerRpc({
	id: "328cf9afeeec2d0968cc984014148dc301d63743c99ae531e47cb216b6e27a99",
	name: "savePinnedIndices",
	filename: "src/lib/funds.functions.ts"
}, (opts) => savePinnedIndices.__executeServer(opts));
var savePinnedIndices = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ indices: z.array(z.string().max(20)).max(8) }).parse(input)).handler(savePinnedIndices_createServerFn_handler, async ({ data, context }) => {
	const { error } = await context.supabase.from("user_preferences").upsert({
		user_id: context.userId,
		pinned_indices: data.indices,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}, { onConflict: "user_id" });
	if (error) return {
		ok: false,
		message: error.message
	};
	return { ok: true };
});
//#endregion
export { addFunds_createServerFn_handler, getFundHistory_createServerFn_handler, savePinnedIndices_createServerFn_handler };
