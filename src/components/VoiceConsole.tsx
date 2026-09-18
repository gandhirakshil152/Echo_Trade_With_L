import { Globe, Mic, MicOff, Sparkles, Terminal, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VoiceLanguage } from "@/hooks/useVoiceCommands";

export interface VoiceLogEntry {
  id: string;
  heard: string;
  reply: string;
  ok: boolean;
}

const EXAMPLES: Record<VoiceLanguage, string[]> = {
  "en-IN": [
    "Buy 10 shares of Reliance on Zerodha",
    "Sell 5 TCS at 3200",
    "Reliance 10 buy",             // Sequence-independent example
    "Invest 50000 rupees in Infosys",
    "Price of HDFC Bank",
    "Add Titan to watchlist",
    "Show my portfolio",
    "Funds in Upstox",
    "Top gainers",
    "Chart of Airtel",
    "News on SBI",
    "Top losers",
  ],
  "hi-IN": [
    "दस रिलायंस खरीदो",
    "TCS की पांच शेयर बेचो",
    "रिलायंस खरीद दस",             // Sequence-independent
    "इन्फोसिस में पचास हज़ार रुपये लगाओ",
    "HDFC बैंक की कीमत बताओ",
    "टाइटन को वॉचलिस्ट में जोड़ो",
    "मेरा पोर्टफोलियो दिखाओ",
    "जेरोधा के फंड बताओ",
    "टॉप गेनर्स",
    "एयरटेल का चार्ट दिखाओ",
    "SBI की खबर",
    "टॉप लूजर्स",
  ],
  "gu-IN": [
    "દસ રિલાયન્સ ખરીદો",
    "TCS ની પાંચ શેર વેચો",
    "રિલાયન્સ ખરીદ દસ",            // Sequence-independent
    "ઇન્ફોસિસ માં પચાસ હજાર રૂ. લગાવો",
    "HDFC બૅન્ક નો ભાવ",
    "ટાઈટન ને વૉચલિસ્ટ માં ઉમેરો",
    "મારો પોર્ટફોલિઓ દેખાડો",
    "ઝેરોધા ના ભંડોળ",
    "ટૉપ ગેઇનર",
    "એરટેલ નો ચાર્ટ",
    "SBI ના સમાચાર",
    "ટૉપ લૂઝ",
  ],
};

const LANG_LABELS: Record<VoiceLanguage, string> = {
  "en-IN": "EN",
  "hi-IN": "हिं",
  "gu-IN": "ગુ",
};

const LANG_HINT: Record<VoiceLanguage, string> = {
  "en-IN": "English",
  "hi-IN": "हिंदी",
  "gu-IN": "ગુજરાતી",
};

const LANG_TIPS: Record<VoiceLanguage, string> = {
  "en-IN": "Say it in any order: 'Reliance buy 10' or 'buy 10 Reliance' both work!",
  "hi-IN": "किसी भी क्रम में बोलें: 'रिलायंस दस खरीदो' या 'खरीदो दस रिलायंस' — दोनों काम करेंगे!",
  "gu-IN": "કોઈ પણ ક્રમમાં બોલો: 'રિલાયન્સ દસ ખરીદો' અથવા 'ખરીદો દસ રિલાયન્સ' — બંને ચાલે!",
};

export function VoiceConsole({
  supported,
  isListening,
  transcript,
  log,
  onToggle,
  language,
  onLanguageChange,
}: {
  supported: boolean;
  isListening: boolean;
  transcript: string;
  log: VoiceLogEntry[];
  onToggle: () => void;
  language: VoiceLanguage;
  onLanguageChange: (lang: VoiceLanguage) => void;
}) {
  const examples = EXAMPLES[language];
  const tip = LANG_TIPS[language];

  return (
    <section className="panel p-4 sm:p-5">
      {/* ── Mic + header ── */}
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggle}
          disabled={!supported}
          aria-label={isListening ? "Stop listening" : "Start voice command"}
          className={`relative flex size-14 shrink-0 sm:size-16 items-center justify-center rounded-full border transition-all ${
            isListening
              ? "listening-pulse border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary)/0.4)]"
              : "border-border bg-surface-2 text-foreground hover:border-primary/60 hover:shadow-[0_0_12px_rgba(var(--primary)/0.2)]"
          } disabled:opacity-40`}
        >
          {isListening ? <Mic className="size-7 animate-pulse" /> : <MicOff className="size-7" />}
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="font-display flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-primary" /> Voice Command Desk
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {!supported
              ? "Voice recognition isn't supported — use Chrome or Edge."
              : isListening
                ? `🎙️ Listening in ${LANG_HINT[language]}… speak your order.`
                : "Tap the mic and speak. Orders always ask which broker and require your PIN."}
          </p>
          {/* Live transcript */}
          <p className={`num mt-2 min-h-6 text-sm transition-colors ${isListening ? "text-primary" : "text-muted-foreground"}`}>
            {transcript || (isListening ? "…" : "")}
          </p>
        </div>
      </div>

      {/* ── Language selector ── */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <Globe className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Language
        </span>
        <div className="flex gap-1.5">
          {(["en-IN", "hi-IN", "gu-IN"] as VoiceLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              disabled={isListening}
              className={`rounded-full px-3 py-0.5 text-[12px] font-bold transition-all border ${
                language === lang
                  ? "border-primary bg-primary/20 text-primary shadow-[0_0_8px_rgba(var(--primary)/0.3)]"
                  : "border-border bg-surface-2/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              } disabled:opacity-50`}
              aria-pressed={language === lang}
              aria-label={`Switch to ${LANG_HINT[lang]}`}
            >
              {LANG_LABELS[lang]}
            </button>
          ))}
        </div>
        <span className="ml-1 text-[11px] text-muted-foreground">{LANG_HINT[language]}</span>
      </div>

      {/* ── Sequence-independence tip ── */}
      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-primary/5 border border-primary/15 px-2.5 py-1.5">
        <Zap className="size-3 shrink-0 text-primary mt-0.5" />
        <span className="text-[11px] text-muted-foreground leading-tight">{tip}</span>
      </div>

      {/* ── Example chips ── */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {examples.map((e) => (
          <span
            key={e}
            className="rounded-full border border-border/70 bg-surface-2/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-default"
          >
            {e}
          </span>
        ))}
      </div>

      {/* ── Command log ── */}
      <div className="mt-4 rounded-lg border border-border/70 bg-background/50">
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <Terminal className="size-3.5" /> command log
          {log.length > 0 && (
            <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
              {log.length}
            </span>
          )}
        </div>
        <ScrollArea className="h-40">
          <div className="space-y-2 p-3">
            {log.length === 0 ? (
              <p className="text-xs text-muted-foreground">No commands yet. Tap the mic to begin.</p>
            ) : (
              log.map((entry) => (
                <div key={entry.id} className="num text-xs leading-relaxed">
                  <span className="text-muted-foreground">&gt; {entry.heard}</span>
                  <br />
                  <span className={entry.ok ? "text-bull" : "text-bear"}>
                    {entry.ok ? "✓" : "✗"} {entry.reply}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {!supported ? null : (
        <Button variant="secondary" className="mt-3 w-full sm:hidden" onClick={onToggle}>
          {isListening ? "⏹ Stop Listening" : "🎙 Speak a Command"}
        </Button>
      )}
    </section>
  );
}
