import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Cell,
  Area,
  AreaChart,
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

// ─── Proper Candlestick Custom Bar ───────────────────────────────────────────

interface CandleRow {
  open: number; high: number; low: number; close: number;
  label: string; sma20?: number | null; sma50?: number | null;
  bbUpper?: number | null; bbLower?: number | null;
  volume?: number;
}

/**
 * CandlestickBars — renders OHLC candles using recharts' yAxisMap + xAxisMap
 * that are injected by ComposedChart into all child components via props.
 * This is the only reliable way to get pixel-space Y coordinates.
 */
const CandlestickBars = (props: any) => {
  const { data, xAxisMap, yAxisMap, xAxis } = props;
  if (!data || !xAxisMap || !yAxisMap) return null;

  // Get the first yAxis and xAxis from recharts maps
  const yScale = yAxisMap[Object.keys(yAxisMap)[0] as string]?.scale;
  const xScale = xAxisMap[Object.keys(xAxisMap)[0] as string]?.scale;

  if (!yScale || !xScale) return null;

  // Calculate bar width from scale bandwidth or fallback
  const bandwidth = typeof xScale.bandwidth === "function"
    ? xScale.bandwidth()
    : (xScale.range()[1] - xScale.range()[0]) / Math.max(data.length, 1);

  const candleWidth = Math.max(1, Math.min(bandwidth * 0.7, 14));
  const wickWidth = Math.max(0.8, candleWidth * 0.08);

  return (
    <g>
      {(data as CandleRow[]).map((d, i) => {
        const xCenter = xScale(d.label) + bandwidth / 2;
        if (isNaN(xCenter)) return null;

        const yHigh = yScale(d.high);
        const yLow = yScale(d.low);
        const yOpen = yScale(d.open);
        const yClose = yScale(d.close);

        const up = d.close >= d.open;
        const bullColor = "#22c55e";
        const bearColor = "#ef4444";
        const color = up ? bullColor : bearColor;

        const bodyTop = Math.min(yOpen, yClose);
        const bodyBottom = Math.max(yOpen, yClose);
        const bodyH = Math.max(1, bodyBottom - bodyTop);

        return (
          <g key={i}>
            {/* Upper wick */}
            <line
              x1={xCenter} x2={xCenter}
              y1={yHigh} y2={bodyTop}
              stroke={color}
              strokeWidth={wickWidth}
              strokeLinecap="round"
            />
            {/* Lower wick */}
            <line
              x1={xCenter} x2={xCenter}
              y1={bodyBottom} y2={yLow}
              stroke={color}
              strokeWidth={wickWidth}
              strokeLinecap="round"
            />
            {/* Body */}
            {up ? (
              // Bullish — hollow body with colored border
              <rect
                x={xCenter - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyH}
                fill="transparent"
                stroke={bullColor}
                strokeWidth={1.2}
                rx={0.5}
              />
            ) : (
              // Bearish — filled body
              <rect
                x={xCenter - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyH}
                fill={bearColor}
                stroke={bearColor}
                strokeWidth={0.5}
                rx={0.5}
                opacity={0.9}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CandleTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as CandleRow | undefined;
  if (!d) return null;
  const up = d.close >= d.open;
  const change = d.close - d.open;
  const changePct = d.open > 0 ? (change / d.open) * 100 : 0;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-sm p-3 text-xs shadow-2xl min-w-[160px]">
      <p className="mb-2 font-semibold text-muted-foreground text-[11px] tracking-wide">{d.label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-muted-foreground">Open</span>
        <span className="font-mono text-right tabular-nums">{formatINR(d.open)}</span>
        <span className="text-muted-foreground">High</span>
        <span className="font-mono text-right tabular-nums text-emerald-400">{formatINR(d.high)}</span>
        <span className="text-muted-foreground">Low</span>
        <span className="font-mono text-right tabular-nums text-red-400">{formatINR(d.low)}</span>
        <span className="text-muted-foreground">Close</span>
        <span className={`font-mono text-right tabular-nums font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
          {formatINR(d.close)}
        </span>
      </div>
      <div className={`mt-2 pt-2 border-t border-border/50 font-mono text-right font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
        {up ? "▲" : "▼"} {formatINR(Math.abs(change))} ({up ? "+" : ""}{changePct.toFixed(2)}%)
      </div>
      {d.sma20 != null && (
        <div className="mt-1 flex justify-between text-[10px]">
          <span className="text-blue-400/80">SMA 20</span>
          <span className="font-mono text-blue-400 tabular-nums">{formatINR(d.sma20)}</span>
        </div>
      )}
      {d.sma50 != null && (
        <div className="flex justify-between text-[10px]">
          <span className="text-orange-400/80">SMA 50</span>
          <span className="font-mono text-orange-400 tabular-nums">{formatINR(d.sma50)}</span>
        </div>
      )}
      {d.volume != null && (
        <div className="mt-1 flex justify-between text-[10px] border-t border-border/40 pt-1">
          <span className="text-muted-foreground">Vol</span>
          <span className="font-mono tabular-nums">{d.volume.toLocaleString("en-IN")}</span>
        </div>
      )}
    </div>
  );
};

// ─── Line Chart Tooltip ───────────────────────────────────────────────────────

const LineTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value as number;
  const d = payload[0]?.payload as CandleRow;
  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-sm p-2.5 text-xs shadow-2xl">
      {d?.label && <p className="mb-1 text-muted-foreground text-[11px]">{d.label}</p>}
      <span className="font-mono font-semibold">{formatINR(v)}</span>
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
  const [showVWAP, setShowVWAP] = useState(false);

  const candles = data?.candles ?? [];
  const first = candles[0]?.close ?? 0;
  const last = candles[candles.length - 1]?.close ?? 0;
  const up = last >= first;
  const changeAbs = last - first;
  const changePct = first > 0 ? (changeAbs / first) * 100 : 0;

  // Pre-compute indicator series
  const sma20series = useMemo(() => smaSeries(candles as any, 20), [candles]);
  const sma50series = useMemo(() => smaSeries(candles as any, 50), [candles]);
  const bbSeries = useMemo(
    () => (showBB ? bollingerSeries(candles as any, 20, 2) : { upper: [], lower: [] }),
    [candles, showBB],
  );

  // VWAP (volume-weighted average price)
  const vwapSeries = useMemo(() => {
    if (!showVWAP) return [];
    let cumVol = 0, cumVolPrice = 0;
    return candles.map((c) => {
      const typical = ((c as any).high + (c as any).low + c.close) / 3;
      const vol = (c as any).volume ?? 0;
      cumVolPrice += typical * vol;
      cumVol += vol;
      return cumVol > 0 ? cumVolPrice / cumVol : typical;
    });
  }, [candles, showVWAP]);

  const rows = useMemo(
    () =>
      candles.map((c, i) => ({
        ...c,
        label: fmtTick(c.time, range),
        sma20: sma20series[i] ?? null,
        sma50: sma50series[i] ?? null,
        bbUpper: bbSeries.upper[i] ?? null,
        bbLower: bbSeries.lower[i] ?? null,
        vwap: showVWAP ? (vwapSeries[i] ?? null) : null,
      })),
    [candles, range, sma20series, sma50series, bbSeries, showVWAP, vwapSeries],
  );

  // Domain with 0.3% padding
  const domainMin = rows.length ? Math.min(...rows.map((r) => (r as any).low ?? r.close)) * 0.997 : "auto";
  const domainMax = rows.length ? Math.max(...rows.map((r) => (r as any).high ?? r.close)) * 1.003 : "auto";

  const buttonBase = "rounded-md px-2.5 py-1 text-xs font-medium transition-all";
  const activeBtn = "bg-primary text-primary-foreground shadow-sm";
  const inactiveBtn = "text-muted-foreground hover:text-foreground hover:bg-surface-2/80";
  const toggleActive = "border-primary bg-primary/15 text-primary";
  const toggleInactive = "border-border/70 bg-surface/60 text-muted-foreground hover:text-foreground";

  return (
    <section className="panel p-4 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-sm font-semibold flex items-center gap-2">
            {symbol}
            <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {up ? "▲" : "▼"} {up ? "+" : ""}{changePct.toFixed(2)}%
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data?.live ? "🟢 Live market feed" : "📡 Indicative feed"}
            {last > 0 && <span className="ml-2 font-mono font-semibold text-foreground">{formatINR(last)}</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex gap-0.5 rounded-lg border border-border/70 bg-surface/60 p-0.5">
            <button type="button" onClick={() => setChartType("candle")}
              className={cn(buttonBase, chartType === "candle" ? activeBtn : inactiveBtn)}>
              🕯 Candle
            </button>
            <button type="button" onClick={() => setChartType("line")}
              className={cn(buttonBase, chartType === "line" ? activeBtn : inactiveBtn)}>
              📈 Line
            </button>
          </div>

          {/* Overlay toggles */}
          <div className="flex gap-1">
            <button type="button" onClick={() => setShowBB((v) => !v)}
              className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium transition-all", showBB ? toggleActive : toggleInactive)}>
              BB
            </button>
            <button type="button" onClick={() => setShowVWAP((v) => !v)}
              className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium transition-all", showVWAP ? toggleActive : toggleInactive)}>
              VWAP
            </button>
          </div>

          {/* Range selector */}
          <div className="no-scrollbar flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-border/70 bg-surface/60 p-0.5">
            {RANGES.map((r) => (
              <button key={r} type="button" onClick={() => onRangeChange(r)}
                className={cn("num shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-all", range === r ? activeBtn : inactiveBtn)}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && !rows.length ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <>
          {/* ── Main chart ── */}
          <div className="h-64 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "candle" ? (
                <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bbFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    minTickGap={32}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[domainMin, domainMax]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    width={72}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    orientation="right"
                  />
                  <Tooltip content={<CandleTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 2" }} />

                  {/* Bollinger Band fill area */}
                  {showBB && (
                    <>
                      <Line dataKey="bbUpper" dot={false} stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 2" connectNulls opacity={0.7} />
                      <Line dataKey="bbLower" dot={false} stroke="#a78bfa" strokeWidth={1} strokeDasharray="4 2" connectNulls opacity={0.7} />
                    </>
                  )}

                  {/* VWAP */}
                  {showVWAP && (
                    <Line dataKey="vwap" dot={false} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" connectNulls opacity={0.85} />
                  )}

                  {/* SMA overlays */}
                  <Line dataKey="sma20" dot={false} stroke="#60a5fa" strokeWidth={1.5} connectNulls opacity={0.85} />
                  <Line dataKey="sma50" dot={false} stroke="#fb923c" strokeWidth={1.5} connectNulls opacity={0.85} />

                  {/* Proper candlesticks via Customized which gets full chart context */}
                  <Customized component={CandlestickBars} />
                </ComposedChart>
              ) : (
                <AreaChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity={0.35} />
                      <stop offset="60%" stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity={0.08} />
                      <stop offset="100%" stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={32} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    width={72}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    orientation="right"
                  />
                  <Tooltip content={<LineTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 2" }} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={up ? "#22c55e" : "#ef4444"}
                    strokeWidth={2}
                    fill="url(#chartFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: up ? "#22c55e" : "#ef4444", stroke: "var(--background)", strokeWidth: 2 }}
                  />
                  {/* SMA overlays */}
                  <Line dataKey="sma20" dot={false} stroke="#60a5fa" strokeWidth={1.5} connectNulls opacity={0.85} />
                  <Line dataKey="sma50" dot={false} stroke="#fb923c" strokeWidth={1.5} connectNulls opacity={0.85} />
                  {showVWAP && (
                    <Line dataKey="vwap" dot={false} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" connectNulls opacity={0.85} />
                  )}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* ── Legend ── */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded-full bg-blue-400" /> SMA 20
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded-full bg-orange-400" /> SMA 50
            </span>
            {showBB && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 rounded-full bg-violet-400 opacity-70" style={{ backgroundImage: "repeating-linear-gradient(90deg, #a78bfa 0, #a78bfa 4px, transparent 4px, transparent 6px)" }} />
                Bollinger Bands
              </span>
            )}
            {showVWAP && (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4 rounded-full bg-amber-400" /> VWAP
              </span>
            )}
            <span className="ml-auto flex items-center gap-2 font-mono">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 border border-emerald-400 rounded-sm" /> Bull (hollow)</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-red-500 rounded-sm opacity-90" /> Bear (filled)</span>
            </span>
          </div>

          {/* ── Volume bars ── */}
          <div className="mt-2 h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 0, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 11,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                  formatter={(v: number) => [v.toLocaleString("en-IN"), "Volume"]}
                  cursor={{ fill: "var(--border)", opacity: 0.3 }}
                />
                <Bar dataKey="volume" isAnimationActive={false} radius={[2, 2, 0, 0]}>
                  {rows.map((entry, index) => (
                    <Cell
                      key={`vol-${index}`}
                      fill={entry.close >= entry.open ? "#22c55e" : "#ef4444"}
                      opacity={0.35}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-muted-foreground text-right mt-0.5 px-1">Volume</p>
        </>
      )}
    </section>
  );
}
