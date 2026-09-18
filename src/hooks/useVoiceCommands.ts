import { useCallback, useEffect, useRef, useState } from "react";

import { POPULAR_INDIAN_STOCKS, POPULAR_US_STOCKS } from "@/hooks/useStockData";
import type { BrokerId } from "@/lib/stocks";

export type VoiceAction =
  | "search"
  | "buy"
  | "sell"
  | "portfolio"
  | "watchlist"
  | "add_watchlist"
  | "remove_watchlist"
  | "history"
  | "brokers"
  | "select_broker"
  | "filter_broker"
  | "funds"
  | "add_funds"
  | "chart"
  | "news"
  | "fundamentals"
  | "technicals"
  | "gainers"
  | "losers"
  | "confirm"
  | "cancel"
  | "pin"
  | "admin"
  | "logout"
  | "help"
  | "unknown";

export interface VoiceCommandResult {
  command: string;
  action: VoiceAction;
  symbol?: string | undefined;
  quantity?: number | undefined;
  amountInr?: number | undefined;
  limitPrice?: number | undefined;
  exchange?: "NSE" | "BSE" | undefined;
  broker?: BrokerId | undefined;
  pin?: string | undefined;
  /** Which view a broker filter applies to. */
  target?: "portfolio" | "orders" | "watchlist" | "funds" | "brokers" | undefined;
  /** true when the user asked to clear the broker filter ("all brokers"). */
  clearFilter?: boolean | undefined;
  suggestion?: string | undefined;
}

// Word -> number map (0-100 + common Indian multipliers)
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, tree: 3,
  four: 4, for: 4, fore: 4, five: 5, six: 6, sex: 6, seven: 7, eight: 8, ate: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100, thousand: 1000, lakh: 100000,
  lac: 100000, lakhs: 100000, crore: 10000000, crores: 10000000,
};

const wordsToNumbers = (text: string): string => {
  const tokens = text.split(/\s+/);
  const out: string[] = [];
  let current = 0;
  let hasNumber = false;
  const flush = () => {
    if (hasNumber) out.push(String(current));
    current = 0;
    hasNumber = false;
  };
  for (const raw of tokens) {
    const t = raw.toLowerCase().replace(/[^a-z0-9.]/g, "");
    if (t in NUMBER_WORDS) {
      const n = NUMBER_WORDS[t]!;
      if (n >= 100) current = (current || 1) * n;
      else current += n;
      hasNumber = true;
    } else {
      flush();
      out.push(raw);
    }
  }
  flush();
  return out.join(" ");
};

const normalizeText = (text: string): string => {
  let t = " " + text.toLowerCase() + " ";
  const replacements: Array<[RegExp, string]> = [
    [/\bcell\b/g, "sell"], [/\bsel\b/g, "sell"], [/\bsale\b/g, "sell"], [/\bsells\b/g, "sell"],
    [/\bexit\b/g, "sell"], [/\bsquare\s*off\b/g, "sell"],
    [/\bbye\b/g, "buy"], [/\bby\b/g, "buy"], [/\bboy\b/g, "buy"], [/\bbuys\b/g, "buy"],
    [/\bshair(s)?\b/g, "share"], [/\bshear(s)?\b/g, "share"], [/\bqty\b/g, "quantity"],
    [/\brupee(s)?\b/g, "rupees"], [/\brupies\b/g, "rupees"], [/\bruppes\b/g, "rupees"],
    [/\bwatch\s*list\b/g, "watchlist"], [/\bport\s*folio\b/g, "portfolio"],
    [/\bzeroda\b/g, "zerodha"], [/\bzerodah\b/g, "zerodha"], [/\bkite\b/g, "zerodha"],
    [/\bup\s*stocks?\b/g, "upstox"], [/\bupstocks\b/g, "upstox"], [/\bupstox\b/g, "upstox"],
    [/\bangel\s*(one|1|won)\b/g, "angelone"], [/\bangle\s*(one|1)\b/g, "angelone"],
    [/\bn\s*s\s*e\b/g, "nse"], [/\bb\s*s\s*e\b/g, "bse"],
    [/\bpin\s*code\b/g, "pin"], [/\bp\s*i\s*n\b/g, "pin"],
    [/\bmy\s+money\b/g, "funds"], [/\bbalance\b/g, "funds"], [/\bmargin\b/g, "funds"],
  ];
  for (const [re, val] of replacements) t = t.replace(re, val);
  return wordsToNumbers(t).replace(/\s+/g, " ").trim();
};

const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array<number>(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j - 1]!, dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return dp[m]![n]!;
};

const ALL = [...POPULAR_INDIAN_STOCKS, ...POPULAR_US_STOCKS];

/** Words that are never part of a script name. */
const FILLER =
  /\b(share|shares|stock|stocks|scrip|script|equity|the|a|an|of|in|on|at|for|from|please|kindly|me|my|some|limited|ltd|company|co|nse|bse|zerodha|upstox|angelone|angel|broker|account|market|price|quantity|rupees|worth|order|buy|sell|invest|all)\b/g;

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Crude phonetic key so "infosis"/"infosys" and "airtell"/"airtel" collapse. */
const phonetic = (s: string) =>
  squash(s)
    .replace(/ph/g, "f")
    .replace(/(?:ck|kh|q)/g, "k")
    .replace(/(?:sh|ch)/g, "s")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/w/g, "b")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1")
    .replace(/[aeiou]/g, "");

/** 0..1 similarity from edit distance. */
const sim = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length);
};

interface Candidate {
  symbol: string;
  score: number;
}

/** Score one cleaned phrase against the whole NSE/BSE universe. */
const scorePhrase = (phrase: string): Candidate => {
  const q = squash(phrase);
  const qp = phonetic(phrase);
  let best: Candidate = { symbol: "", score: 0 };
  if (!q) return best;

  for (const s of ALL) {
    const targets = [s.symbol, s.name, ...(s.aliases ?? [])];
    let score = 0;
    for (const t of targets) {
      const ts = squash(t);
      if (!ts) continue;
      if (ts === q) score = Math.max(score, 1);
      else if (ts.startsWith(q) && q.length >= 3) score = Math.max(score, 0.95);
      else if (q.startsWith(ts) && ts.length >= 3) score = Math.max(score, 0.92);
      else if (ts.includes(q) && q.length >= 4) score = Math.max(score, 0.88);
      else if (q.includes(ts) && ts.length >= 4) score = Math.max(score, 0.86);
      score = Math.max(score, sim(q, ts) * 0.9);
      score = Math.max(score, sim(qp, phonetic(t)) * 0.85);
      // Name word-level match: "tata consultancy" -> TCS
      const words = t.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 1 && words.some((w) => squash(w) === q)) score = Math.max(score, 0.9);
    }
    if (score > best.score) best = { symbol: s.symbol, score };
  }
  return best;
};

/**
 * Extracts the most likely NSE/BSE script from a spoken phrase by scoring every
 * word window against symbols, company names and aliases (with a phonetic pass
 * so mis-heard names like "infosis" or "tata motor" still resolve).
 */
const bestSymbolMatch = (raw: string): string => {
  const cleaned = ` ${raw.toLowerCase()} `.replace(FILLER, " ").replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
  const tokens = cleaned.split(" ").filter(Boolean);
  if (!tokens.length) return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  let best: Candidate = { symbol: "", score: 0 };
  for (let size = Math.min(4, tokens.length); size >= 1; size--) {
    for (let i = 0; i + size <= tokens.length; i++) {
      const phrase = tokens.slice(i, i + size).join(" ");
      const cand = scorePhrase(phrase);
      // Prefer longer phrase matches on a tie.
      if (cand.score > best.score + 0.02) best = cand;
    }
  }
  if (best.symbol && best.score >= 0.62) return best.symbol;
  return cleaned.toUpperCase().replace(/[^A-Z0-9]/g, "");
};

export const matchScript = bestSymbolMatch;

const detectBroker = (text: string): BrokerId | undefined => {
  if (/\bzerodha\b/.test(text)) return "zerodha";
  if (/\bupstox\b/.test(text)) return "upstox";
  if (/\bangelone\b|\bangel\b/.test(text)) return "angel_one";
  return undefined;
};

const detectExchange = (text: string): "NSE" | "BSE" | undefined => {
  if (/\bnse\b/.test(text)) return "NSE";
  if (/\bbse\b/.test(text)) return "BSE";
  return undefined;
};

export const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognitionAPI);
    if (SpeechRecognitionAPI) {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 6;
      rec.lang = "en-IN";
      recognitionRef.current = rec;

    }
    return () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  const parseCommand = useCallback((text: string): VoiceCommandResult => {
    const normalized = normalizeText(text);
    const broker = detectBroker(normalized);
    const exchange = detectExchange(normalized);

    // 1. Trades: "buy 10 shares of reliance at 1420 on zerodha"
    const tradeRe =
      /\b(buy|sell)\b\s+(all|\d+(?:\.\d+)?)\s*(?:shares?|quantity)?\s*(?:of\s+)?([a-z0-9 ]{2,24}?)(?:\s+(?:at|for|@)\s+(?:rupees\s+)?(\d+(?:\.\d+)?))?(?:\s+(?:on|from|using|through|via)\s+[a-z]+)?\s*(?:nse|bse)?\s*$/i;
    const m = normalized.match(tradeRe);
    if (m) {
      const action = m[1]!.toLowerCase() as "buy" | "sell";
      const qtyToken = m[2]!;
      const quantity = qtyToken === "all" ? -1 : Math.max(1, Math.floor(parseFloat(qtyToken)));
      const symbol = bestSymbolMatch(m[3]!.replace(/\b(nse|bse|zerodha|upstox|angelone|angel)\b/g, "").trim());
      const limitPrice = m[4] ? parseFloat(m[4]) : undefined;
      return {
        command: text, action, quantity, symbol, limitPrice, exchange, broker,
        suggestion: `${action} ${quantity === -1 ? "all" : quantity} ${symbol}${limitPrice ? ` at ₹${limitPrice}` : " at market"}`,
      };
    }

    // 2. Amount based trades: "invest 50000 rupees in tcs"
    const amountRe = /\b(buy|sell|invest)\b\s+(?:rupees\s+)?(\d+(?:\.\d+)?)\s*(?:rupees)?\s+(?:worth\s+)?(?:of|in|into)\s+([a-z0-9 ]{2,24})/i;
    const am = normalized.match(amountRe);
    if (am) {
      const action = (am[1] === "sell" ? "sell" : "buy") as "buy" | "sell";
      const amountInr = parseFloat(am[2]!);
      const symbol = bestSymbolMatch(am[3]!.replace(/\b(nse|bse|zerodha|upstox|angelone|angel)\b/g, "").trim());
      return {
        command: text, action, symbol, amountInr, exchange, broker,
        suggestion: `${action} ₹${amountInr} of ${symbol}`,
      };
    }

    // 2b. Broker-scoped views: "show zerodha portfolio", "upstox funds", "all brokers orders"
    const viewRe = /\b(portfolio|holdings|positions|order book|orders|history|trades|watchlist|funds)\b/;
    const viewHit = normalized.match(viewRe);
    const wantsAll = /\ball\s+(brokers?|accounts?)\b|\ball\b\s*$/.test(normalized) && !!viewHit;
    if (viewHit && (broker || wantsAll) && !/\b(buy|sell|invest)\b/.test(normalized)) {
      const word = viewHit[1]!;
      const target: NonNullable<VoiceCommandResult["target"]> =
        /portfolio|holdings|positions/.test(word)
          ? "portfolio"
          : /watchlist/.test(word)
            ? "watchlist"
            : /funds/.test(word)
              ? "funds"
              : "orders";
      return {
        command: text,
        action: "filter_broker",
        broker,
        target,
        clearFilter: !broker && wantsAll,
        suggestion: `${broker ? broker : "all brokers"} ${target}`,
      };
    }

    // 3. Broker selection / verification
    if (broker && /\b(broker|account|use|select|switch|place|order|connect|choose|with)\b/.test(normalized)) {
      return { command: text, action: "select_broker", broker, suggestion: `use ${broker}` };
    }
    const pinMatch = normalized.match(/\bpin\b\s*(?:is\s*)?(\d{4,6})/);
    if (pinMatch) return { command: text, action: "pin", pin: pinMatch[1]!, suggestion: "verify account" };

    // 4. Watchlist management
    const addWatch = normalized.match(/\badd\s+([a-z0-9 ]{2,24}?)\s*(?:to\s+)?watchlist\b|\badd\s+(?:to\s+)?watchlist\s+([a-z0-9 ]{2,24})/);
    if (addWatch) {
      const symbol = bestSymbolMatch((addWatch[1] ?? addWatch[2] ?? "").trim());
      return { command: text, action: "add_watchlist", symbol, suggestion: `watch ${symbol}` };
    }
    const rmWatch = normalized.match(/\bremove\s+([a-z0-9 ]{2,24}?)\s*(?:from\s+)?watchlist\b/);
    if (rmWatch) {
      const symbol = bestSymbolMatch(rmWatch[1]!.trim());
      return { command: text, action: "remove_watchlist", symbol, suggestion: `unwatch ${symbol}` };
    }

    // 4b. Money in: "add funds to zerodha", "add 50000 to upstox", "top up angel one"
    if (/\b(add|top\s*up|deposit|load|recharge)\b[^a-z]*(funds|money|cash|balance|amount)?/.test(normalized) &&
        /\b(funds|money|cash|balance|deposit|top\s*up|recharge)\b/.test(normalized)) {
      return { command: text, action: "add_funds", broker, suggestion: "add funds" };
    }

    // 4c. Analysis surfaces: chart, news, fundamentals, technicals
    const analysisRe =
      /\b(chart|graph|candles?|news|headlines?|fundamental(?:s)?|financial(?:s)?|technical(?:s)?|result(?:s)?|indicator(?:s)?)\b/;
    const analysis = normalized.match(analysisRe);
    if (analysis && !/\b(buy|sell|invest)\b/.test(normalized)) {
      const word = analysis[1]!;
      const action = /chart|graph|candle/.test(word)
        ? ("chart" as const)
        : /news|headline|result/.test(word)
          ? ("news" as const)
          : /technical|indicator/.test(word)
            ? ("technicals" as const)
            : ("fundamentals" as const);
      const rest = normalized
        .replace(analysisRe, " ")
        .replace(/\b(open|show|display|give|get|of|for|the|me|please|latest|about|on)\b/g, " ")
        .trim();
      const symbol = rest ? bestSymbolMatch(rest) : undefined;
      return { command: text, action, symbol, suggestion: `${action} ${symbol ?? ""}`.trim() };
    }


    // 5. Navigation & info
    if (/\b(portfolio|my holdings|holdings|positions)\b/.test(normalized))
      return { command: text, action: "portfolio", suggestion: "open portfolio" };
    if (/\bwatchlist\b/.test(normalized))
      return { command: text, action: "watchlist", suggestion: "open watchlist" };
    if (/\b(history|order book|orders|trades)\b/.test(normalized))
      return { command: text, action: "history", suggestion: "open order book" };
    if (/\b(brokers?|accounts?)\b/.test(normalized))
      return { command: text, action: "brokers", suggestion: "open brokers" };
    if (/\bfunds\b/.test(normalized))
      return { command: text, action: "funds", broker, suggestion: "show funds" };
    if (/\b(top gainers|gainers|best performers)\b/.test(normalized))
      return { command: text, action: "gainers", suggestion: "top gainers" };
    if (/\b(top losers|losers|worst)\b/.test(normalized))
      return { command: text, action: "losers", suggestion: "top losers" };
    if (/\badmin\b/.test(normalized)) return { command: text, action: "admin", suggestion: "open admin" };
    if (/\b(log out|logout|sign out)\b/.test(normalized))
      return { command: text, action: "logout", suggestion: "sign out" };
    if (/\b(help|what can you do|commands)\b/.test(normalized))
      return { command: text, action: "help", suggestion: "help" };
    if (/^(yes|yeah|yep|confirm|ok|okay|place it|do it|proceed)\b/.test(normalized))
      return { command: text, action: "confirm", suggestion: "confirm" };
    if (/^(no|cancel|stop|abort|never mind|nevermind)\b/.test(normalized))
      return { command: text, action: "cancel", suggestion: "cancel" };

    // 6. Quotes
    const searchMatch = normalized.match(
      /(?:search|quote|show|open|price of|price for|what is the price of|ltp of|chart of)\s+([a-z0-9 ]{2,24})/,
    );
    if (searchMatch) {
      const symbol = bestSymbolMatch(searchMatch[1]!.replace(/\b(nse|bse|share|shares|stock)\b/g, "").trim());
      return { command: text, action: "search", symbol, exchange, suggestion: `search ${symbol}` };
    }

    const single = normalized.match(/^([a-z0-9 ]{2,24})$/);
    if (single) {
      const sym = bestSymbolMatch(single[1]!.trim());
      if (ALL.some((s) => s.symbol === sym)) {
        return { command: text, action: "search", symbol: sym, suggestion: `search ${sym}` };
      }
    }

    return { command: text, action: "unknown" };
  }, []);

  const startListening = useCallback(
    (onResult: (result: VoiceCommandResult) => void) => {
      const rec = recognitionRef.current;
      if (!rec) return;

      rec.onresult = (event: any) => {
        const result = event.results[event.resultIndex];
        const text = result[0].transcript as string;
        setTranscript(text);
        if (!result.isFinal) return;

        // Try every speech alternative and keep the first one that parses to a
        // real command — Indian script names are often mis-heard on attempt 1.
        const alternatives: string[] = [];
        for (let i = 0; i < result.length; i++) alternatives.push(result[i].transcript as string);
        let chosen = parseCommand(text);
        if (chosen.action === "unknown") {
          for (const alt of alternatives.slice(1)) {
            const parsed = parseCommand(alt);
            if (parsed.action !== "unknown") {
              chosen = parsed;
              setTranscript(alt);
              break;
            }
          }
        }
        onResult(chosen);
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      try {
        rec.start();
        setIsListening(true);
        setTranscript("");
      } catch {
        setIsListening(false);
      }
    },
    [parseCommand],
  );

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.lang = "en-IN";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }, []);

  return { isListening, transcript, supported, startListening, stopListening, speak, parseCommand };
};
