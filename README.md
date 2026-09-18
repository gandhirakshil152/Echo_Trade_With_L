# Echo Trade Voice

according to this make one voice commmand trading 
import { useState, useCallback, useRef, useEffect } from 'react';
import { POPULAR_INDIAN_STOCKS, POPULAR_US_STOCKS } from '@/hooks/useStockData';

interface VoiceCommandResult {
  command: string;
  action: 'search' | 'buy' | 'sell' | 'portfolio' | 'watchlist' | 'history' | 'unknown';
  symbol?: string;
  quantity?: number;
  limitPrice?: number;
  suggestion?: string;
}

// Word -> number map (0-100 + common multipliers)
const NUMBER_WORDS: Record<string, number> = {
  zero: 0, oh: 0, one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, tree: 3,
  four: 4, for: 4, fore: 4, five: 5, six: 6, sex: 6, seven: 7, eight: 8, ate: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100, thousand: 1000, lakh: 100000, crore: 10000000,
};

// Convert phrases like "twenty five" or "one hundred" into digits inline.
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
    const t = raw.toLowerCase().replace(/[^a-z0-9.]/g, '');
    if (t in NUMBER_WORDS) {
      const n = NUMBER_WORDS[t];
      if (n === 100 || n === 1000 || n === 100000 || n === 10000000) {
        current = (current || 1) * n;
      } else {
        current += n;
      }
      hasNumber = true;
    } else {
      flush();
      out.push(raw);
    }
  }
  flush();
  return out.join(' ');
};

// Normalize common speech mis-recognitions
const normalizeText = (text: string): string => {
  let t = ' ' + text.toLowerCase() + ' ';
  const replacements: Array<[RegExp, string]> = [
    [/\bcell\b/g, 'sell'],
    [/\bsel\b/g, 'sell'],
    [/\bsale\b/g, 'sell'],
    [/\bsells\b/g, 'sell'],
    [/\bbye\b/g, 'buy'],
    [/\bby\b/g, 'buy'],
    [/\bboy\b/g, 'buy'],
    [/\bbuys\b/g, 'buy'],
    [/\bshair(s)?\b/g, 'share'],
    [/\bshear(s)?\b/g, 'share'],
    [/\brupee(s)?\b/g, 'rupees'],
    [/\brupies\b/g, 'rupees'],
    [/\bwatch\s*list\b/g, 'watchlist'],
    [/\bport\s*folio\b/g, 'portfolio'],
  ];
  for (const [re, val] of replacements) t = t.replace(re, val);
  return wordsToNumbers(t).replace(/\s+/g, ' ').trim();
};

// Levenshtein for fuzzy symbol/name match
const levenshtein = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
};

const ALL_STOCKS = [...POPULAR_INDIAN_STOCKS, ...POPULAR_US_STOCKS];

// Return best matching known symbol for a spoken token/phrase
const bestSymbolMatch = (raw: string): string => {
  if (!raw) return raw;
  const q = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!q) return raw.toUpperCase();
  // Exact
  const exact = ALL_STOCKS.find(s => s.symbol === q);
  if (exact) return exact.symbol;
  // Contains
  const contains = ALL_STOCKS.find(s => s.symbol.includes(q) || q.includes(s.symbol));
  if (contains) return contains.symbol;
  // Name word match
  const qLower = raw.toLowerCase();
  const byName = ALL_STOCKS.find(s => s.name.toLowerCase().split(/\s+/).some(w => w === qLower));
  if (byName) return byName.symbol;
  // Fuzzy on symbol
  let best = { sym: q, dist: Infinity };
  for (const s of ALL_STOCKS) {
    const d = levenshtein(q, s.symbol);
    if (d < best.dist) best = { sym: s.symbol, dist: d };
    const dn = levenshtein(qLower, s.name.toLowerCase());
    if (dn < best.dist) best = { sym: s.symbol, dist: dn };
  }
  // Accept fuzzy only if reasonably close
  if (best.dist <= Math.max(2, Math.floor(q.length / 2))) return best.sym;
  return q;
};

export const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognitionAPI);
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const parseCommand = useCallback((text: string): VoiceCommandResult => {
    const normalized = normalizeText(text);

    const tradeRe = /\b(buy|sell)\b\s+(\d+(?:\.\d+)?)\s+(?:shares?\s+(?:of\s+)?)?([a-z0-9]+)(?:\s+(?:at|for|@)\s+(\d+(?:\.\d+)?))?/i;
    const m = normalized.match(tradeRe);
    if (m) {
      const action = m[1].toLowerCase() as 'buy' | 'sell';
      const quantity = Math.max(1, Math.floor(parseFloat(m[2])));
      const symbol = bestSymbolMatch(m[3]);
      const limitPrice = m[4] ? parseFloat(m[4]) : undefined;
      return {
        command: text,
        action,
        quantity,
        symbol,
        limitPrice,
        suggestion: `${action} ${quantity} ${symbol}${limitPrice ? ` at ₹${limitPrice}` : ''}`,
      };
    }

    const searchMatch = normalized.match(/(?:search|quote|show|price\s+of|price\s+for|get\s+price\s+(?:of|for)?)\s+([a-z0-9]+)/i);
    if (searchMatch) {
      const symbol = bestSymbolMatch(searchMatch[1]);
      return { command: text, action: 'search', symbol, suggestion: `search ${symbol}` };
    }

    if (/\b(portfolio|my\s+holdings|holdings)\b/.test(normalized)) {
      return { command: text, action: 'portfolio', suggestion: 'open portfolio' };
    }
    if (/\bwatchlist\b/.test(normalized)) {
      return { command: text, action: 'watchlist', suggestion: 'open watchlist' };
    }
    if (/\b(history|trades)\b/.test(normalized)) {
      return { command: text, action: 'history', suggestion: 'open trade history' };
    }

    // Last-ditch: single spoken word that resembles a known symbol
    const singleToken = normalized.match(/^([a-z0-9]{2,})$/i);
    if (singleToken) {
      const sym = bestSymbolMatch(singleToken[1]);
      if (ALL_STOCKS.some(s => s.symbol === sym)) {
        return { command: text, action: 'search', symbol: sym, suggestion: `search ${sym}` };
      }
    }

    return { command: text, action: 'unknown' };
  }, []);

  const startListening = useCallback((onResult: (result: VoiceCommandResult) => void) => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      
      setTranscript(text);
      
      if (result.isFinal) {
        const parsed = parseCommand(text);
        onResult(parsed);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
    setTranscript('');
  }, [parseCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }, []);

  return {
    isListening,
    transcript,
    supported,
    startListening,
    stopListening,
    speak,
    parseCommand
  };
};

and also add 3 verious broker can be control with same persons accout by my tool and can make buy sell and improve more posiblity of voice command and also get indian apis 

make it like there is 3 diffrent type of borkers with same person's account connected with this tool and in order there will be something like ask me which broker you want to place order and there account verify first type something and this is indian app so make it as nse bse only and all funds in ruppes and make it perfect 

also make admin pannel with emailid:-gandhirakshil190@gmail.com
password:-Rakshil@123 who can see all the user and make everthng in trading app also by voice command and manual also use best futurastic design and also make best ui ux and name of website is echo trade

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://echo-trade-voice.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/81355976-f42e-4a47-a5c3-aef97d0f6bd0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
