import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { analyse, type Candle } from "@/lib/indicators";
import { getCandles, getFundamentals, getNews } from "@/lib/market.functions";
import { formatINR } from "@/lib/stocks";

const crore = (v: number | null) => (v === null ? "—" : `₹${(v / 1_00_00_000).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`);
const num = (v: number | null, suffix = "") => (v === null ? "—" : `${v.toLocaleString("en-IN")}${suffix}`);

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-2/40 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="num mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function Fundamentals({ symbol }: { symbol: string }) {
  const fetchFundamentals = useServerFn(getFundamentals);
  const { data, isLoading } = useQuery({
    queryKey: ["fundamentals", symbol],
    queryFn: () => fetchFundamentals({ data: { symbol } }),
    staleTime: 300_000,
  });

  if (isLoading) return <Skeleton className="h-52 w-full" />;
  const f = data?.data;
  if (!f) return <p className="p-6 text-sm text-muted-foreground">Fundamentals unavailable right now.</p>;

  return (
    <div className="space-y-3">
      {!data?.live ? (
        <p className="text-xs text-muted-foreground">Public feed throttled — showing what could be fetched.</p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Market cap" value={crore(f.marketCap)} />
        <Stat label="P/E (TTM)" value={num(f.pe)} />
        <Stat label="P/B" value={num(f.pb)} />
        <Stat label="EPS" value={num(f.eps)} />
        <Stat label="Div yield" value={f.dividendYield === null ? "—" : `${f.dividendYield}%`} />
        <Stat label="Book value" value={num(f.bookValue)} />
        <Stat label="52W high" value={f.high52 === null ? "—" : formatINR(f.high52)} />
        <Stat label="52W low" value={f.low52 === null ? "—" : formatINR(f.low52)} />
        <Stat label="Day high" value={f.dayHigh === null ? "—" : formatINR(f.dayHigh)} />
        <Stat label="Day low" value={f.dayLow === null ? "—" : formatINR(f.dayLow)} />
        <Stat label="Volume" value={num(f.volume)} />
        <Stat label="Sector" value={f.sector} />
      </div>
    </div>
  );
}

export function Technicals({ symbol }: { symbol: string }) {
  const fetchCandles = useServerFn(getCandles);
  const { data, isLoading } = useQuery({
    queryKey: ["candles", symbol, "6M"],
    queryFn: () => fetchCandles({ data: { symbol, range: "6M" } }),
    staleTime: 300_000,
  });

  if (isLoading) return <Skeleton className="h-52 w-full" />;
  const candles = (data?.candles ?? []) as Candle[];
  if (!candles.length) return <p className="p-6 text-sm text-muted-foreground">Technicals unavailable.</p>;
  const t = analyse(candles);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={t.verdict === "Bullish" ? "default" : t.verdict === "Bearish" ? "destructive" : "outline"}>
          {t.verdict}
        </Badge>
        <span className="text-xs text-muted-foreground">Computed on 6-month daily candles</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="SMA 20" value={num(t.sma20)} />
        <Stat label="SMA 50" value={num(t.sma50)} />
        <Stat label="EMA 20" value={num(t.ema20)} />
        <Stat label="RSI 14" value={num(t.rsi14)} />
        <Stat label="MACD" value={t.macd ? String(t.macd.macd) : "—"} />
        <Stat label="Signal" value={t.macd ? String(t.macd.signal) : "—"} />
        <Stat label="Histogram" value={t.macd ? String(t.macd.histogram) : "—"} />
        <Stat label="VWAP" value={num(t.vwap)} />
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {t.reasons.map((r) => (
          <li key={r}>· {r}</li>
        ))}
      </ul>
    </div>
  );
}

export function NewsFeed({ symbol }: { symbol?: string }) {
  const fetchNews = useServerFn(getNews);
  const { data, isLoading } = useQuery({
    queryKey: ["news", symbol ?? "market"],
    queryFn: () => fetchNews({ data: symbol ? { symbol } : {} }),
    staleTime: 300_000,
  });

  if (isLoading) return <Skeleton className="h-52 w-full" />;
  const items = data?.items ?? [];
  if (!items.length)
    return <p className="p-6 text-sm text-muted-foreground">No headlines available from the public feed right now.</p>;

  return (
    <div className="divide-y divide-border/50">
      {items.map((n) => (
        <a
          key={n.link}
          href={n.link}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-start gap-3 px-1 py-3 transition-colors hover:bg-surface-2/50"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{n.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {n.publisher} · {new Date(n.publishedAt).toLocaleString("en-IN")}
            </p>
          </div>
          <ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}
