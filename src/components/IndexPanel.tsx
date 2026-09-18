import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { INDIAN_INDICES, formatINR } from "@/lib/stocks";
import { cn } from "@/lib/utils";

export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

/** Floating, collapsible index bar. Pinned indices are chosen by the user. */
export function IndexPanel({
  indices,
  pinned,
  onPinnedChange,
}: {
  indices: IndexQuote[];
  pinned: string[];
  onPinnedChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const shown = indices.filter((i) => pinned.includes(i.symbol));

  const toggle = (symbol: string) => {
    onPinnedChange(pinned.includes(symbol) ? pinned.filter((p) => p !== symbol) : [...pinned, symbol]);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-3">
      <div className="panel pointer-events-auto flex w-full max-w-full items-center gap-2 px-2 py-2 backdrop-blur-xl sm:w-auto sm:gap-3 sm:px-3">
        <button
          type="button"
          aria-label={open ? "Collapse index bar" : "Expand index bar"}
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          Indices {open ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
        </button>

        {open ? (
          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-3 overflow-x-auto sm:max-w-[60vw] sm:gap-4">
            {shown.length === 0 ? (
              <span className="text-xs text-muted-foreground">Pin an index →</span>
            ) : (
              shown.map((i) => (
                <div key={i.symbol} className="flex shrink-0 items-center gap-2">
                  <span className="font-display text-xs tracking-wide text-muted-foreground">{i.name}</span>
                  <span className="num text-xs">{formatINR(i.price, 2)}</span>
                  <span className={cn("num text-xs", i.changePercent >= 0 ? "text-bull" : "text-bear")}>
                    {i.changePercent >= 0 ? "▲" : "▼"} {Math.abs(i.changePercent).toFixed(2)}%
                  </span>
                </div>
              ))
            )}
          </div>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Choose indices" className="shrink-0">
              <Plus className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-60">
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Index bar</p>
            <div className="space-y-2">
              {INDIAN_INDICES.map((i) => (
                <label key={i.symbol} className="flex items-center justify-between text-sm">
                  {i.name}
                  <Switch checked={pinned.includes(i.symbol)} onCheckedChange={() => toggle(i.symbol)} />
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
