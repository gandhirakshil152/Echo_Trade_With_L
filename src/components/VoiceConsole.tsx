import { Mic, MicOff, Sparkles, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface VoiceLogEntry {
  id: string;
  heard: string;
  reply: string;
  ok: boolean;
}

const EXAMPLES = [
  "Buy 10 shares of Reliance on Zerodha",
  "Sell 5 TCS at 3200",
  "Invest 50000 rupees in Infosys",
  "Price of HDFC Bank",
  "Add Titan to watchlist",
  "Show my portfolio",
  "Funds in Upstox",
  "Top gainers",
];

export function VoiceConsole({
  supported,
  isListening,
  transcript,
  log,
  onToggle,
}: {
  supported: boolean;
  isListening: boolean;
  transcript: string;
  log: VoiceLogEntry[];
  onToggle: () => void;
}) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggle}
          disabled={!supported}
          aria-label={isListening ? "Stop listening" : "Start voice command"}
          className={`relative flex size-14 shrink-0 sm:size-16 items-center justify-center rounded-full border transition-colors ${
            isListening
              ? "listening-pulse border-primary bg-primary/20 text-primary"
              : "border-border bg-surface-2 text-foreground hover:border-primary/60"
          } disabled:opacity-40`}
        >
          {isListening ? <Mic className="size-7" /> : <MicOff className="size-7" />}
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="font-display flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-primary" /> Voice command desk
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {!supported
              ? "Voice recognition isn't supported in this browser — use Chrome or Edge. Manual trading still works."
              : isListening
                ? "Listening… speak your order."
                : "Tap the mic and speak. Orders always ask which broker and require your PIN."}
          </p>
          <p className="num mt-2 min-h-6 text-sm text-primary">{transcript}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {EXAMPLES.map((e) => (
          <span
            key={e}
            className="rounded-full border border-border/70 bg-surface-2/60 px-2.5 py-1 text-[11px] text-muted-foreground"
          >
            {e}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-background/50">
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Terminal className="size-3.5" /> command log
        </div>
        <ScrollArea className="h-40">
          <div className="space-y-2 p-3">
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground">No commands yet.</p>
            ) : (
              log.map((entry) => (
                <div key={entry.id} className="num text-xs leading-relaxed">
                  <span className="text-muted-foreground">&gt; {entry.heard}</span>
                  <br />
                  <span className={entry.ok ? "text-bull" : "text-bear"}>{entry.reply}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {!supported ? null : (
        <Button variant="secondary" className="mt-3 w-full sm:hidden" onClick={onToggle}>
          {isListening ? "Stop" : "Speak a command"}
        </Button>
      )}
    </section>
  );
}
