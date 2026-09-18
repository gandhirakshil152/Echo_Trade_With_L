import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const brokerEnum = z.enum(["zerodha", "upstox", "angel_one"]);

export const getWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, brokers, orders, holdings, watchlist, roles, funds, prefs] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name").eq("id", userId).maybeSingle(),
      supabase.from("broker_accounts").select("*").eq("user_id", userId).order("broker"),
      supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
      supabase.from("holdings").select("*").eq("user_id", userId).gt("quantity", 0),
      supabase.from("watchlist").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("fund_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("user_preferences").select("pinned_indices").eq("user_id", userId).maybeSingle(),
    ]);

    return {
      profile: profile.data,
      brokers: brokers.data ?? [],
      orders: orders.data ?? [],
      holdings: holdings.data ?? [],
      watchlist: watchlist.data ?? [],
      fundTransactions: funds.data ?? [],
      pinnedIndices: prefs.data?.pinned_indices ?? ["NIFTY50", "SENSEX", "BANKNIFTY"],
      isAdmin: (roles.data ?? []).some((r) => r.role === "admin"),
    };
  });


export const verifyBrokerPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { broker: string; pin: string }) =>
    z.object({ broker: brokerEnum, pin: z.string().min(4).max(6) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: account } = await context.supabase
      .from("broker_accounts")
      .select("id, pin, is_connected, client_code, balance_inr")
      .eq("user_id", context.userId)
      .eq("broker", data.broker)
      .maybeSingle();

    if (!account) return { ok: false as const, message: "Broker account not linked." };
    if (account.pin !== data.pin) return { ok: false as const, message: "Incorrect broker PIN." };
    return {
      ok: true as const,
      accountId: account.id,
      clientCode: account.client_code,
      balance: Number(account.balance_inr),
    };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      broker: string;
      symbol: string;
      exchange: string;
      side: string;
      quantity: number;
      price: number;
      orderType: string;
      pin: string;
      source: string;
    }) =>
      z
        .object({
          broker: brokerEnum,
          symbol: z.string().min(1).max(20),
          exchange: z.enum(["NSE", "BSE"]),
          side: z.enum(["buy", "sell"]),
          quantity: z.number().int().positive().max(100000),
          price: z.number().positive(),
          orderType: z.enum(["market", "limit"]),
          pin: z.string().min(4).max(6),
          source: z.enum(["voice", "manual"]),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: account } = await supabase
      .from("broker_accounts")
      .select("id, pin, balance_inr, is_connected")
      .eq("user_id", userId)
      .eq("broker", data.broker)
      .maybeSingle();

    if (!account) return { ok: false as const, message: "Broker account not linked." };
    if (!account.is_connected) return { ok: false as const, message: "Broker account is disconnected." };
    if (account.pin !== data.pin) return { ok: false as const, message: "Broker verification failed. Wrong PIN." };

    const symbol = data.symbol.toUpperCase();
    const total = +(data.quantity * data.price).toFixed(2);
    const balance = Number(account.balance_inr);

    const { data: holding } = await supabase
      .from("holdings")
      .select("id, quantity, avg_price")
      .eq("broker_account_id", account.id)
      .eq("symbol", symbol)
      .maybeSingle();

    if (data.side === "buy") {
      if (total > balance) {
        return { ok: false as const, message: `Insufficient funds. Available ₹${balance.toLocaleString("en-IN")}.` };
      }
      const newQty = (holding?.quantity ?? 0) + data.quantity;
      const newAvg =
        ((holding?.quantity ?? 0) * Number(holding?.avg_price ?? 0) + total) / newQty;
      if (holding) {
        await supabase
          .from("holdings")
          .update({ quantity: newQty, avg_price: +newAvg.toFixed(2), updated_at: new Date().toISOString() })
          .eq("id", holding.id);
      } else {
        await supabase.from("holdings").insert({
          user_id: userId,
          broker_account_id: account.id,
          symbol,
          exchange: data.exchange,
          quantity: newQty,
          avg_price: +newAvg.toFixed(2),
        });
      }
      await supabase
        .from("broker_accounts")
        .update({ balance_inr: +(balance - total).toFixed(2) })
        .eq("id", account.id);
    } else {
      if (!holding || holding.quantity < data.quantity) {
        return {
          ok: false as const,
          message: `Not enough ${symbol} in this broker account. Held: ${holding?.quantity ?? 0}.`,
        };
      }
      await supabase
        .from("holdings")
        .update({ quantity: holding.quantity - data.quantity, updated_at: new Date().toISOString() })
        .eq("id", holding.id);
      await supabase
        .from("broker_accounts")
        .update({ balance_inr: +(balance + total).toFixed(2) })
        .eq("id", account.id);
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
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
        status: "executed",
      })
      .select()
      .maybeSingle();

    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const, order, total };
  });

export const toggleWatchlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { symbol: string; exchange: string; remove: boolean }) =>
    z
      .object({ symbol: z.string().min(1).max(20), exchange: z.enum(["NSE", "BSE"]), remove: z.boolean() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const symbol = data.symbol.toUpperCase();
    if (data.remove) {
      await context.supabase.from("watchlist").delete().eq("user_id", context.userId).eq("symbol", symbol);
      return { ok: true as const, removed: true };
    }
    await context.supabase
      .from("watchlist")
      .upsert({ user_id: context.userId, symbol, exchange: data.exchange }, { onConflict: "user_id,symbol" });
    return { ok: true as const, removed: false };
  });

export const setBrokerConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { broker: string; connected: boolean }) =>
    z.object({ broker: brokerEnum, connected: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("broker_accounts")
      .update({ is_connected: data.connected })
      .eq("user_id", context.userId)
      .eq("broker", data.broker);
    return { ok: true as const };
  });

/** Set up (or update) one broker account: holder name, client ID, PIN. Funds are randomised. */
export const setupBrokerAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { broker: string; accountName: string; clientCode: string; pin: string }) =>
    z
      .object({
        broker: brokerEnum,
        accountName: z.string().trim().min(2).max(60),
        clientCode: z.string().trim().min(3).max(20),
        pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("broker_accounts")
      .select("id, balance_inr")
      .eq("user_id", userId)
      .eq("broker", data.broker)
      .maybeSingle();

    const clientCode = data.clientCode.toUpperCase();
    const randomBalance = Math.round((5000 + Math.random() * (2_000_000 - 5000)) * 100) / 100;

    if (existing) {
      const { error } = await supabase
        .from("broker_accounts")
        .update({ account_name: data.accountName, client_code: clientCode, pin: data.pin })
        .eq("id", existing.id);
      if (error) return { ok: false as const, message: error.message };
      return { ok: true as const, balance: Number(existing.balance_inr), created: false };
    }

    const { error } = await supabase.from("broker_accounts").insert({
      user_id: userId,
      broker: data.broker,
      account_name: data.accountName,
      client_code: clientCode,
      pin: data.pin,
      balance_inr: randomBalance,
      is_connected: true,
    });
    if (error) return { ok: false as const, message: error.message };
    return { ok: true as const, balance: randomBalance, created: true };
  });


/** Admin only: every user with their brokers, funds and trading activity. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin access required");

    const [profiles, brokers, orders, holdings] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, created_at").order("created_at"),
      supabase.from("broker_accounts").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("holdings").select("*").gt("quantity", 0),
    ]);

    const users = (profiles.data ?? []).map((p) => {
      const userOrders = (orders.data ?? []).filter((o) => o.user_id === p.id);
      const userBrokers = (brokers.data ?? []).filter((b) => b.user_id === p.id);
      return {
        ...p,
        brokers: userBrokers,
        funds: userBrokers.reduce((sum, b) => sum + Number(b.balance_inr), 0),
        orderCount: userOrders.length,
        turnover: userOrders.reduce((sum, o) => sum + Number(o.total_inr), 0),
        voiceOrders: userOrders.filter((o) => o.source === "voice").length,
        holdings: (holdings.data ?? []).filter((h) => h.user_id === p.id),
      };
    });

    return { users, orders: orders.data ?? [] };
  });
