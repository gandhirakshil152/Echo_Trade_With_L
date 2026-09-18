import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  ArrowDownToLine,
  BarChart3,
  Building2,
  LineChart,
  Newspaper,
  Plug,
  Star,
  StarOff,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AddFundsDialog } from "@/components/AddFundsDialog";
import { BrokerFilter, type BrokerFilterValue } from "@/components/BrokerFilter";
import { BrokerSetupDialog } from "@/components/BrokerSetupDialog";
import { IndexPanel } from "@/components/IndexPanel";
import { MarketSearch, type SearchQuote } from "@/components/MarketSearch";
import { OrderTicket, type OrderDraft } from "@/components/OrderTicket";
import { PriceChart, type ChartRange } from "@/components/PriceChart";
import { Splash } from "@/components/Splash";
import { Fundamentals, NewsFeed, Technicals } from "@/components/StockInsights";
import { TopBar } from "@/components/TopBar";
import { VoiceConsole, type VoiceLogEntry } from "@/components/VoiceConsole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useStockData } from "@/hooks/useStockData";
import { useVoiceCommands, type VoiceCommandResult } from "@/hooks/useVoiceCommands";
import { estimateCharges, totalChargesFor } from "@/lib/brokerage";
import { savePinnedIndices } from "@/lib/funds.functions";
import { getListedQuote, searchListedStocks } from "@/lib/instruments.functions";
import { BROKERS, brokerLabel, findStock, formatINR, type BrokerId } from "@/lib/stocks";
import { getWorkspace, setBrokerConnection, toggleWatchlist } from "@/lib/trading.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EchoTrade — Voice Command Trading for NSE & BSE" },
      {
        name: "description",
        content:
          "Speak your trades on EchoTrade: live NSE and BSE prices, charts, fundamentals, news and rupee funds across Zerodha, Upstox and Angel One — all controlled by voice.",
      },
      { property: "og:title", content: "EchoTrade — Voice Command Trading Terminal" },
      {
        property: "og:description",
        content: "Voice-first Indian trading terminal. Live charts, fundamentals, news, funds and three brokers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Terminal,
});

function Metric({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div className="panel min-w-0 px-3 py-3 sm:px-4">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p
        className={`num mt-1 truncate text-base font-bold sm:text-lg lg:text-xl ${tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Terminal() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { stocks, indices, priceOf } = useStockData();
  const { isListening, transcript, supported, startListening, stopListening, speak } = useVoiceCommands();

  const fetchWorkspace = useServerFn(getWorkspace);
  const { data: workspace } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => fetchWorkspace(),
    enabled: !!user,
  });

  const [tab, setTab] = useState("market");
  const [selected, setSelected] = useState("RELIANCE");
  const [range, setRange] = useState<ChartRange>("1M");
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [setupBroker, setSetupBroker] = useState<BrokerId | null>(null);
  const [fundsBroker, setFundsBroker] = useState<BrokerId | null>(null);
  const [brokerFilter, setBrokerFilter] = useState<BrokerFilterValue>("all");
  const [recent, setRecent] = useState<string[]>(["RELIANCE", "TCS", "INFY"]);
  const [log, setLog] = useState<VoiceLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedManual, setSelectedManual] = useState<SearchQuote | null>(null);

  const searchFn = useServerFn(searchListedStocks);
  const listedQuoteFn = useServerFn(getListedQuote);
  const { data: remoteHits, isFetching: searching } = useQuery({
    queryKey: ["listed-search", searchQuery],
    queryFn: () => searchFn({ data: { query: searchQuery } }),
    enabled: searchQuery.length >= 2,
    staleTime: 60_000,
  });
  const { data: listedQuote, isFetching: quoteLoading } = useQuery({
    queryKey: ["listed-quote", selected],
    queryFn: () => listedQuoteFn({ data: { symbol: selected } }),
    enabled: selected.length > 0 && !stocks.some((s) => s.symbol === selected),
    staleTime: 60_000,
  });

  const effectiveStocks = useMemo(() => {
    const base = stocks.slice();
    if (selectedManual && !base.some((s) => s.symbol === selectedManual.symbol)) {
      base.push({
        symbol: selectedManual.symbol,
        name: selectedManual.name,
        exchange: selectedManual.exchange as "NSE" | "BSE",
        sector: selectedManual.sector,
        price: selectedManual.price,
        prevClose: selectedManual.price * (1 - selectedManual.changePercent / 100),
        change: 0,
        changePercent: selectedManual.changePercent,
        live: !!selectedManual.live,
      });
    }
    if (!listedQuote) return base;
    const live: typeof stocks[number] = {
      symbol: listedQuote.symbol,
      name: listedQuote.name,
      exchange: listedQuote.exchange,
      sector: listedQuote.sector,
      price: listedQuote.price,
      prevClose: listedQuote.prevClose,
      change: listedQuote.change,
      changePercent: listedQuote.changePercent,
      live: listedQuote.live,
    };
    return [...base.filter((s) => s.symbol !== listedQuote.symbol), live];
  }, [stocks, listedQuote, selectedManual]);

  const brokers = workspace?.brokers ?? [];
  const configured = brokers.map((b) => b.broker);
  const totalFunds = brokers.reduce((s, b) => s + Number(b.balance_inr), 0);
  const watchSymbols = useMemo(() => new Set((workspace?.watchlist ?? []).map((w) => w.symbol)), [workspace]);
  const pinned = workspace?.pinnedIndices ?? ["NIFTY50", "SENSEX", "BANKNIFTY"];

  const accountIdsFor = (b: BrokerFilterValue) =>
    b === "all" ? null : new Set(brokers.filter((x) => x.broker === b).map((x) => x.id));

  const holdings = useMemo(() => {
    const ids = accountIdsFor(brokerFilter);
    return (workspace?.holdings ?? []).filter((h) => !ids || ids.has(h.broker_account_id));
  }, [workspace, brokerFilter, brokers]);

  const orders = useMemo(
    () => (workspace?.orders ?? []).filter((o) => brokerFilter === "all" || o.broker === brokerFilter),
    [workspace, brokerFilter],
  );

  const fundTransactions = useMemo(
    () => (workspace?.fundTransactions ?? []).filter((t) => brokerFilter === "all" || t.broker === brokerFilter),
    [workspace, brokerFilter],
  );

  /** Watchlist scoped to symbols the chosen broker has traded or holds. */
  const watchlist = useMemo(() => {
    const rows = workspace?.watchlist ?? [];
    if (brokerFilter === "all") return rows;
    const ids = accountIdsFor(brokerFilter);
    const brokerSymbols = new Set([
      ...(workspace?.holdings ?? []).filter((h) => ids?.has(h.broker_account_id)).map((h) => h.symbol),
      ...(workspace?.orders ?? []).filter((o) => o.broker === brokerFilter).map((o) => o.symbol),
    ]);
    return rows.filter((w) => brokerSymbols.has(w.symbol));
  }, [workspace, brokerFilter, brokers]);

  const invested = holdings.reduce((s, h) => s + Number(h.avg_price) * h.quantity, 0);
  const current = holdings.reduce((s, h) => s + priceOf(h.symbol) * h.quantity, 0);
  const pnl = +(current - invested).toFixed(2);
  const chargesPaid = totalChargesFor(orders.map((o) => ({ broker: o.broker, side: o.side, total_inr: o.total_inr })));
  const filteredFunds =
    brokerFilter === "all"
      ? totalFunds
      : Number(brokers.find((b) => b.broker === brokerFilter)?.balance_inr ?? 0);

  const pushLog = (heard: string, reply: string, ok: boolean) =>
    setLog((prev) => [{ id: crypto.randomUUID(), heard, reply, ok }, ...prev].slice(0, 30));

  const respond = (heard: string, reply: string, ok = true) => {
    pushLog(heard, reply, ok);
    speak(reply);
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["workspace"] });

  const pick = (value: string | SearchQuote) => {
    const quote = typeof value === "string" ? null : value;
    const symbol = typeof value === "string" ? value : value.symbol;
    setSelectedManual(quote);
    setSelected(symbol);
    setRecent((prev) => [symbol, ...prev.filter((p) => p !== symbol)].slice(0, 6));
    if (!stocks.some((s) => s.symbol === symbol)) {
      queryClient.prefetchQuery({ queryKey: ["listed-quote", symbol], queryFn: () => listedQuoteFn({ data: { symbol } }), staleTime: 60_000 });
    }
  };

  const openTicket = (
    side: "buy" | "sell",
    symbol: string,
    qty: number,
    opts: { limitPrice?: number; broker?: BrokerId; exchange?: "NSE" | "BSE"; source: "voice" | "manual" },
  ) => {
    const meta = findStock(symbol) ?? effectiveStocks.find((s) => s.symbol === symbol.toUpperCase());
    const exchange = opts.exchange ?? (meta?.exchange as "NSE" | "BSE") ?? "NSE";
    pick(symbol.toUpperCase());
    setDraft({
      symbol: symbol.toUpperCase(),
      exchange,
      side,
      quantity: Math.max(1, qty),
      price: opts.limitPrice ?? priceOf(symbol.toUpperCase()) ?? 0,
      orderType: opts.limitPrice ? "limit" : "market",
      source: opts.source,
      broker: opts.broker,
    });
    return true;
  };

  const handleCommand = async (r: VoiceCommandResult) => {
    const heard = r.command;
    switch (r.action) {
      case "buy":
      case "sell": {
        if (!r.symbol || !findStock(r.symbol)) {
          respond(heard, "I couldn't match that stock on NSE or BSE.", false);
          return;
        }
        const price = r.limitPrice ?? priceOf(r.symbol);
        let qty = r.quantity ?? 1;
        if (r.amountInr) qty = Math.max(1, Math.floor(r.amountInr / price));
        if (qty === -1) {
          const held = (workspace?.holdings ?? [])
            .filter((h) => h.symbol === r.symbol)
            .reduce((s, h) => s + h.quantity, 0);
          qty = Math.max(1, held);
        }
        openTicket(r.action, r.symbol, qty, {
          ...(r.limitPrice !== undefined ? { limitPrice: r.limitPrice } : {}),
          ...(r.broker ? { broker: r.broker } : {}),
          ...(r.exchange ? { exchange: r.exchange } : {}),
          source: "voice",
        });
        pushLog(heard, `${r.action} ${qty} ${r.symbol} → choose broker & verify`, true);
        return;
      }
      case "select_broker": {
        if (draft && r.broker) {
          setDraft({ ...draft, broker: r.broker });
          respond(heard, `${brokerLabel(r.broker)} selected. Enter your PIN to verify.`);
        } else {
          setTab("brokers");
          respond(heard, `${r.broker ? brokerLabel(r.broker) : "Broker"} accounts opened.`);
        }
        return;
      }
      case "filter_broker": {
        const next: BrokerFilterValue = r.clearFilter || !r.broker ? "all" : r.broker;
        setBrokerFilter(next);
        if (r.target) setTab(r.target === "funds" ? "funds" : r.target);
        respond(heard, `${next === "all" ? "All brokers" : brokerLabel(next)} ${r.target ?? "view"} shown.`);
        return;
      }
      case "search": {
        if (!r.symbol || !findStock(r.symbol)) {
          respond(heard, "No matching NSE or BSE symbol.", false);
          return;
        }
        pick(r.symbol);
        setTab("market");
        const q = stocks.find((s) => s.symbol === r.symbol);
        respond(
          heard,
          `${r.symbol} is trading at ${formatINR(priceOf(r.symbol))}, ${q && q.changePercent >= 0 ? "up" : "down"} ${Math.abs(q?.changePercent ?? 0).toFixed(2)} percent.`,
        );
        return;
      }
      case "chart": {
        if (r.symbol && findStock(r.symbol)) pick(r.symbol);
        setTab("analysis");
        respond(heard, `Chart open for ${r.symbol && findStock(r.symbol) ? r.symbol : selected}.`);
        return;
      }
      case "news": {
        if (r.symbol && findStock(r.symbol)) pick(r.symbol);
        setTab("news");
        respond(heard, "Latest headlines loaded.");
        return;
      }
      case "fundamentals":
      case "technicals": {
        if (r.symbol && findStock(r.symbol)) pick(r.symbol);
        setTab("analysis");
        respond(heard, `${r.action === "fundamentals" ? "Fundamentals" : "Technicals"} open.`);
        return;
      }
      case "add_funds": {
        const target = r.broker ?? (brokerFilter !== "all" ? brokerFilter : configured[0] as BrokerId | undefined);
        if (!target) {
          setTab("brokers");
          respond(heard, "Set up a broker panel first, then I can add funds.", false);
          return;
        }
        setFundsBroker(target);
        respond(heard, `Add funds to ${brokerLabel(target)}. Scan the QR or send a collect request.`);
        return;
      }
      case "add_watchlist":
      case "remove_watchlist": {
        if (!r.symbol || !findStock(r.symbol)) {
          respond(heard, "I need a valid NSE or BSE symbol.", false);
          return;
        }
        const meta = findStock(r.symbol)!;
        await toggleWatchlist({
          data: { symbol: meta.symbol, exchange: meta.exchange, remove: r.action === "remove_watchlist" },
        });
        refresh();
        setTab("watchlist");
        respond(heard, `${meta.symbol} ${r.action === "remove_watchlist" ? "removed from" : "added to"} watchlist.`);
        return;
      }
      case "portfolio":
        setTab("portfolio");
        respond(heard, `Portfolio open. Net P and L is ${formatINR(pnl, 0)}.`);
        return;
      case "watchlist":
        setTab("watchlist");
        respond(heard, "Watchlist open.");
        return;
      case "history":
        setTab("orders");
        respond(heard, `Order book open with ${orders.length} orders.`);
        return;
      case "brokers":
        setTab("brokers");
        respond(heard, "Broker accounts open.");
        return;
      case "funds": {
        setTab("funds");
        if (r.broker) {
          setBrokerFilter(r.broker);
          const b = brokers.find((x) => x.broker === r.broker);
          respond(heard, `${brokerLabel(r.broker)} has ${formatINR(Number(b?.balance_inr ?? 0), 0)} available.`);
        } else {
          respond(heard, `Total available funds are ${formatINR(totalFunds, 0)} across your brokers.`);
        }
        return;
      }
      case "gainers":
      case "losers": {
        const sorted = [...stocks].sort((a, b) =>
          r.action === "gainers" ? b.changePercent - a.changePercent : a.changePercent - b.changePercent,
        );
        const top = sorted.slice(0, 3);
        setTab("market");
        respond(
          heard,
          `Top ${r.action === "gainers" ? "gainers" : "losers"}: ` +
            top.map((s) => `${s.symbol} ${s.changePercent.toFixed(2)} percent`).join(", "),
        );
        return;
      }
      case "admin":
        if (workspace?.isAdmin) {
          respond(heard, "Opening admin panel.");
          navigate({ to: "/admin" });
        } else {
          respond(heard, "You don't have admin access.", false);
        }
        return;
      case "logout":
        respond(heard, "Signing out.");
        await signOut();
        return;
      case "cancel":
        setDraft(null);
        respond(heard, "Order cancelled.");
        return;
      case "confirm":
        respond(heard, draft ? "Verify your broker PIN to place the order." : "Nothing pending.", !!draft);
        return;
      case "pin":
        respond(heard, "For safety, please type the PIN in the order ticket instead of speaking it.", false);
        return;
      case "help":
        respond(
          heard,
          "Try: buy ten Reliance on Zerodha, invest fifty thousand in Infosys, open chart of TCS, news on Airtel, show Upstox portfolio, funds in Zerodha, add funds to Angel One, top gainers, or order history.",
        );
        return;
      default:
        respond(heard, "I didn't catch a trading command. Say help for examples.", false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-base text-muted-foreground">
        Booting EchoTrade terminal…
      </div>
    );
  }
  if (!user) return <Splash indices={indices} />;

  const selectedQuote = effectiveStocks.find((s) => s.symbol === selected);
  const remoteSearchHits = remoteHits?.results ?? [];

  return (
    <div className="min-h-screen pb-24">
      <TopBar
        email={workspace?.profile?.email ?? user.email}
        isAdmin={workspace?.isAdmin}
        onSignOut={signOut}
        funds={formatINR(totalFunds, 0)}
      />

      <main className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-4 sm:py-6">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <Metric label="Available funds" value={formatINR(filteredFunds, 0)} />
          <Metric label="Invested" value={formatINR(invested, 0)} />
          <Metric label="Net P&L" value={`${pnl >= 0 ? "+" : ""}${formatINR(pnl, 0)}`} tone={pnl >= 0 ? "bull" : "bear"} />
          <Metric label="Charges & brokerage" value={formatINR(chargesPaid, 0)} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <BrokerFilter value={brokerFilter} onChange={setBrokerFilter} available={configured} />
          <span className="text-xs text-muted-foreground sm:text-sm">
            Scope applies to portfolio, order book, funds and watchlist.
          </span>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-5">
          <div className="space-y-5">
            <VoiceConsole
              supported={supported}
              isListening={isListening}
              transcript={transcript}
              log={log}
              onToggle={() => (isListening ? stopListening() : startListening(handleCommand))}
            />

            {selectedQuote ? (
              <section className="panel p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display truncate text-lg font-bold sm:text-xl">{selectedQuote.symbol}</h2>
                    <p className="truncate text-sm text-muted-foreground">{selectedQuote.name}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {selectedQuote.exchange}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="num text-3xl font-bold sm:text-4xl">{formatINR(selectedQuote.price)}</span>
                  <span
                    className={`num text-base font-bold ${selectedQuote.changePercent >= 0 ? "text-bull" : "text-bear"}`}
                  >
                    {selectedQuote.changePercent >= 0 ? "+" : ""}
                    {selectedQuote.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="lg" onClick={() => openTicket("buy", selectedQuote.symbol, 1, { source: "manual" })}>
                    <TrendingUp className="size-4" /> Buy
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={() => openTicket("sell", selectedQuote.symbol, 1, { source: "manual" })}
                  >
                    <TrendingDown className="size-4" /> Sell
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setTab("analysis")}>
                    <LineChart className="size-4" /> Chart
                  </Button>
                  <Button variant="outline" onClick={() => setTab("news")}>
                    <Newspaper className="size-4" /> News
                  </Button>
                </div>
              </section>
            ) : null}
          </div>

          <Tabs value={tab} onValueChange={setTab} className="min-w-0">
            <TabsList className="no-scrollbar w-full justify-start overflow-x-auto lg:flex-wrap">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="analysis">Chart & analysis</TabsTrigger>
              <TabsTrigger value="news">News</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="orders">Order book</TabsTrigger>
              <TabsTrigger value="funds">Funds</TabsTrigger>
              <TabsTrigger value="brokers">Brokers</TabsTrigger>
            </TabsList>

            <TabsContent value="market" className="space-y-4 pt-4">
              <MarketSearch
                quotes={effectiveStocks}
                remote={remoteSearchHits}
                onSelect={pick}
                recent={recent}
                onQueryChange={setSearchQuery}
                loading={searching}
              />
              <section className="panel divide-y divide-border/50 overflow-hidden">
                {effectiveStocks.map((s) => (
                  <div
                    key={s.symbol}
                    className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-3 transition-colors hover:bg-surface-2/60 sm:flex sm:px-4"
                    onClick={() => pick(s.symbol)}
                  >
                    <div className="min-w-0 sm:flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="font-display truncate text-base font-bold">{s.symbol}</span>
                        <span className="shrink-0 rounded border border-border px-1 text-[10px] font-semibold tracking-wider text-muted-foreground">
                          {s.exchange}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground sm:text-sm">{s.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="num text-base font-semibold">{formatINR(s.price)}</div>
                      <div className={`num text-sm font-bold ${s.changePercent >= 0 ? "text-bull" : "text-bear"}`}>
                        {s.changePercent >= 0 ? "+" : ""}
                        {s.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1 sm:col-auto">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Toggle watchlist"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await toggleWatchlist({
                            data: {
                              symbol: s.symbol,
                              exchange: s.exchange as "NSE" | "BSE",
                              remove: watchSymbols.has(s.symbol),
                            },
                          });
                          refresh();
                        }}
                      >
                        {watchSymbols.has(s.symbol) ? (
                          <Star className="size-4 text-primary" />
                        ) : (
                          <StarOff className="size-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicket("buy", s.symbol, 1, { source: "manual" });
                        }}
                      >
                        Buy
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicket("sell", s.symbol, 1, { source: "manual" });
                        }}
                      >
                        Sell
                      </Button>
                    </div>
                  </div>
                ))}
              </section>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4 pt-4">
              <PriceChart symbol={selected} range={range} onRangeChange={setRange} />
              <section className="panel p-4">
                <h3 className="font-display flex items-center gap-2 text-base font-bold">
                  <BarChart3 className="size-4 text-primary" /> Fundamentals · {selected}
                </h3>
                <div className="mt-3">
                  <Fundamentals symbol={selected} />
                </div>
              </section>
              <section className="panel p-4">
                <h3 className="font-display flex items-center gap-2 text-base font-bold">
                  <Activity className="size-4 text-primary" /> Technicals · {selected}
                </h3>
                <div className="mt-3">
                  <Technicals symbol={selected} />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="news" className="space-y-4 pt-4">
              <section className="panel p-4">
                <h3 className="font-display text-base font-bold">Headlines · {selected}</h3>
                <div className="mt-3">
                  <NewsFeed symbol={selected} />
                </div>
              </section>
              <section className="panel p-4">
                <h3 className="font-display text-base font-bold">Market wire</h3>
                <div className="mt-3">
                  <NewsFeed />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="watchlist" className="pt-4">
              <section className="panel divide-y divide-border/50">
                {watchlist.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    Nothing here. Say “add Titan to watchlist”, or widen the broker filter.
                  </p>
                ) : (
                  watchlist.map((w) => {
                    const q = stocks.find((s) => s.symbol === w.symbol);
                    return (
                      <div key={w.id} className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => pick(w.symbol)}>
                          <span className="font-display truncate text-base font-bold">{w.symbol}</span>
                          <p className="truncate text-xs text-muted-foreground sm:text-sm">{q?.name ?? w.exchange}</p>
                        </button>
                        <div className="num shrink-0 text-sm font-semibold sm:text-base">{formatINR(q?.price ?? 0)}</div>
                        <div className={`num w-16 shrink-0 text-right text-xs font-bold sm:w-20 sm:text-sm ${(q?.changePercent ?? 0) >= 0 ? "text-bull" : "text-bear"}`}>
                          {(q?.changePercent ?? 0) >= 0 ? "+" : ""}
                          {(q?.changePercent ?? 0).toFixed(2)}%
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Remove from watchlist"
                          onClick={async () => {
                            await toggleWatchlist({
                              data: { symbol: w.symbol, exchange: w.exchange as "NSE" | "BSE", remove: true },
                            });
                            refresh();
                          }}
                        >
                          <StarOff className="size-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </section>
            </TabsContent>

            <TabsContent value="portfolio" className="pt-4">
              <section className="panel divide-y divide-border/50">
                {holdings.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">
                    No holdings for this broker scope. Place your first order.
                  </p>
                ) : (
                  holdings.map((h) => {
                    const ltp = priceOf(h.symbol);
                    const rowPnl = (ltp - Number(h.avg_price)) * h.quantity;
                    const brokerRow = brokers.find((b) => b.id === h.broker_account_id);
                    return (
                      <div key={h.id} className="flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => pick(h.symbol)}>
                          <span className="font-display truncate text-base font-bold">{h.symbol}</span>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {h.quantity} qty · avg {formatINR(Number(h.avg_price))} ·{" "}
                            {brokerRow ? brokerLabel(brokerRow.broker) : "—"}
                          </p>
                        </button>
                        <div className="shrink-0 text-right">
                          <div className="num text-sm font-semibold sm:text-base">{formatINR(ltp * h.quantity)}</div>
                          <div className={`num text-xs font-bold sm:text-sm ${rowPnl >= 0 ? "text-bull" : "text-bear"}`}>
                            {rowPnl >= 0 ? "+" : ""}
                            {formatINR(rowPnl)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openTicket("sell", h.symbol, h.quantity, { source: "manual" })}
                        >
                          Exit
                        </Button>
                      </div>
                    );
                  })
                )}
              </section>
            </TabsContent>

            <TabsContent value="orders" className="pt-4">
              <section className="panel divide-y divide-border/50">
                {orders.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No orders in this broker scope.</p>
                ) : (
                  orders.map((o) => {
                    const charges = estimateCharges(o.broker, o.side === "sell" ? "sell" : "buy", Number(o.total_inr));
                    return (
                      <div key={o.id} className="flex items-start gap-2 px-3 py-3 sm:items-center sm:gap-3 sm:px-4">
                        <Badge variant={o.side === "buy" ? "default" : "destructive"} className="shrink-0">
                          {o.side.toUpperCase()}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <span className="font-display truncate text-base font-bold">{o.symbol}</span>
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {o.quantity} @ {formatINR(Number(o.price))} · {brokerLabel(o.broker)} · {o.exchange} ·{" "}
                            {o.source === "voice" ? "voice" : "manual"} · charges {formatINR(charges.total)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="num text-sm font-semibold sm:text-base">{formatINR(Number(o.total_inr))}</div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {o.status}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </TabsContent>

            <TabsContent value="funds" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {BROKERS.filter((b) => brokerFilter === "all" || brokerFilter === b.id).map((b) => {
                  const row = brokers.find((x) => x.broker === b.id);
                  return (
                    <section key={b.id} className="panel p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display min-w-0 flex-1 truncate text-base font-bold">{b.label}</h3>
                        <Wallet className="size-4 shrink-0 text-primary" />
                      </div>
                      <p className="num mt-2 truncate text-xl font-bold text-primary sm:text-2xl">
                        {row ? formatINR(Number(row.balance_inr), 0) : "—"}
                      </p>
                      <Button
                        className="mt-3 w-full"
                        disabled={!row}
                        onClick={() => setFundsBroker(b.id)}
                      >
                        <ArrowDownToLine className="size-4" /> Add funds
                      </Button>
                    </section>
                  );
                })}
              </div>

              <section className="panel divide-y divide-border/50">
                <p className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Funds history
                </p>
                {fundTransactions.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No fund transactions yet.</p>
                ) : (
                  fundTransactions.map((t) => (
                    <div key={t.id} className="flex items-start gap-2 px-3 py-3 sm:items-center sm:gap-3 sm:px-4">
                      <Badge variant={t.direction === "credit" ? "default" : "destructive"} className="shrink-0">
                        {t.direction.toUpperCase()}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="font-display truncate text-base font-bold">{brokerLabel(t.broker)}</p>
                        <p className="num break-words text-[11px] text-muted-foreground sm:text-xs">
                          {t.method === "upi_qr" ? "UPI QR" : "UPI collect"} · {t.upi_ref} ·{" "}
                          {new Date(t.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="num shrink-0 text-sm font-semibold text-bull sm:text-base">
                        +{formatINR(Number(t.amount_inr), 0)}
                      </div>
                    </div>
                  ))
                )}
              </section>
            </TabsContent>

            <TabsContent value="brokers" className="space-y-4 pt-4">
              {brokers.length < BROKERS.length ? (
                <p className="panel p-4 text-sm text-muted-foreground">
                  Set up each broker panel first — holder name, client ID and PIN. Opening funds are allotted randomly
                  between {formatINR(5000, 0)} and {formatINR(2000000, 0)}.
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BROKERS.map((b) => {
                  const row = brokers.find((x) => x.broker === b.id);
                  return (
                    <section key={b.id} className="panel p-4 sm:p-5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display min-w-0 flex-1 truncate text-lg font-bold">{b.label}</h3>
                        <Badge variant={row ? "outline" : "destructive"} className="shrink-0">
                          {row ? b.tag : "setup needed"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{b.blurb}</p>

                      {row ? (
                        <>
                          <div className="num mt-4 truncate text-xl font-bold text-primary sm:text-2xl">
                            {formatINR(Number(row.balance_inr), 0)}
                          </div>
                          <p className="mt-1 break-words text-sm text-muted-foreground">
                            {row.account_name || "—"} · <span className="num">{row.client_code}</span>
                          </p>
                          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface-2/50 px-3 py-2">
                            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Plug className="size-4" /> {row.is_connected ? "Connected" : "Disconnected"}
                            </span>
                            <Switch
                              checked={row.is_connected}
                              onCheckedChange={async (checked) => {
                                await setBrokerConnection({ data: { broker: b.id, connected: checked } });
                                refresh();
                                toast.success(`${b.label} ${checked ? "connected" : "disconnected"}`);
                              }}
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Activity className="size-4" />
                              {(workspace?.orders ?? []).filter((o) => o.broker === b.id).length} orders
                            </span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setFundsBroker(b.id)}>
                                Add funds
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setSetupBroker(b.id)}>
                                Edit
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-muted-foreground">
                            No panel yet. Add holder name, client ID and PIN to activate this broker.
                          </p>
                          <Button className="w-full" onClick={() => setSetupBroker(b.id)}>
                            <Building2 className="size-4" /> Set up {b.label}
                          </Button>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <IndexPanel
        indices={indices}
        pinned={pinned}
        onPinnedChange={async (next) => {
          queryClient.setQueryData(["workspace"], (prev: typeof workspace) =>
            prev ? { ...prev, pinnedIndices: next } : prev,
          );
          await savePinnedIndices({ data: { indices: next } });
          refresh();
        }}
      />

      <BrokerSetupDialog
        broker={setupBroker ? { id: setupBroker, label: brokerLabel(setupBroker) } : null}
        existing={brokers.find((x) => x.broker === setupBroker) ?? null}
        onClose={() => setSetupBroker(null)}
        onDone={refresh}
      />

      <AddFundsDialog broker={fundsBroker} onClose={() => setFundsBroker(null)} onDone={refresh} />

      <OrderTicket draft={draft} brokers={brokers} onClose={() => setDraft(null)} onPlaced={refresh} speak={speak} />
    </div>
  );
}
