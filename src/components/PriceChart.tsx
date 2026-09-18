import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
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
    staleTime: 60_000,
  });

  const candles = data?.candles ?? [];
  const first = candles[0]?.close ?? 0;
  const last = candles[candles.length - 1]?.close ?? 0;
  const up = last >= first;
  const rows = candles.map((c) => ({ ...c, label: fmtTick(c.time, range) }));

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-semibold">Price chart</h3>
          <p className="text-xs text-muted-foreground">
            {data?.live ? "Live public market feed" : "Indicative tape (feed unavailable)"}
          </p>
        </div>
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

      {isLoading ? (
        <Skeleton className="mt-4 h-64 w-full" />
      ) : (
        <>
          <div className="mt-3 h-48 w-full sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={up ? "var(--bull)" : "var(--bear)"}
                      stopOpacity={0.45}
                    />
                    <stop offset="100%" stopColor={up ? "var(--bull)" : "var(--bear)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={28} />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  width={62}
                  tickFormatter={(v: number) => v.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [formatINR(v), "Close"]}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={up ? "var(--bull)" : "var(--bear)"}
                  strokeWidth={2}
                  fill="url(#chartFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 h-16 w-full">
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
                <Bar dataKey="volume" fill="var(--primary)" opacity={0.35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
