import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Activity, BadgeIndianRupee, Mic, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { TopBar } from "@/components/TopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { brokerLabel, formatINR } from "@/lib/stocks";
import { getAdminOverview } from "@/lib/trading.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin control room — EchoTrade" },
      {
        name: "description",
        content:
          "EchoTrade admin control room: every user, their linked Indian brokers, rupee funds, holdings and voice-placed NSE/BSE orders.",
      },
      { property: "og:title", content: "Admin control room — EchoTrade" },
      { property: "og:description", content: "Oversee all EchoTrade users, brokers and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const fetchOverview = useServerFn(getAdminOverview);
  const [search, setSearch] = useState("");

  const { data, isError, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const users = (data?.users ?? []).filter((u) =>
    (u.email + (u.full_name ?? "")).toLowerCase().includes(search.trim().toLowerCase()),
  );
  const orders = data?.orders ?? [];
  const totalFunds = (data?.users ?? []).reduce((s, u) => s + u.funds, 0);
  const voiceShare = orders.length
    ? Math.round((orders.filter((o) => o.source === "voice").length / orders.length) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      <TopBar email={user?.email} isAdmin onSignOut={signOut} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="size-6 text-primary" /> Admin control room
          </h1>
          <Badge variant="outline">restricted</Badge>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <Link to="/">Back to terminal</Link>
          </Button>
        </div>

        {isLoading ? <p className="text-sm text-muted-foreground">Loading platform data…</p> : null}

        {isError ? (
          <section className="panel p-6">
            <h2 className="font-display text-lg font-semibold">Admin access required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This account isn't an EchoTrade admin. Sign in with the admin email to view every user.
            </p>
          </section>
        ) : null}

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Users, label: "Users", value: String(data.users.length) },
                { icon: BadgeIndianRupee, label: "Funds under platform", value: formatINR(totalFunds, 0) },
                { icon: Activity, label: "Orders", value: String(orders.length) },
                { icon: Mic, label: "Voice-placed", value: `${voiceShare}%` },
              ].map((k) => (
                <section key={k.label} className="panel p-5">
                  <k.icon className="size-5 text-primary" />
                  <div className="num mt-3 text-2xl font-semibold">{k.value}</div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{k.label}</p>
                </section>
              ))}
            </div>

            <section className="panel overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-border/60 p-4">
                <h2 className="font-display text-lg font-semibold">All users</h2>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email or name"
                  className="max-w-xs"
                />
              </div>
              <div className="divide-y divide-border/50">
                {users.map((u) => (
                  <div key={u.id} className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-sm font-semibold">{u.full_name ?? "Unnamed trader"}</p>
                        <p className="num text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="num text-right text-xs text-muted-foreground">
                        <div className="text-sm text-foreground">{formatINR(u.funds, 0)}</div>
                        {u.orderCount} orders · {u.voiceOrders} by voice · turnover {formatINR(u.turnover, 0)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {u.brokers.map((b) => (
                        <span
                          key={b.id}
                          className="num rounded-md border border-border/70 bg-surface-2/50 px-2 py-1 text-[11px]"
                        >
                          {brokerLabel(b.broker)} · {b.client_code} · {formatINR(Number(b.balance_inr), 0)} ·{" "}
                          {b.is_connected ? "live" : "off"}
                        </span>
                      ))}
                    </div>
                    {u.holdings.length ? (
                      <div className="flex flex-wrap gap-2">
                        {u.holdings.map((h) => (
                          <span key={h.id} className="num rounded-md bg-primary/10 px-2 py-1 text-[11px] text-primary">
                            {h.symbol} × {h.quantity} @ {formatINR(Number(h.avg_price))}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="panel overflow-hidden">
              <h2 className="font-display border-b border-border/60 p-4 text-lg font-semibold">
                Platform order flow
              </h2>
              <div className="divide-y divide-border/50">
                {orders.slice(0, 60).map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <Badge variant={o.side === "buy" ? "default" : "destructive"}>{o.side.toUpperCase()}</Badge>
                    <span className="font-display text-sm font-semibold">{o.symbol}</span>
                    <span className="num text-xs text-muted-foreground">
                      {o.quantity} @ {formatINR(Number(o.price))} · {brokerLabel(o.broker)} · {o.exchange} ·{" "}
                      {o.source}
                    </span>
                    <span className="num ml-auto text-sm">{formatINR(Number(o.total_inr))}</span>
                    <span className="num text-[11px] text-muted-foreground">
                      {new Date(o.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
