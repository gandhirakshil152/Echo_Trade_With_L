import { BROKERS, type BrokerId } from "@/lib/stocks";
import { cn } from "@/lib/utils";

export type BrokerFilterValue = BrokerId | "all";

export function BrokerFilter({
  value,
  onChange,
  available,
  className,
}: {
  value: BrokerFilterValue;
  onChange: (next: BrokerFilterValue) => void;
  available?: string[];
  className?: string;
}) {
  const options: Array<{ id: BrokerFilterValue; label: string }> = [
    { id: "all", label: "All brokers" },
    ...BROKERS.map((b) => ({ id: b.id as BrokerFilterValue, label: b.label })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Filter by broker"
      className={cn("flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-surface/60 p-1", className)}
    >
      {options.map((o) => {
        const missing = o.id !== "all" && available && !available.includes(o.id);
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={value === o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              value === o.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-2/70 hover:text-foreground",
              missing && "opacity-50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
