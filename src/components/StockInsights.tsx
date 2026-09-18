import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { analyse, type Candle } from "@/lib/indicators";
import { getCandles, getFundamentals, getNews } from "@/lib/market.functions";
import { formatINR } from "@/lib/stocks";

const crore = (v: number | null) =>
  v === null ? "—" : `₹${(v / 1_00_00_000).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
const num = (v: number | null, suffix = "") =>
  v === null ? "—" : `${v.toLocaleString("en-IN")}${suffix}`;

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: "bull" | "bear" | "neutral" }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-2/40 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={`num mt-1 text-sm font-semibold ${
        highlight === "bull" ? "text-bull" :
        highlight === "bear" ? "text-bear" :
        ""
      }`}>{value}</p>
    </div>
  );
}

/** RSI gauge bar */
function RsiGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = value > 70 ? "#ef4444" : value < 30 ? "#22c55e" : "#60a5fa";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Oversold 30</span>
        <span className="font-bold" style={{ color }}>{value.toFixed(1)}</span>
        <span>Overbought 70</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-surface-2">
        {/* zones */}
        <div className="absolute left-0 top-0 h-full w-[30%] bg-bull/20 rounded-l-full" />
        <div className="absolute right-0 top-0 h-full w-[30%] bg-bear/20 rounded-r-full" />
        {/* marker */}
        <div
          className="absolute top-0 h-full w-1.5 -translate-x-1/2 rounded-full transition-all duration-700"
          style={{ left: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function Fundamentals({ symbol }: { symbol: string }) {
  const fetchFundamentals = useServerFn(getFundamentals);
  const { data, isLoading } = useQuery({
    queryKey: ["fundamentals", symbol],
    queryFn: () => fetchFundamentals({ data: { symbol } }),
    staleTime: 60_000,           // 1 min (was 5 min)
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data)
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );

  const f = data?.data;
  if (!f) return <p className="p-6 text-sm text-muted-foreground">Fundamentals unavailable right now.</p>;

  const peHighlight = f.pe === null ? "neutral" : f.pe > 40 ? "bear" : f.pe < 15 ? "bull" : "neutral";

  return (
    <div className="space-y-3">
      {!data?.live && (
        <p className="text-xs text-amber-500/80">⚡ Public feed throttled — showing cached data.</p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="Market Cap" value={crore(f.marketCap)} />
        <Stat label="P/E (TTM)" value={num(f.pe)} highlight={peHighlight as any} />
        <Stat label="P/B" value={num(f.pb)} />
        <Stat label="EPS (TTM)" value={num(f.eps)} highlight={f.eps !== null && f.eps > 0 ? "bull" : "bear"} />
        <Stat label="Div Yield" value={f.dividendYield === null ? "—" : `${f.dividendYield}%`} />
        <Stat label="Book Value" value={num(f.bookValue)} />
        <Stat label="52W High" value={f.high52 === null ? "—" : formatINR(f.high52)} />
        <Stat label="52W Low" value={f.low52 === null ? "—" : formatINR(f.low52)} />
        <Stat label="Day High" value={f.dayHigh === null ? "—" : formatINR(f.dayHigh)} highlight="bull" />
        <Stat label="Day Low" value={f.dayLow === null ? "—" : formatINR(f.dayLow)} highlight="bear" />
        <Stat label="Volume" value={f.volume === null ? "—" : f.volume.toLocaleString("en-IN")} />
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
    staleTime: 60_000,           // 1 min
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data)
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );

  const candles = (data?.candles ?? []) as Candle[];
  if (!candles.length) return <p className="p-6 text-sm text-muted-foreground">Technicals unavailable.</p>;

  const t = analyse(candles);
  const VerdictIcon = t.verdict === "Bullish" ? TrendingUp : t.verdict === "Bearish" ? TrendingDown : Minus;

  return (
    <div className="space-y-4">
      {/* Verdict banner */}
      <div className={`flex items-center gap-3 rounded-xl border p-4 ${
        t.verdict === "Bullish" ? "border-bull/40 bg-bull/10" :
        t.verdict === "Bearish" ? "border-bear/40 bg-bear/10" :
        "border-border/60 bg-surface-2/30"
      }`}>
        <VerdictIcon className={`size-6 shrink-0 ${
          t.verdict === "Bullish" ? "text-bull" :
          t.verdict === "Bearish" ? "text-bear" :
          "text-muted-foreground"
        }`} />
        <div>
          <p className={`text-lg font-bold ${
            t.verdict === "Bullish" ? "text-bull" :
            t.verdict === "Bearish" ? "text-bear" :
            "text-foreground"
          }`}>{t.verdict} · {t.strength}</p>
          <p className="text-xs text-muted-foreground">Based on 6-month daily candles</p>
        </div>
      </div>

      {/* RSI gauge */}
      {t.rsi14 !== null && <RsiGauge value={t.rsi14} />}

      {/* Key indicators */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <Stat label="SMA 20" value={num(t.sma20)} />
        <Stat label="SMA 50" value={num(t.sma50)} />
        <Stat label="EMA 20" value={num(t.ema20)} />
        <Stat label="RSI 14" value={num(t.rsi14)} highlight={
          t.rsi14 !== null ? (t.rsi14 > 70 ? "bear" : t.rsi14 < 30 ? "bull" : "neutral") : "neutral"
        } />
        <Stat label="MACD" value={t.macd ? String(t.macd.macd) : "—"} highlight={
          t.macd ? (t.macd.histogram > 0 ? "bull" : "bear") : "neutral"
        } />
        <Stat label="Signal" value={t.macd ? String(t.macd.signal) : "—"} />
        <Stat label="Histogram" value={t.macd ? String(t.macd.histogram) : "—"} />
        <Stat label="VWAP" value={num(t.vwap)} />
        {t.bollinger && (
          <>
            <Stat label="BB Upper" value={formatINR(t.bollinger.upper)} highlight="bear" />
            <Stat label="BB Middle" value={formatINR(t.bollinger.middle)} />
            <Stat label="BB Lower" value={formatINR(t.bollinger.lower)} highlight="bull" />
            <Stat label="BB Width" value={`${t.bollinger.bandwidth}%`} />
          </>
        )}
        {t.stoch && (
          <>
            <Stat label="Stoch %K" value={num(t.stoch.k)} />
            <Stat label="Stoch %D" value={num(t.stoch.d)} />
          </>
        )}
        {t.atr14 !== null && <Stat label="ATR 14" value={num(t.atr14)} />}
        {t.adx14 !== null && (
          <Stat label="ADX 14" value={num(t.adx14)} highlight={t.adx14 > 25 ? "bull" : "neutral"} />
        )}
      </div>

      {/* Pivot points */}
      {t.pivots && (
        <div className="rounded-xl border border-border/60 bg-surface-2/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pivot Points</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
            <div className="text-center">
              <p className="text-[10px] text-bear">S3</p>
              <p className="num text-xs font-bold text-bear">{formatINR(t.pivots.s3)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-bear">S2</p>
              <p className="num text-xs font-bold text-bear">{formatINR(t.pivots.s2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-bear">S1</p>
              <p className="num text-xs font-bold text-bear">{formatINR(t.pivots.s1)}</p>
            </div>
            <div className="rounded-lg bg-primary/20 py-1 text-center">
              <p className="text-[10px] text-primary">Pivot</p>
              <p className="num text-xs font-bold text-primary">{formatINR(t.pivots.pivot)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-bull">R1</p>
              <p className="num text-xs font-bold text-bull">{formatINR(t.pivots.r1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-bull">R2</p>
              <p className="num text-xs font-bold text-bull">{formatINR(t.pivots.r2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-bull">R3</p>
              <p className="num text-xs font-bold text-bull">{formatINR(t.pivots.r3)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signal reasons */}
      <ul className="space-y-1.5">
        {t.reasons.map((r) => (
          <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-0.5 text-primary">·</span>
            {r}
          </li>
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
    staleTime: 60_000,           // 1 min (was 5 min)
    refetchInterval: 120_000,    // auto-refresh every 2 min
    placeholderData: (prev) => prev,
  });

  if (isLoading && !data) return <Skeleton className="h-52 w-full" />;
  const items = data?.items ?? [];
  if (!items.length)
    return <p className="p-6 text-sm text-muted-foreground">No headlines available right now.</p>;

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
