import { Search, TrendingDown, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/stocks";
import { cn } from "@/lib/utils";

export interface SearchQuote {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  changePercent: number;
  live?: boolean;
}

const score = (q: string, s: SearchQuote): number => {
  const sym = s.symbol.toLowerCase();
  const name = s.name.toLowerCase();
  if (sym === q) return 100;
  if (sym.startsWith(q)) return 90;
  if (name.startsWith(q)) return 85;
  if (name.includes(q)) return 70;
  if (sym.includes(q)) return 65;
  if (s.sector.toLowerCase().includes(q)) return 40;
  return 0;
};

export function MarketSearch({
  quotes,
  onSelect,
  recent,
  remote,
  onQueryChange,
  loading,
  placeholder = "Search every NSE / BSE listed company — symbol, name or sector",
}: {
  quotes: SearchQuote[];
  onSelect: (value: string | SearchQuote) => void;
  recent?: string[];
  /** Live hits from the full exchange universe (server search). */
  remote?: SearchQuote[];
  onQueryChange?: (q: string) => void;
  loading?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const list = (recent ?? []).map((r) => quotes.find((x) => x.symbol === r)).filter(Boolean) as SearchQuote[];
      return list.slice(0, 6);
    }
    const local = quotes
      .map((s) => ({ s, v: score(q, s) }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 6)
      .map((x) => x.s);
    const seen = new Set(local.map((s) => s.symbol));
    const extra = (remote ?? []).filter((s) => !seen.has(s.symbol));
    return [...local, ...extra].slice(0, 12);
  }, [query, quotes, recent, remote]);

  useEffect(() => {
    onQueryChange?.(query.trim());
  }, [query, onQueryChange]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const choose = (value: string | SearchQuote) => {
    onSelect(value);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface/70 px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && suggestions[active]) {
              choose(suggestions[active]!);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label="Search stocks"
          className="border-0 bg-transparent focus-visible:ring-0"
        />
        {query ? (
          <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
            <X className="size-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      {open && suggestions.length > 0 ? (
        <div className="panel absolute z-50 mt-2 max-h-80 w-full overflow-auto p-1">
          <p className="px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {!query ? "Recent" : loading ? "Searching all NSE & BSE listings…" : "NSE & BSE listings"}
          </p>
          {suggestions.map((s, i) => (
            <button
              key={s.symbol}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(s)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                i === active ? "bg-surface-2/80" : "hover:bg-surface-2/60",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold">{s.symbol}</span>
                  <span className="rounded border border-border/70 px-1 text-[9px] tracking-wider text-muted-foreground">
                    {s.exchange}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {s.name} · {s.sector}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <div className="num text-sm">{formatINR(s.price)}</div>
                <div
                  className={cn(
                    "num flex items-center justify-end gap-1 text-xs",
                    s.changePercent >= 0 ? "text-bull" : "text-bear",
                  )}
                >
                  {s.changePercent >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {s.changePercent >= 0 ? "+" : ""}
                  {s.changePercent.toFixed(2)}%
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
