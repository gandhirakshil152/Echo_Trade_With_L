import { useCallback, useEffect, useRef, useState } from "react";

import { POPULAR_INDIAN_STOCKS } from "@/hooks/useStockData";
import type { BrokerId } from "@/lib/stocks";

export type VoiceLanguage = "en-IN" | "hi-IN" | "gu-IN";

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
  target?: "portfolio" | "orders" | "watchlist" | "funds" | "brokers" | undefined;
  clearFilter?: boolean | undefined;
  suggestion?: string | undefined;
  confidence?: number | undefined;
}

// ─── Number Words ─────────────────────────────────────────────────────────────

/**
 * English + Hindi (transliterated) + Gujarati (transliterated) → value
 * Covers ALL numbers needed to form 4-8 digit amounts.
 */
const NUMBER_WORDS: Record<string, number> = {
  // ── English ──
  zero: 0, oh: 0,
  one: 1, won: 1, wan: 1,
  two: 2, to: 2, too: 2, tu: 2,
  three: 3, tree: 3, thr: 3,
  four: 4, for: 4, fore: 4,
  five: 5,
  six: 6, sex: 6,
  seven: 7,
  eight: 8, ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  "twenty-one": 21, "twenty-two": 22, "twenty-three": 23, "twenty-four": 24,
  "twenty-five": 25, "twenty-six": 26, "twenty-seven": 27, "twenty-eight": 28, "twenty-nine": 29,
  thirty: 30,
  "thirty-one": 31, "thirty-two": 32, "thirty-three": 33, "thirty-four": 34,
  "thirty-five": 35, "thirty-six": 36, "thirty-seven": 37, "thirty-eight": 38, "thirty-nine": 39,
  forty: 40, fourty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1_000,
  lakh: 1_00_000, lac: 1_00_000, lakhs: 1_00_000, lacs: 1_00_000,
  crore: 1_00_00_000, crores: 1_00_00_000,
  // ── Hindi transliterated ──
  ek: 1, do: 2, teen: 3, char: 4, paanch: 5, panch: 5,
  chhe: 6, chh: 6, saat: 7, aath: 8, nau: 9, das: 10,
  gyarah: 11, barah: 12, terah: 13, chaudah: 14, pandrah: 15,
  solah: 16, satrah: 17, atharah: 18, unnis: 19,
  bees: 20, ikkees: 21, baees: 22, teis: 23, chaubees: 24, pachchees: 25,
  chhabbees: 26, sattaees: 27, atthaees: 28, untees: 29,
  tees: 30, iktees: 31, batees: 32, taitees: 33, chotees: 34, paintees: 35,
  chhattees: 36, saintees: 37, artees: 38, untalees: 39,
  chalis: 40, iktalis: 41, byalis: 42, tentalis: 43, chavalis: 44, paintalis: 45,
  chhiyalis: 46, saintalis: 47, artalis: 48, unchas: 49,
  pachas: 50, ikyawan: 51, baawan: 52, tirpan: 53, chauwan: 54, pachpan: 55,
  chhappan: 56, sattawan: 57, atthawan: 58, unsath: 59,
  saath: 60, iksath: 61, basath: 62, tirsath: 63, chausath: 64, painsath: 65,
  chhiyasath: 66, sadsath: 67, arsath: 68, unsattar: 69,
  sattar: 70, ikattar: 71, bahattar: 72, tihattar: 73, chauhattar: 74,
  pachhattar: 75, chhihattar: 76, sathattar: 77, athattar: 78, unchasi: 79,
  assi: 80, ikyasi: 81, bayasi: 82, tirasi: 83, chaurasi: 84, pachasi: 85,
  chhiyasi: 86, satasi: 87, athasi: 88, navasi: 89,
  nabbe: 90, ikyanabbe: 91, banabbe: 92, tiranabbe: 93, cauranabe: 94, pachanabbe: 95,
  chhiyanabbe: 96, sattanabbe: 97, athanabbe: 98, ninyanabbe: 99,
  sau: 100, hazaar: 1_000, hajar: 1_000,
  karor: 1_00_00_000, karod: 1_00_00_000,
  // ── Gujarati transliterated ──
  eka: 1, be: 2, tran: 3, pancha: 5,
  nav: 9, agiyar: 11, bar: 12, ter: 13, chaud: 14, pandhar: 15,
  sol: 16, athar: 18, ognis: 19, vis: 20,
  ekvis: 21, bavis: 22, travis: 23, chovis: 24, panchvis: 25,
  chhavis: 26, satvis: 27, athvis: 28, ogantris: 29,
  tris: 30, ekattris: 31, battris: 32, tetris: 33, choatris: 34, paintris: 35,
  chhattris: 36, saadtris: 37, adtris: 38, oganchalis: 39,
  chalees: 40, ekachalis: 41, bachalis: 42, tetrachalis: 43, chochalis: 44,
  panchalis: 50, sath: 60, ashi: 80, navvu: 90,
  so: 100, hazar: 1_000, lakh2: 1_00_000, karod2: 1_00_00_000,
};

/** Hindi Devanagari digits/multipliers */
const HINDI_NUM: Record<string, number> = {
  "शून्य": 0, "एक": 1, "दो": 2, "दोन": 2, "तीन": 3, "चार": 4,
  "पाँच": 5, "पांच": 5, "छह": 6, "छः": 6, "सात": 7, "आठ": 8,
  "नौ": 9, "दस": 10, "ग्यारह": 11, "बारह": 12, "तेरह": 13, "चौदह": 14,
  "पंद्रह": 15, "सोलह": 16, "सत्रह": 17, "अठारह": 18, "उन्नीस": 19,
  "बीस": 20, "इक्कीस": 21, "बाईस": 22, "तेईस": 23, "चौबीस": 24, "पच्चीस": 25,
  "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60,
  "सत्तर": 70, "अस्सी": 80, "नब्बे": 90, "सौ": 100,
  "हज़ार": 1_000, "हजार": 1_000, "लाख": 1_00_000, "करोड़": 1_00_00_000, "करोड": 1_00_00_000,
};

/** Gujarati digits/multipliers */
const GUJARATI_NUM: Record<string, number> = {
  "શૂન્ય": 0, "એક": 1, "બે": 2, "ત્રણ": 3, "ચાર": 4, "પાંચ": 5,
  "છ": 6, "સાત": 7, "આઠ": 8, "નવ": 9, "દસ": 10, "અગિયાર": 11,
  "બાર": 12, "તેર": 13, "ચૌદ": 14, "પંદર": 15, "સોળ": 16, "સત્તર": 17,
  "અઢાર": 18, "ઓગણીસ": 19, "વીસ": 20, "ત્રીસ": 30, "ચાળીસ": 40,
  "પચાસ": 50, "સાઠ": 60, "સિત્તેર": 70, "એંસી": 80, "નેવું": 90,
  "સો": 100, "હજાર": 1_000, "લાખ": 1_00_000, "કરોડ": 1_00_00_000,
};

/** Hindi Devanagari → English keyword map */
const HINDI_KEYWORDS: Record<string, string> = {
  "खरीदो": "buy", "खरीद": "buy", "ख़रीदो": "buy", "ख़रीद": "buy",
  "खरीदना": "buy", "खरीदें": "buy", "खरीदिए": "buy", "लो": "buy",
  "ले लो": "buy", "ले आओ": "buy", "ले": "buy", "खरीदी": "buy",
  "बेचो": "sell", "बेच": "sell", "बेचना": "sell", "बेचदो": "sell",
  "बेचें": "sell", "बेचिए": "sell", "बेच दो": "sell",
  "पोर्टफोलियो": "portfolio", "होल्डिंग्स": "portfolio", "होल्डिंग": "portfolio",
  "मेरा पोर्टफोलियो": "portfolio", "मेरी होल्डिंग": "portfolio",
  "वॉचलिस्ट": "watchlist", "देखो सूची": "watchlist", "निगरानी": "watchlist",
  "मेरी वॉचलिस्ट": "watchlist",
  "जोड़ो": "add", "जोड़": "add", "जोड़ दो": "add", "डालो": "add",
  "हटाओ": "remove", "हटा": "remove", "हटा दो": "remove", "निकालो": "remove",
  "फंड": "funds", "पैसे": "funds", "धन": "funds", "बैलेंस": "funds",
  "मेरे पैसे": "funds", "कितने पैसे": "funds",
  "चार्ट": "chart", "ग्राफ": "chart", "चार्ट दिखाओ": "chart", "कैंडल": "chart",
  "समाचार": "news", "खबर": "news", "हेडलाइन": "news", "न्यूज़": "news", "न्यूज": "news",
  "मूल तत्व": "fundamentals", "बुनियादी": "fundamentals", "फंडामेंटल": "fundamentals",
  "तकनीकी": "technicals", "टेक्निकल": "technicals", "तकनीकी विश्लेषण": "technicals",
  "मदद": "help", "सहायता": "help", "क्या कर सकते": "help",
  "रद्द": "cancel", "रोको": "cancel", "बंद करो": "cancel", "नहीं": "cancel",
  "हाँ": "confirm", "हां": "confirm", "ठीक है": "confirm", "ठीक": "confirm",
  "हो जाए": "confirm", "करो": "confirm", "ओके": "confirm",
  "इतिहास": "history", "ऑर्डर बुक": "history", "ऑर्डर": "history",
  "दलाल": "brokers", "ब्रोकर": "brokers",
  "लॉगआउट": "logout", "साइन आउट": "logout", "बाहर निकलो": "logout",
  "टॉप गेनर्स": "top gainers", "सबसे ऊपर": "top gainers", "गेनर": "gainers",
  "टॉप लूजर्स": "top losers", "लूजर": "losers", "गिरावट": "losers",
  "एनएसई": "nse", "बीएसई": "bse",
  "जेरोधा": "zerodha", "ज़ेरोधा": "zerodha",
  "अपस्टॉक्स": "upstox", "अपस्टॉक": "upstox",
  "एंजेल वन": "angelone", "एंजेल": "angelone",
  "शेयर": "shares", "शेअर": "shares", "स्टॉक": "stock",
  "दिखाओ": "show", "देखो": "show", "खोलो": "open",
  "की": "", "का": "", "के": "", "में": "in", "पर": "at", "से": "from",
  "को": "", "ने": "", "मेरे": "my", "मेरी": "my", "मेरा": "my",
  "रुपये": "rupees", "रुपए": "rupees", "रूपए": "rupees", "रूपये": "rupees",
  "कीमत": "price", "भाव": "price", "प्राइस": "price",
  "लगाओ": "invest", "निवेश": "invest", "निवेश करो": "invest",
  "कितनी": "", "कितना": "",
  "वर्थ": "worth",
};

/** Gujarati script → English keyword map */
const GUJARATI_KEYWORDS: Record<string, string> = {
  "ખરીદો": "buy", "ખરીદ": "buy", "ખરીદવું": "buy", "ખરીદ કરો": "buy",
  "ખરીદી કરો": "buy", "લો": "buy", "ખરીદી": "buy",
  "વેચો": "sell", "વેચ": "sell", "વેચવું": "sell", "વેચ દો": "sell",
  "વેચી નાખો": "sell",
  "પોર્ટફોલિઓ": "portfolio", "હોલ્ડિંગ": "portfolio", "મારો પોર્ટફોલિઓ": "portfolio",
  "વૉચલિસ્ટ": "watchlist", "વૉચ લિસ્ટ": "watchlist", "મારી વૉચ": "watchlist",
  "જોડો": "add", "ઉમેરો": "add", "ઉમેર": "add",
  "દૂર કરો": "remove", "કાઢો": "remove", "હટાવો": "remove",
  "ભંડોળ": "funds", "પૈસા": "funds", "બૅલેન્સ": "funds", "ફંડ": "funds",
  "ચાર્ટ": "chart", "ગ્રાફ": "chart", "કૅન્ડ": "chart",
  "સમાચાર": "news", "ખબર": "news", "ન્યૂઝ": "news",
  "મૂળ": "fundamentals", "ફંડામેન્ટલ": "fundamentals",
  "ટેક્નિકલ": "technicals",
  "મદદ": "help", "સહાય": "help",
  "રદ": "cancel", "બંધ": "cancel", "ના": "cancel",
  "હા": "confirm", "ઠીક": "confirm", "ઓકે": "confirm",
  "ઇતિહાસ": "history", "ઓર્ડર": "history",
  "બ્રોકર": "brokers",
  "લૉગ આઉટ": "logout", "બહાર નીકળો": "logout",
  "ટોપ ગેઇનર": "top gainers", "ગેઇનર": "gainers",
  "ટૉપ લૂઝ": "top losers", "લૂઝ": "losers",
  "એનએસઈ": "nse", "બીએસઈ": "bse",
  "ઝેરોધા": "zerodha", "અપ્સ્ટૉક્સ": "upstox", "એન્જેલ": "angelone",
  "શેર": "shares", "સ્ટૉક": "stock",
  "દેખાડો": "show", "ખોલો": "open",
  "ની": "", "નો": "", "નુ": "", "માં": "in", "પર": "at", "થી": "from",
  "રૂ": "rupees", "રૂપિયા": "rupees", "રૂ.": "rupees",
  "ભાવ": "price", "કિંમત": "price",
  "લગાવો": "invest", "રોકો": "invest",
  "મારો": "my", "મારી": "my", "મારું": "my",
  "વર્થ": "worth",
};

// ─── Normalization Helpers ─────────────────────────────────────────────────────

/** Safe regex escape for map keys that may contain regex special chars */
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceFromMap = (text: string, map: Record<string, string | number>): string => {
  let out = text;
  // Sort by length descending so multi-word phrases match before single words
  const sorted = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  for (const [word, val] of sorted) {
    try {
      out = out.replace(new RegExp(escapeRegex(word), "g"), ` ${String(val)} `);
    } catch { /* skip */ }
  }
  return out;
};

const normalizeHindiNumbers = (text: string): string => replaceFromMap(text, HINDI_NUM);
const normalizeGujaratiNumbers = (text: string): string => replaceFromMap(text, GUJARATI_NUM);
const translateHindi = (text: string): string => replaceFromMap(text, HINDI_KEYWORDS);
const translateGujarati = (text: string): string => replaceFromMap(text, GUJARATI_KEYWORDS);

/**
 * Converts English number words into numeric values.
 * Handles 4-8 digit numbers correctly via accumulator + multiplier chain.
 *
 * Examples:
 *  "twelve thousand five hundred" → "12500"
 *  "two lakh fifty thousand"      → "250000"
 *  "five crore"                   → "50000000"
 *  "fifty"                        → "50"
 */
const wordsToNumbers = (text: string): string => {
  const tokens = text.split(/\s+/);
  const out: string[] = [];

  let current = 0;   // running total for current group
  let sub = 0;       // sub-accumulator (below the current multiplier)
  let hasNumber = false;

  const flush = () => {
    if (hasNumber) {
      out.push(String(current + sub));
    }
    current = 0;
    sub = 0;
    hasNumber = false;
  };

  for (const raw of tokens) {
    const t = raw.toLowerCase().replace(/[^a-z0-9.]/g, "");

    // Digit string — treat as literal number
    if (/^\d+(\.\d+)?$/.test(t)) {
      flush();
      out.push(t);
      continue;
    }

    if (t in NUMBER_WORDS) {
      const n = NUMBER_WORDS[t]!;
      hasNumber = true;

      if (n >= 1_00_00_000) {
        // Crore-level multiplier
        const base = current + sub || 1;
        current = base * n;
        sub = 0;
      } else if (n >= 1_00_000) {
        // Lakh-level multiplier
        const base = sub || current || 1;
        current += base * n;
        sub = 0;
      } else if (n >= 1_000) {
        // Thousand-level multiplier
        const base = sub || 1;
        current += base * n;
        sub = 0;
      } else if (n === 100) {
        // Hundred multiplier: applies to sub (e.g. "five hundred" = 5*100)
        sub = (sub || 1) * 100;
      } else {
        // Plain digit 1-99: add to sub
        sub += n;
      }
    } else {
      flush();
      if (t) out.push(raw);
    }
  }
  flush();
  return out.join(" ");
};

/**
 * Full normalization pipeline:
 * Script → number words → English synonyms → cleaned text
 */
const normalizeText = (text: string): string => {
  let t = normalizeHindiNumbers(text);
  t = normalizeGujaratiNumbers(t);
  t = translateHindi(t);
  t = translateGujarati(t);
  t = " " + t.toLowerCase() + " ";

  const replacements: Array<[RegExp, string]> = [
    // Sell synonyms
    [/\bcell\b/g, "sell"], [/\bsel\b/g, "sell"], [/\bsale\b/g, "sell"],
    [/\bsells\b/g, "sell"], [/\bexit\b/g, "sell"], [/\bsquare\s*off\b/g, "sell"],
    [/\bclose\s*position\b/g, "sell"], [/\bsquare\b/g, "sell"],
    // Buy synonyms
    [/\bbye\b/g, "buy"], [/\bboy\b/g, "buy"], [/\bbuys\b/g, "buy"],
    [/\bpurchase\b/g, "buy"], [/\binvest\b/g, "buy"], [/\bget\b/g, "buy"],
    [/\bkharido\b/g, "buy"], [/\bkharid\b/g, "buy"], [/\bkhareed\b/g, "buy"],
    [/\bkhareedo\b/g, "buy"], [/\bkhareedna\b/g, "buy"], [/\bkharidi\b/g, "buy"],
    // Sell synonyms (transliterated)
    [/\bbecho\b/g, "sell"], [/\bbech\b/g, "sell"], [/\bbeecho\b/g, "sell"],
    [/\bvecho\b/g, "sell"], [/\bvech\b/g, "sell"], [/\bvechu\b/g, "sell"],
    // Share synonyms
    [/\bshair(s)?\b/g, "shares"], [/\bshear(s)?\b/g, "shares"],
    [/\bqty\b/g, "quantity"], [/\bsher(s)?\b/g, "shares"],
    [/\bunits?\b/g, "shares"],
    // Rupees
    [/\brupee(s)?\b/g, "rupees"], [/\brupies\b/g, "rupees"],
    [/\bruppes\b/g, "rupees"], [/\brupe(s)?\b/g, "rupees"],
    [/\binr\b/g, "rupees"], [/\b₹\b/g, "rupees"],
    [/\brs\.?\b/g, "rupees"],
    // Navigation views
    [/\bwatch\s*list\b/g, "watchlist"], [/\bport\s*folio\b/g, "portfolio"],
    [/\bholding(s)?\b/g, "portfolio"], [/\bposition(s)?\b/g, "portfolio"],
    [/\border\s*book\b/g, "history"], [/\btrade\s*history\b/g, "history"],
    // Brokers
    [/\bzeroda\b/g, "zerodha"], [/\bzerodah\b/g, "zerodha"],
    [/\bkite\b/g, "zerodha"], [/\bzerodha kite\b/g, "zerodha"],
    [/\bup\s*stocks?\b/g, "upstox"], [/\bupstocks\b/g, "upstox"],
    [/\bangle?\s*(one|1|won)?\b/g, "angelone"],
    [/\bangel\s*one\b/g, "angelone"], [/\bangel1\b/g, "angelone"],
    // Exchanges
    [/\bn\s*s\s*e\b/g, "nse"], [/\bb\s*s\s*e\b/g, "bse"],
    [/\bnational\s*stock\s*exchange\b/g, "nse"],
    [/\bbombay\s*stock\s*exchange\b/g, "bse"],
    // PIN
    [/\bpin\s*code\b/g, "pin"], [/\bp\s*i\s*n\b/g, "pin"],
    // Funds
    [/\bmy\s+money\b/g, "funds"], [/\bbalance\b/g, "funds"],
    [/\bmargin\b/g, "funds"], [/\bavailable\s+funds\b/g, "funds"],
    // Analysis
    [/\btechnical\s*analysis\b/g, "technicals"],
    [/\bfundamental\s*analysis\b/g, "fundamentals"],
    [/\bcandle(stick)?\b/g, "chart"], [/\bcandal\b/g, "chart"],
    [/\bfinancial(s)?\b/g, "fundamentals"],
    [/\bresult(s)?\b/g, "fundamentals"],
    [/\bindicator(s)?\b/g, "technicals"],
    // Confirm/cancel
    [/\byes\b/g, "confirm"], [/\byeah\b/g, "confirm"],
    [/\byep\b/g, "confirm"], [/\bok(ay)?\b/g, "confirm"],
    [/\bplace it\b/g, "confirm"], [/\bdo it\b/g, "confirm"],
    [/\bproceed\b/g, "confirm"], [/\bgo ahead\b/g, "confirm"],
    [/\bnope\b/g, "cancel"], [/\bnever mind\b/g, "cancel"],
    [/\babort\b/g, "cancel"], [/\bstop\b/g, "cancel"],
    // Hindi transliterated navigation/filler
    [/\bdikhao\b/g, "show"], [/\bdekho\b/g, "show"],
    [/\bkholo\b/g, "open"], [/\bkhol\b/g, "open"],
    [/\blaga\s*o\b/g, "invest"], [/\blagao\b/g, "invest"],
    [/\bumero\b/g, "add"], [/\bumerto\b/g, "add"],
    [/\bkaro\b/g, ""], [/\bkarna\b/g, ""], [/\bkarni\b/g, ""],
    [/\bwala\b/g, ""], [/\bwali\b/g, ""],
    [/\bki\b/g, ""], [/\bka\b/g, ""], [/\bke\b/g, ""],
    [/\bse\b/g, "from"], [/\bpar\b/g, "at"],
    [/\bmere\b/g, "my"], [/\bmera\b/g, "my"],
    // Gujarati transliterated filler
    [/\bno\b/g, ""], [/\bni\b/g, ""], [/\bnu\b/g, ""],
    [/\bma\b/g, "in"], [/\bne\b/g, ""],
    [/\bdekhado\b/g, "show"],
    // Generic English
    [/\bshow\b/g, "show"], [/\bopen\b/g, "open"],
    [/\bcheck\b/g, "search"], [/\bfind\b/g, "search"],
    [/\btell me\b/g, "search"], [/\bwhat is\b/g, "search"],
    [/\bquote\b/g, "search"], [/\bltp\b/g, "search"],
    [/\bprice of\b/g, "search"],
    // Worth context (for amount-based buys)
    [/\bworth\b/g, "worth"], [/\bke liye\b/g, "worth"],
  ];

  for (const [re, val] of replacements) t = t.replace(re, ` ${val} `);
  return wordsToNumbers(t).replace(/\s+/g, " ").trim();
};

// ─── Symbol Matching ──────────────────────────────────────────────────────────

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

const ALL = POPULAR_INDIAN_STOCKS;

const FILLER_RE =
  /\b(share|shares|stock|stocks|scrip|script|equity|the|a|an|of|in|on|at|for|from|please|kindly|me|my|some|limited|ltd|company|co|nse|bse|zerodha|upstox|angelone|angel|broker|account|market|price|quantity|rupees|worth|order|buy|sell|invest|all|show|open|chart|news|get|check|tell|search|quote|ltp|find|confirm|cancel|help|funds|watchlist|portfolio|history|gainers|losers|top|admin|logout)\b/g;

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Crude phonetic key so "infosis"/"infosys" and "airtell"/"airtel" collapse */
const phonetic = (s: string) =>
  squash(s)
    .replace(/ph/g, "f")
    .replace(/(?:ck|kh|q)/g, "k")
    .replace(/(?:sh|ch)/g, "s")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/w/g, "b")
    .replace(/y/g, "i")
    .replace(/(.)\\1+/g, "$1")
    .replace(/[aeiou]/g, "");

const sim = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length);
};

interface Candidate { symbol: string; score: number }

const scorePhrase = (phrase: string): Candidate => {
  const q = squash(phrase);
  const qp = phonetic(phrase);
  let best: Candidate = { symbol: "", score: 0 };
  if (!q || q.length < 2) return best;

  for (const s of ALL) {
    const targets = [s.symbol, s.name, ...(s.aliases ?? [])];
    let score = 0;
    for (const t of targets) {
      const ts = squash(t);
      if (!ts) continue;
      if (ts === q) { score = 1; break; }
      if (ts.startsWith(q) && q.length >= 3) score = Math.max(score, 0.95);
      else if (q.startsWith(ts) && ts.length >= 3) score = Math.max(score, 0.92);
      else if (ts.includes(q) && q.length >= 4) score = Math.max(score, 0.88);
      else if (q.includes(ts) && ts.length >= 4) score = Math.max(score, 0.86);
      score = Math.max(score, sim(q, ts) * 0.9);
      score = Math.max(score, sim(qp, phonetic(t)) * 0.85);
      // Name word-level match: "tata consultancy" → TCS
      const words = t.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 1 && words.some((w) => squash(w) === q)) score = Math.max(score, 0.9);
      // Alias exact match
      if (s.aliases?.some((a) => squash(a) === q)) score = Math.max(score, 0.97);
    }
    if (score > best.score) best = { symbol: s.symbol, score };
    if (best.score === 1) break;
  }
  return best;
};

/**
 * Extracts the most likely NSE/BSE symbol from a spoken phrase.
 * Works for English, Hindi, and Gujarati spoken names.
 */
const bestSymbolMatch = (raw: string): string => {
  const cleaned = ` ${raw.toLowerCase()} `
    .replace(FILLER_RE, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(" ").filter(Boolean);
  if (!tokens.length) return raw.toUpperCase().replace(/[^A-Z0-9&]/g, "");

  let best: Candidate = { symbol: "", score: 0 };
  for (let size = Math.min(5, tokens.length); size >= 1; size--) {
    for (let i = 0; i + size <= tokens.length; i++) {
      const phrase = tokens.slice(i, i + size).join(" ");
      const cand = scorePhrase(phrase);
      if (cand.score > best.score + 0.02) best = cand;
    }
  }
  if (best.symbol && best.score >= 0.50) return best.symbol;
  return cleaned.toUpperCase().replace(/[^A-Z0-9&]/g, "");
};

export const matchScript = bestSymbolMatch;

// ─── Keyword Extractors (Bag-of-Words) ────────────────────────────────────────

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

/** Extract ALL numbers from the normalized text. */
const extractNumbers = (text: string): number[] => {
  const matches = text.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  return matches.map(Number).filter((n) => !isNaN(n));
};

/** Detect the primary action from any position in the text. */
const detectAction = (text: string): VoiceAction | null => {
  // Trade actions (highest priority)
  if (/\bbuy\b/.test(text)) return "buy";
  if (/\bsell\b/.test(text)) return "sell";
  if (/\binvest\b/.test(text)) return "buy";
  // Watchlist CRUD (before generic watchlist)
  if (/\badd\b.*\bwatchlist\b|\bwatchlist\b.*\badd\b/.test(text)) return "add_watchlist";
  if (/\bremove\b.*\bwatchlist\b|\bwatchlist\b.*\bremove\b/.test(text)) return "remove_watchlist";
  // Fund management
  if (/\b(add|top\s*up|deposit|load|recharge)\b.*\b(funds|money|cash)\b|\b(funds|money)\b.*\b(add|deposit)\b/.test(text)) return "add_funds";
  // Analysis
  if (/\bchart\b|\bgraph\b/.test(text)) return "chart";
  if (/\bnews\b|\bheadline\b/.test(text)) return "news";
  if (/\btechnical\b|\btechnicals\b/.test(text)) return "technicals";
  if (/\bfundamental\b|\bfundamentals\b/.test(text)) return "fundamentals";
  // Navigation
  if (/\bportfolio\b|\bholding\b/.test(text)) return "portfolio";
  if (/\bwatchlist\b/.test(text)) return "watchlist";
  if (/\bhistory\b|\border\s*book\b|\borders\b/.test(text)) return "history";
  if (/\bbroker\b/.test(text)) return "brokers";
  if (/\bfunds\b/.test(text)) return "funds";
  if (/\bgainer\b|\bgain\b/.test(text)) return "gainers";
  if (/\bloser\b|\bloss\b/.test(text)) return "losers";
  if (/\badmin\b/.test(text)) return "admin";
  if (/\blog\s*out\b|\bsign\s*out\b/.test(text)) return "logout";
  if (/\bhelp\b/.test(text)) return "help";
  // Confirm/cancel
  if (/^(confirm|yes|yeah|yep|ok|okay|place it|do it|proceed|go ahead)\s*$/.test(text)) return "confirm";
  if (/^(no|cancel|stop|abort|never mind|nevermind)\s*$/.test(text)) return "cancel";
  // Search/price check
  if (/\bsearch\b|\bquote\b|\bshow\b|\bopen\b|\bprice\b|\bltp\b|\bcheck\b|\bfind\b/.test(text)) return "search";
  return null;
};

// ─── Confidence Scoring ───────────────────────────────────────────────────────

const confidence = (r: VoiceCommandResult): number => {
  if (r.action === "unknown") return 0;
  if (r.action === "buy" || r.action === "sell") return r.symbol ? 0.9 : 0.3;
  if (r.action === "search") return r.symbol ? 0.85 : 0.3;
  return 0.7;
};

// ─── Main Bag-of-Words Parser ──────────────────────────────────────────────────

const BROKER_FILLER = /\b(nse|bse|zerodha|upstox|angelone|angel|on|from|using|through|via|at|for)\b/g;

/**
 * Sequence-independent command parser.
 * Strategy:
 * 1. Normalize text (translate scripts, synonyms, number words)
 * 2. Detect action keyword(s) — from ANY position
 * 3. Extract numbers for quantity/price/amount — from ANY position
 * 4. Extract stock symbol from remaining non-keyword tokens
 * 5. Build result with appropriate fields
 */
const parseCommandInternal = (text: string): VoiceCommandResult => {
  const normalized = normalizeText(text);
  const broker = detectBroker(normalized);
  const exchange = detectExchange(normalized);
  const action = detectAction(normalized);
  const numbers = extractNumbers(normalized);

  // ── PIN detection (before action checks) ──────────────────────────────────
  const pinMatch = normalized.match(/\bpin\b\s*(?:is\s*)?(\d{4,6})/);
  if (pinMatch) return { command: text, action: "pin", pin: pinMatch[1]!, suggestion: "verify account" };

  // ── Confirm/cancel — pure keyword match ───────────────────────────────────
  if (/^(confirm|yes|yeah|yep|ok|okay|place it|do it|proceed|go ahead)\s*$/.test(normalized))
    return { command: text, action: "confirm", suggestion: "confirm" };
  if (/^(no|cancel|stop|abort|never mind|nevermind)\s*$/.test(normalized))
    return { command: text, action: "cancel", suggestion: "cancel" };

  if (action === "help" || /\b(help|what can you do|commands?)\b/.test(normalized))
    return { command: text, action: "help", suggestion: "help" };
  if (action === "logout")
    return { command: text, action: "logout", suggestion: "sign out" };
  if (action === "admin")
    return { command: text, action: "admin", suggestion: "open admin" };

  if (action === "gainers" || /\b(top gainers?|best performers?)\b/.test(normalized))
    return { command: text, action: "gainers", suggestion: "top gainers" };
  if (action === "losers" || /\b(top losers?|worst)\b/.test(normalized))
    return { command: text, action: "losers", suggestion: "top losers" };

  if (action === "add_funds")
    return { command: text, action: "add_funds", broker, suggestion: "add funds" };

  // ── Broker-scoped filter views ─────────────────────────────────────────────
  const viewHit = normalized.match(/\b(portfolio|holdings|positions|order\s*book|orders|history|trades|watchlist|funds)\b/);
  const wantsAll = /\ball\s+(brokers?|accounts?)|\\ball\b\s*$/.test(normalized) && !!viewHit;
  if (viewHit && (broker || wantsAll) && !/\b(buy|sell|invest|add|remove)\b/.test(normalized)) {
    const word = viewHit[1]!;
    const target: NonNullable<VoiceCommandResult["target"]> =
      /portfolio|holdings|positions/.test(word) ? "portfolio"
        : /watchlist/.test(word) ? "watchlist"
          : /funds/.test(word) ? "funds"
            : "orders";
    return {
      command: text, action: "filter_broker", broker, target,
      clearFilter: !broker && wantsAll,
      suggestion: `${broker ?? "all brokers"} ${target}`,
    };
  }

  if (broker && /\b(broker|account|use|select|switch|place|order|connect|choose|with|set)\b/.test(normalized))
    return { command: text, action: "select_broker", broker, suggestion: `use ${broker}` };

  // ── Navigation ─────────────────────────────────────────────────────────────
  if (action === "portfolio" && !["buy", "sell"].includes(action))
    return { command: text, action: "portfolio", suggestion: "open portfolio" };
  if (action === "watchlist" && !/\b(buy|sell|add|remove)\b/.test(normalized))
    return { command: text, action: "watchlist", suggestion: "open watchlist" };
  if (action === "history")
    return { command: text, action: "history", suggestion: "open order book" };
  if (action === "brokers")
    return { command: text, action: "brokers", suggestion: "open brokers" };
  if (action === "funds" && !/\b(buy|sell|add)\b/.test(normalized))
    return { command: text, action: "funds", broker, suggestion: "show funds" };

  // ── Watchlist CRUD ─────────────────────────────────────────────────────────
  if (action === "add_watchlist") {
    const rest = normalized.replace(/\b(add|to|watchlist)\b/g, " ").trim();
    const symbol = rest ? bestSymbolMatch(rest) : "";
    return { command: text, action: "add_watchlist", symbol: symbol || undefined, suggestion: `watch ${symbol}` };
  }
  if (action === "remove_watchlist") {
    const rest = normalized.replace(/\b(remove|from|watchlist)\b/g, " ").trim();
    const symbol = rest ? bestSymbolMatch(rest) : "";
    return { command: text, action: "remove_watchlist", symbol: symbol || undefined, suggestion: `unwatch ${symbol}` };
  }

  // ── Analysis surfaces ──────────────────────────────────────────────────────
  if (action === "chart" || action === "news" || action === "technicals" || action === "fundamentals") {
    const rest = normalized
      .replace(/\b(chart|graph|candle|news|headline|technical|technicals|fundamental|fundamentals|financial|result|indicator|open|show|display|give|get|of|for|the|me|please|latest|about|on|check)\b/g, " ")
      .trim();
    const symbol = rest ? bestSymbolMatch(rest) : undefined;
    return { command: text, action, symbol, suggestion: `${action} ${symbol ?? ""}`.trim() };
  }

  // ── TRADE PARSER (buy/sell) — completely sequence-independent ──────────────
  if (action === "buy" || action === "sell") {
    const stripped = normalized
      .replace(/\b(buy|sell|invest|shares?|stocks?|quantity|qty|rupees|worth|of|at|for|on|from|using|through|via|nse|bse|zerodha|upstox|angelone|angel|in|the|please|me|my)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const allNums = extractNumbers(normalized);

    const hasRupeesContext = /\brupees\b|\bworth\b/.test(normalized);
    const hasAtContext = /\bat\s+\d|\d\s+at\b/.test(normalized);

    let quantity: number | undefined;
    let limitPrice: number | undefined;
    let amountInr: number | undefined;

    if (allNums.length === 0) {
      quantity = 1;
    } else if (allNums.length === 1) {
      const n = allNums[0]!;
      if (hasRupeesContext) {
        // "buy fifty thousand rupees of TCS" → amountInr=50000
        amountInr = n;
      } else if (hasAtContext && n > 100) {
        quantity = 1;
        limitPrice = n;
      } else if (n < 1_000) {
        quantity = Math.max(1, Math.floor(n));
      } else {
        // Large number without rupees context: treat as amount
        amountInr = n;
      }
    } else if (allNums.length >= 2) {
      if (hasRupeesContext) {
        // largest is the amount
        amountInr = Math.max(...allNums);
      } else {
        const sorted = [...allNums].sort((a, b) => a - b);
        quantity = Math.max(1, Math.floor(sorted[0]!));
        if (sorted[1]! > 50) limitPrice = sorted[1];
      }
    }

    // "all" keyword → sell everything
    if (/\ball\b/.test(normalized)) quantity = -1;

    // Extract symbol from stripped text
    const symbolRaw = stripped.replace(/\d+(?:\.\d+)?/g, " ").trim();
    const symbol = symbolRaw ? bestSymbolMatch(symbolRaw.replace(BROKER_FILLER, "").trim()) : "";

    if (symbol) {
      const qDisplay = quantity === -1 ? "all" : String(quantity ?? "1");
      return {
        command: text, action, quantity, symbol, limitPrice, amountInr, exchange, broker,
        suggestion: amountInr
          ? `${action} ₹${amountInr} of ${symbol}`
          : `${action} ${qDisplay} ${symbol}${limitPrice ? ` at ₹${limitPrice}` : " at market"}`,
        confidence: 0.9,
      };
    }

    return {
      command: text, action, quantity, limitPrice, amountInr, exchange, broker,
      suggestion: `${action} — which stock?`,
      confidence: 0.4,
    };
  }

  // ── Search / price check ───────────────────────────────────────────────────
  if (action === "search") {
    const rest = normalized
      .replace(/\b(search|quote|show|open|price|ltp|chart|of|for|the|me|please|check|find|tell|what|is|latest|about)\b/g, " ")
      .replace(BROKER_FILLER, " ")
      .trim();
    const symbol = rest ? bestSymbolMatch(rest) : "";
    if (symbol) {
      return { command: text, action: "search", symbol, exchange, suggestion: `search ${symbol}` };
    }
  }

  // ── Pure symbol utterance (no other keywords) ──────────────────────────────
  const single = normalized.match(/^([a-z0-9& ]{2,28})$/);
  if (single) {
    const sym = bestSymbolMatch(single[1]!.trim());
    if (ALL.some((s) => s.symbol === sym)) {
      return { command: text, action: "search", symbol: sym, suggestion: `search ${sym}` };
    }
  }

  // ── Last resort: any token is a known symbol ───────────────────────────────
  const anySymbol = normalized
    .split(/\s+/)
    .map((w) => ALL.find((s) => s.symbol === w.toUpperCase()))
    .find(Boolean);
  if (anySymbol) {
    return { command: text, action: "search", symbol: anySymbol.symbol, suggestion: `search ${anySymbol.symbol}` };
  }

  return { command: text, action: "unknown" };
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const [language, setLanguageState] = useState<VoiceLanguage>("en-IN");
  const recognitionRef = useRef<any>(null);
  const langRef = useRef<VoiceLanguage>("en-IN");

  const createRecognition = useCallback((lang: VoiceLanguage) => {
    if (typeof window === "undefined") return null;
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;
    const rec = new SpeechRecognitionAPI();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 10;
    rec.lang = lang;
    return rec;
  }, []);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognitionAPI);
    if (SpeechRecognitionAPI) {
      recognitionRef.current = createRecognition(langRef.current);
    }
    return () => {
      try { recognitionRef.current?.abort?.(); } catch { /* noop */ }
    };
  }, [createRecognition]);

  const setLanguage = useCallback((lang: VoiceLanguage) => {
    langRef.current = lang;
    setLanguageState(lang);
    try { recognitionRef.current?.abort?.(); } catch { /* noop */ }
    recognitionRef.current = createRecognition(lang);
  }, [createRecognition]);

  const parseCommand = useCallback((text: string): VoiceCommandResult => {
    return parseCommandInternal(text);
  }, []);

  const startListening = useCallback(
    (onResult: (result: VoiceCommandResult) => void) => {
      try { recognitionRef.current?.abort?.(); } catch { /* noop */ }
      recognitionRef.current = createRecognition(langRef.current);
      const rec = recognitionRef.current;
      if (!rec) return;

      rec.onresult = (event: any) => {
        const result = event.results[event.resultIndex];
        const text = result[0].transcript as string;
        setTranscript(text);
        if (!result.isFinal) return;

        // Collect ALL alternatives
        const alternatives: string[] = [];
        for (let i = 0; i < result.length; i++) {
          alternatives.push(result[i].transcript as string);
        }

        // Score every alternative; pick highest confidence non-unknown result
        let bestResult = parseCommandInternal(text);
        let bestConf = confidence(bestResult);

        for (const alt of alternatives.slice(1)) {
          const parsed = parseCommandInternal(alt);
          const c = confidence(parsed);
          if (c > bestConf) {
            bestResult = parsed;
            bestConf = c;
            setTranscript(alt);
          }
          if (bestConf >= 0.85) break;
        }

        // If still unknown, try stripping non-ASCII (pure Devanagari/Gujarati fallback)
        if (bestResult.action === "unknown") {
          for (const alt of alternatives) {
            const stripped = alt.replace(/[^\x00-\x7F]/g, " ").replace(/\s+/g, " ").trim();
            if (stripped && stripped !== alt) {
              const parsed = parseCommandInternal(stripped);
              if (parsed.action !== "unknown") {
                bestResult = parsed;
                setTranscript(alt);
                break;
              }
            }
          }
        }

        // Also try combining first 3 alternatives' normalized text
        if (bestResult.action === "unknown" && alternatives.length > 1) {
          const combined = alternatives.slice(0, 3).join(" ");
          const parsed = parseCommandInternal(combined);
          if (parsed.action !== "unknown") bestResult = parsed;
        }

        onResult(bestResult);
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = (e: any) => {
        console.warn("[Voice] Recognition error:", e.error);
        setIsListening(false);
      };

      try {
        rec.start();
        setIsListening(true);
        setTranscript("");
      } catch {
        setIsListening(false);
      }
    },
    [createRecognition],
  );

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.pitch = 1;
    utterance.lang = langRef.current === "en-IN" ? "en-IN"
      : langRef.current === "hi-IN" ? "hi-IN" : "gu-IN";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }, []);

  return {
    isListening,
    transcript,
    supported,
    language,
    setLanguage,
    startListening,
    stopListening,
    speak,
    parseCommand,
  };
};
