import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const brokerEnum = z.enum(["zerodha", "upstox", "angel_one"]);

/**
 * Simulated UPI top-up. Credits the broker's demo balance and writes a
 * ledger row so the funds history is auditable. No real money moves.
 */
export const addFunds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { broker: string; amount: number; method: string; upiId?: string }) =>
    z
      .object({
        broker: brokerEnum,
        amount: z.number().positive().max(5_000_000),
        method: z.enum(["upi_qr", "upi_id"]),
        upiId: z.string().trim().max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: account } = await supabase
      .from("broker_accounts")
      .select("id, balance_inr, is_connected")
      .eq("user_id", userId)
      .eq("broker", data.broker)
      .maybeSingle();

    if (!account) return { ok: false as const, message: "Set up this broker panel first." };
    if (!account.is_connected) return { ok: false as const, message: "Connect the broker before adding funds." };

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
      status: "success",
    });
    if (txError) return { ok: false as const, message: txError.message };

    const { error } = await supabase
      .from("broker_accounts")
      .update({ balance_inr: balance })
      .eq("id", account.id);
    if (error) return { ok: false as const, message: error.message };

    return { ok: true as const, balance, amount, upiRef };
  });

/** Funds ledger, newest first, optionally scoped to one broker. */
export const getFundHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("fund_transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return { transactions: data ?? [] };
  });

/** Which indices sit in the floating index bar. */
export const savePinnedIndices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { indices: string[] }) =>
    z.object({ indices: z.array(z.string().max(20)).max(8) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_preferences")
      .upsert(
        { user_id: context.userId, pinned_indices: data.indices, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const };
  });
