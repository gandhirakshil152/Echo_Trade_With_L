import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { smaSeries, bollingerSeries } from "@/lib/indicators";
import { getCandles } from "@/lib/market.functions";
import { formatINR } from "@/lib/stocks";
import { cn } from "@/lib/utils";

const RANGES = ["1D", "1W", "1M", "6M", "1Y", "5Y"] as const;
export type ChartRange = (typeof RANGES)[number];

const fmtTick = (iso: string, range: ChartRange) => {
  const d = new Date(iso);
  if (range === "1D" || range === "1W")
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (range === "5Y" || range === "1Y") return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// ─── Candlestick SVG Shape ───────────────────────────────────────────────────

interface CandlePayload {
  open: number; high: number; low: number; close: number;
  label: string; sma20?: number | null; sma50?: number | null;
  bbUpper?: number | null; bbLower?: number | null;
}

/** Custom candlestick bar rendered as SVG shapes */
const CandlestickShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  const { open, high, low, close } = payload as CandlePayload;
  const up = close >= open;
  const color = up ? "#22c55e" : "#ef4444";

  // Scale helpers — recharts gives us the bar dimensions
  // We need to figure the candle body from the chart scale
  const { yAxis } = props;
  const scale = yAxis?.scale;
  if (!scale) return null;

  const yHigh = scale(high);
  const yLow = scale(low);
  const yOpen = scale(open);
  const yClose = scale(close);

  const bodyTop = Math.min(yOpen, yClose);
  const bodyBottom = Math.max(yOpen, yClose);
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);
  const candleX = x + width / 2;
  const candleWidth = Math.max(2, width * 0.6);

  return (
    <g>
      {/* Wick */}
      <line x1={candleX} x2={candleX} y1={yHigh} y2={bodyTop} stroke={color} strokeWidth={1} />
      <line x1={candleX} x2={candleX} y1={bodyBottom} y2={yLow} stroke={color} strokeWidth={1} />
      {/* Body */}
      <rect
        x={candleX - candleWidth / 2}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={up ? color : color}
        stroke={color}
        strokeWidth={1}
        opacity={up ? 0.9 : 1}
      />
    </g>
  );
};

/** Custom tooltip for candlestick */
const CandleTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as CandlePayload | undefined;
  if (!d) return null;
  const up = d.close >= d.open;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-muted-foreground">{d.label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-muted-foreground">Open</span>
        <span className="font-mono text-right">{formatINR(d.open)}</span>
        <span className="text-muted-foreground">High</span>
        <span className="font-mono text-right text-bull">{formatINR(d.high)}</span>
        <span className="text-muted-foreground">Low</span>
        <span className="font-mono text-right text-bear">{formatINR(d.low)}</span>
        <span className="text-muted-foreground">Close</span>
        <span className={`font-mono text-right font-bold ${up ? "text-bull" : "text-bear"}`}>
          {formatINR(d.close)}
        </span>
        {d.sma20 != null && (
          <>
            <span className="text-muted-foreground">SMA 20</span>
            <span className="font-mono text-right text-blue-400">{formatINR(d.sma20)}</span>
          </>
        )}
        {d.sma50 != null && (
          <>
            <span className="text-muted-foreground">SMA 50</span>
            <span className="font-mono text-right text-orange-400">{formatINR(d.sma50)}</span>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Line Chart (fallback) ────────────────────────────────────────────────────

import { Area, AreaChart } from "recharts";

const LineTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value as number;
  return (
    <div className="rounded-lg border border-border bg-popover p-2 text-xs shadow-xl">
      {formatINR(v)}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function PriceChart({
  symbol,
  range,
  onRangeChange,
}: {
  symbol: string;
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}) {
  const fetchCandles = useServerFn(getCandles);
  const { data, isLoading } = useQuery({
    queryKey: ["candles", symbol, range],
    queryFn: () => fetchCandles({ data: { symbol, range } }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [showBB, setShowBB] = useState(false);

  const candles = data?.candles ?? [];
  const first = candles[0]?.close ?? 0;
  const last = candles[candles.length - 1]?.close ?? 0;
  const up = last >= first;

  // Pre-compute indicator series
  const sma20series = useMemo(() => smaSeries(candles as any, 20), [candles]);
  const sma50series = useMemo(() => smaSeries(candles as any, 50), [candles]);
  const bbSeries = useMemo(
    () => (showBB ? bollingerSeries(candles as any, 20, 2) : { upper: [], lower: [] }),
    [candles, showBB],
  );

  const rows = useMemo(
    () =>
      candles.map((c, i) => ({
        ...c,
        label: fmtTick(c.time, range),
        sma20: sma20series[i] ?? null,
        sma50: sma50series[i] ?? null,
        bbUpper: bbSeries.upper[i] ?? null,
        bbLower: bbSeries.lower[i] ?? null,
      })),
    [candles, range, sma20series, sma50series, bbSeries],
  );

  const domainMin = rows.length ? Math.min(...rows.map((r) => r.low)) * 0.998 : "auto";
  const domainMax = rows.length ? Math.max(...rows.map((r) => r.high)) * 1.002 : "auto";

  return (
    <section className="panel p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold">Price chart · {symbol}</h3>
          <p className="text-xs text-muted-foreground">
            {data?.live ? "Live public market feed" : "Indicative tape (feed unavailable)"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex gap-1 rounded-lg border border-border/70 bg-surface/60 p-1">
            <button
              type="button"
              onClick={() => setChartType("candle")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors",
                chartType === "candle" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Candle
            </button>
            <button
              type="button"
              onClick={() => setChartType("line")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs transition-colors",
                chartType === "line" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Line
            </button>
          </div>
          {/* BB toggle */}
          <button
            type="button"
            onClick={() => setShowBB((v) => !v)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs transition-colors",
              showBB ? "border-primary bg-primary/20 text-primary" : "border-border/70 bg-surface/60 text-muted-foreground hover:text-foreground",
            )}
          >
            BB
          </button>
          {/* Range selector */}
          <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border/70 bg-surface/60 p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRangeChange(r)}
                className={cn(
                  "num shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors",
                  range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && !rows.length ? (
        <Skeleton className="mt-4 h-64 w-full" />
      ) : (
        <>
          {/* ── Main chart ── */}
          <div className="mt-3 h-56 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "candle" ? (
                <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={28} />
                  <YAxis
                    domain={[domainMin, domainMax]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    width={68}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                  />
                  <Tooltip content={<CandleTooltip />} />

                  {/* Bollinger upper/lower */}
                  {showBB && (
                    <>
                      <Line dataKey="bbUpper" dot={false} stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 2" connectNulls />
                      <Line dataKey="bbLower" dot={false} stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 2" connectNulls />
                    </>
                  )}

                  {/* SMA overlays */}
                  <Line dataKey="sma20" dot={false} stroke="#60a5fa" strokeWidth={1.5} connectNulls />
                  <Line dataKey="sma50" dot={false} stroke="#fb923c" strokeWidth={1.5} connectNulls />

                  {/* Candlestick bars rendered as custom shape */}
                  <Bar dataKey="high" shape={<CandlestickShape />} isAnimationActive={false}>
                    {rows.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.close >= entry.open ? "#22c55e" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              ) : (
                <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={up ? "var(--bull)" : "var(--bear)"} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={up ? "var(--bull)" : "var(--bear)"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={28} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    width={68}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={up ? "var(--bull)" : "var(--bear)"}
                    strokeWidth={2}
                    fill="url(#chartFill)"
                  />
                  {/* SMA overlays on line chart too */}
                  <Line dataKey="sma20" dot={false} stroke="#60a5fa" strokeWidth={1.5} connectNulls />
                  <Line dataKey="sma50" dot={false} stroke="#fb923c" strokeWidth={1.5} connectNulls />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* SMA legend */}
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 rounded bg-blue-400" /> SMA 20
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 rounded bg-orange-400" /> SMA 50
            </span>
            {showBB && (
              <span className="flex items-center gap-1">
                <span className="inline-block h-0.5 w-4 rounded bg-violet-400" /> Bollinger Bands
              </span>
            )}
          </div>

          {/* ── Volume bars ── */}
          <div className="mt-2 h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v.toLocaleString("en-IN"), "Volume"]}
                />
                <Bar dataKey="volume" isAnimationActive={false}>
                  {rows.map((entry, index) => (
                    <Cell
                      key={`vol-${index}`}
                      fill={entry.close >= entry.open ? "#22c55e" : "#ef4444"}
                      opacity={0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
