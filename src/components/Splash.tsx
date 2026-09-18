import { Link } from "@tanstack/react-router";
import {
  AudioLines,
  BadgeIndianRupee,
  BarChart3,
  Building2,
  LineChart,
  Mic,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { TickerStrip } from "@/components/TickerStrip";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/stocks";
import { cn } from "@/lib/utils";

interface IndexItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

const STEPS = [
  { icon: Mic, title: "Speak", body: "“Buy ten Reliance on Zerodha” — natural Indian English, numbers in lakhs and crores." },
  { icon: ShieldCheck, title: "Verify", body: "The ticket opens with your broker and quantity pre-filled. You type the PIN — never spoken." },
  { icon: BarChart3, title: "Executed", body: "Funds, holdings, P&L and brokerage update instantly on that broker account." },
];

const FEATURES = [
  { icon: LineChart, title: "Live charts", body: "Intraday to 5-year candles with volume, straight from public NSE/BSE feeds." },
  { icon: Newspaper, title: "News & fundamentals", body: "Headlines, P/E, P/B, EPS, 52-week range and a technical read per scrip." },
  { icon: Wallet, title: "Funds by broker", body: "Add money with a simulated UPI QR, track a full funds ledger per broker." },
  { icon: Building2, title: "Three brokers", body: "Zerodha, Upstox and Angel One panels you configure yourself with client ID and PIN." },
  { icon: BadgeIndianRupee, title: "Rupee-first", body: "Everything in INR: turnover, brokerage, STT, GST and net P&L." },
  { icon: Sparkles, title: "Voice everywhere", body: "Filter portfolio by broker, open charts, ask for news or top gainers — all by voice." },
];

export function Splash({ indices }: { indices: IndexItem[] }) {
  return (
    <main>
      <TickerStrip items={indices} />

      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-3">
        <ThemeToggle />
      </div>



      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 text-center sm:pb-16 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <AudioLines className="size-3.5 text-primary" /> voice command trading · nse & bse
        </span>
        <h1 className="font-display mt-6 text-4xl font-bold leading-[1.08] sm:text-6xl lg:text-7xl">
          Say it. <span className="text-gradient">Trade it.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground sm:text-base lg:text-lg">
          EchoTrade is a voice-first Indian trading terminal. Live market data, charts, fundamentals and news
          in one screen — with Zerodha, Upstox and Angel One panels you control by speaking.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg">
            <Link to="/auth">Open your terminal</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Create free account</Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {indices.slice(0, 4).map((i) => (
            <div key={i.symbol} className="panel p-4 text-left">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{i.name}</p>
              <p className="num mt-2 text-xl font-semibold">{formatINR(i.price, 2)}</p>
              <p className={cn("num mt-1 text-xs", i.changePercent >= 0 ? "text-bull" : "text-bear")}>
                {i.changePercent >= 0 ? "+" : ""}
                {i.changePercent.toFixed(2)}% today
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-center text-2xl font-semibold">How voice trading works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="panel p-6">
              <div className="flex items-center gap-3">
                <span className="glow-ring flex size-9 items-center justify-center rounded-lg bg-primary/15">
                  <s.icon className="size-4 text-primary" />
                </span>
                <span className="num text-xs text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="font-display mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-center text-2xl font-semibold">Everything in one terminal</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="panel p-5">
              <f.icon className="size-5 text-primary" />
              <h3 className="font-display mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="panel p-10">
          <h2 className="font-display text-3xl font-semibold">Ready to talk to the market?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Set up your broker panels, add simulated funds over UPI and place your first voice order in under a
            minute. Demo execution — market data is live from public feeds.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
