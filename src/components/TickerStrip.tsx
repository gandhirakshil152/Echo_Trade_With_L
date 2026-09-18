import { formatINR } from "@/lib/stocks";

interface Item {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export function TickerStrip({ items }: { items: Item[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-surface/40 py-2">
      <div className="ticker-track flex w-max gap-6 whitespace-nowrap sm:gap-8">
        {doubled.map((item, i) => (
          <span key={`${item.symbol}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="font-display tracking-wide text-muted-foreground">{item.name}</span>
            <span className="num text-foreground">{formatINR(item.price)}</span>
            <span className={item.changePercent >= 0 ? "num text-bull" : "num text-bear"}>
              {item.changePercent >= 0 ? "▲" : "▼"} {Math.abs(item.changePercent).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
