/**
 * useCommandPredictor — Gemini-powered intent engine for voice commands.
 *
 * Triggers on:
 *  - action === "unknown"        (rule-based parser completely failed)
 *  - confidence < LOW_CONF_THRESHOLD  (rule-based is uncertain)
 *
 * Supports English, Hindi (Devanagari + transliterated) and Gujarati
 * (Gujarat script + transliterated) natively via the system prompt.
 *
 * Falls back silently to the rule-based result if API is unavailable.
 */

import type { VoiceCommandResult } from "@/hooks/useVoiceCommands";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/** Fire Gemini when rule-based confidence is below this threshold */
export const LOW_CONF_THRESHOLD = 0.65;

/** Valid actions the predictor can return */
const VALID_ACTIONS = new Set([
  "buy", "sell", "search", "chart", "news", "fundamentals", "technicals",
  "portfolio", "watchlist", "add_watchlist", "remove_watchlist",
  "history", "brokers", "funds", "add_funds", "gainers", "losers",
  "confirm", "cancel", "help", "logout", "select_broker", "filter_broker", "pin",
]);

// ─── Comprehensive NSE/BSE symbol lookup embedded in the prompt ───────────────
// This prevents Gemini from hallucinating symbols.
const SYMBOL_TABLE = `
NSE/BSE SYMBOL LOOKUP (use ONLY these symbols — never invent others):
RELIANCE=Reliance Industries / रिलायंस / ril / mukesh ambani
TCS=Tata Consultancy Services / टीसीएस / tata consulting / tata consultancy
HDFCBANK=HDFC Bank / एचडीएफसी बैंक / hdfc / hdfc bank
INFY=Infosys / इन्फोसिस / infosys / infy / infosis
ICICIBANK=ICICI Bank / आईसीआईसीआई बैंक / icici
SBIN=State Bank of India / एसबीआई / sbi / state bank
BHARTIARTL=Bharti Airtel / एयरटेल / airtel / bharti airtel
ITC=ITC Limited / आईटीसी / itc
LT=Larsen & Toubro / एलटी / larsen / l and t
TATAMOTORS=Tata Motors / टाटा मोटर्स / tata motors
MARUTI=Maruti Suzuki / मारुति / suzuki / maruti suzuki
AXISBANK=Axis Bank / एक्सिस बैंक / axis bank
WIPRO=Wipro / विप्रो / wipro
HINDUNILVR=Hindustan Unilever / हिंदुस्तान / hul / unilever
SUNPHARMA=Sun Pharma / सन फार्मा / sun pharma / sun pharmaceutical
ADANIENT=Adani Enterprises / अडानी / adani / adani enterprises
TATASTEEL=Tata Steel / टाटा स्टील / tata steel
ZOMATO=Zomato / जोमैटो / zomato / eternal
BAJFINANCE=Bajaj Finance / बजाज फाइनेंस / bajaj finance / bajaj
ONGC=ONGC / ओएनजीसी / oil and gas / ongc
COALINDIA=Coal India / कोल इंडिया / coal india / coal
POWERGRID=Power Grid / पावर ग्रिड / power grid / powergrid
NTPC=NTPC / एनटीपीसी / ntpc
IRCTC=IRCTC / रेलवे / railway / indian railway / irctc
DMART=DMart / डीमार्ट / dmart / avenue
TITAN=Titan / टाइटन / titan
KOTAKBANK=Kotak Bank / कोटक / kotak / kotak mahindra
HCLTECH=HCL Tech / एचसीएल / hcl / hcl tech / hcl technologies
TECHM=Tech Mahindra / टेक महिंद्रा / tech mahindra
DRREDDY=Dr Reddy / डॉ रेड्डी / dr reddy / dr reddys
CIPLA=Cipla / सिप्ला / cipla
M&M=Mahindra / महिंद्रा / mahindra / m and m
BAJAJ-AUTO=Bajaj Auto / बजाज ऑटो / bajaj auto
HEROMOTOCO=Hero MotoCorp / हीरो / hero / hero motocorp
EICHERMOT=Eicher / रॉयल एनफील्ड / royal enfield / eicher motors
ULTRACEMCO=UltraTech Cement / अल्ट्राटेक / ultratech cement
DLF=DLF / डीएलएफ / dlf
NYKAA=Nykaa / न्यका / nykaa
PAYTM=Paytm / पेटीएम / paytm / one97
INDUSINDBK=IndusInd Bank / इंडसइंड / indusind / indusind bank
BAJAJFINSV=Bajaj Finserv / बजाज फिनसर्व / bajaj finserv / finserv
PNB=Punjab National Bank / पीएनबी / pnb / punjab national
BANKBARODA=Bank of Baroda / बैंक ऑफ बड़ौदा / bank of baroda / baroda / bob
HAL=HAL / हिंदुस्तान एरोनॉटिक्स / hal / hindustan aeronautics
BEL=Bharat Electronics / भारत इलेक्ट्रॉनिक्स / bel / bharat electronics
INTERGLOBE=IndiGo / इंडिगो / indigo / interglobe
ASIANPAINT=Asian Paints / एशियन पेंट्स / asian paints / asian
APOLLOHOSP=Apollo Hospitals / अपोलो / apollo / apollo hospitals
PIDILITIND=Pidilite / पिडिलाइट / pidilite / fevicol
NESTLEIND=Nestle / नेस्ले / nestle / nestle india
BRITANNIA=Britannia / ब्रिटानिया / britannia
DABUR=Dabur / डाबर / dabur
GODREJCP=Godrej / गोदरेज / godrej / godrej consumer
COLPAL=Colgate / कोलगेट / colgate / palmolive
TATAPOWER=Tata Power / टाटा पावर / tata power
IOC=Indian Oil / इंडियन ऑयल / ioc / indian oil
BPCL=BPCL / भारत पेट्रोलियम / bpcl / bharat petroleum
HPCL=HPCL / हिंदुस्तान पेट्रोलियम / hpcl / hindustan petroleum
GAIL=GAIL / गेल / gail / gas authority
HINDALCO=Hindalco / हिंडाल्को / hindalco
JSWSTEEL=JSW Steel / जेएसडब्ल्यू स्टील / jsw steel / jsw
VEDL=Vedanta / वेदांता / vedanta
SAIL=SAIL / सेल / sail / steel authority
TATACONSUM=Tata Consumer / टाटा कंज्यूमर / tata consumer / tata tea
TRENT=Trent / ट्रेंट / westside / trent
IDEA=Vodafone Idea / वोडाफोन / vi / vodafone idea / idea
ADANIGREEN=Adani Green / अडानी ग्रीन / adani green
ADANIPORTS=Adani Ports / अडानी पोर्ट्स / adani ports
ZEEL=Zee Entertainment / ज़ी / zee / zee tv
SUNTV=Sun TV / सन टीवी / sun tv
LUPIN=Lupin / लुपिन / lupin
DIVISLAB=Divi's Labs / डिविज / divis / divi
AUROPHARMA=Aurobindo Pharma / ऑरोबिंदो / aurobindo
IRFC=IRFC / आईआरएफसी / irfc / railway finance
RVNL=RVNL / रेल विकास / rvnl / rail vikas
MARICO=Marico / मैरिको / marico
UPL=UPL / यूपीएल / upl / united phosphorus
IGL=Indraprastha Gas / इंद्रप्रस्थ गैस / igl / indraprastha gas
MGL=Mahanagar Gas / महानगर गैस / mgl / mahanagar gas
PETRONET=Petronet LNG / पेट्रोनेट / petronet
RECLTD=REC Limited / आरईसी / rec / rec limited
PFC=Power Finance Corp / पीएफसी / pfc / power finance
MUTHOOTFIN=Muthoot Finance / मुथूट / muthoot / muthoot finance
LICHSGFIN=LIC Housing / एलआईसी हाउसिंग / lic housing
BIOCON=Biocon / बायोकॉन / biocon
OFSS=Oracle Financial / ओएफएसएस / oracle financial / ofss
FORTIS=Fortis Healthcare / फोर्टिस / fortis
MAXHEALTH=Max Healthcare / मैक्स हेल्थकेयर / max health / max healthcare
SPICEJET=SpiceJet / स्पाइसजेट / spicejet / spice jet
INDHOTEL=Indian Hotels Taj / ताज / taj / taj hotels / indian hotels
ABB=ABB India / एबीबी / abb / abb india
SIEMENS=Siemens / सीमेंस / siemens
HAVELLS=Havells / हैवेल्स / havells
POLYCAB=Polycab / पॉलीकैब / polycab
ANGELONE=Angel One / एंजेल वन / angel one / angel broking
NAUKRI=Naukri / नौकरी / naukri / info edge
DELHIVERY=Delhivery / दिल्लीवरी / delhivery
PVRL=PVR INOX / पीवीआर / pvr / inox / pvr inox
PAGEIND=Page Industries Jockey / पेज इंडस्ट्रीज / jockey / page industries
RAYMOND=Raymond / रेमंड / raymond
BATA=Bata / बाटा / bata / bata india
SRF=SRF / एसआरएफ / srf
PIIND=PI Industries / पीआई / pi industries
COROMANDEL=Coromandel / कोरोमंडल / coromandel
GLAND=Gland Pharma / ग्लैंड / gland pharma / gland
STARHEALTH=Star Health / स्टार हेल्थ / star health
AUBANK=AU Bank / एयू बैंक / au bank / au small finance
BAJAJHFL=Bajaj Housing Finance / बजाज हाउसिंग / bajaj housing
`.trim();

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert voice command parser for an Indian stock market terminal (NSE/BSE).
You understand English, Hindi (Devanagari script AND transliterated Roman), and Gujarati (Gujarat script AND transliterated Roman).
The user speaks in mixed language — e.g. "TCS ke 5 shares kharido" or "Reliance no chart" or "HDFC Bank na shares vecho".

TASK: Parse the voice command and return ONLY a JSON object, nothing else.

JSON schema (all fields optional except action):
{
  "action": one of [buy,sell,search,chart,news,fundamentals,technicals,portfolio,watchlist,add_watchlist,remove_watchlist,history,brokers,funds,add_funds,gainers,losers,confirm,cancel,help,logout],
  "symbol": NSE/BSE ticker symbol string or null,
  "quantity": integer or null,
  "amountInr": number (rupees) or null,
  "limitPrice": number or null,
  "exchange": "NSE" or "BSE" or null
}

${SYMBOL_TABLE}

PARSING RULES:
1. IGNORE script/word-class words entirely — they never form part of a symbol:
   शेयर, शेअर, स्टॉक, scrip, script, shares, share, stock, stocks, equities,
   शेर, sher, shair, unit, units, lot, lots,
   ની, ના, નો, નું, ની, का, के, की, को, ने, में, पर, से, लो, दो,
   ni, na, no, nu, ka, ke, ki, ko, ne, ma, se, par

2. ACTION WORDS — identify action from these keywords (do NOT include them in symbol):
   BUY: खरीदो, खरीद, ख़रीदो, kharido, kharid, khareedo, ley lo, ley, lo, lena, buy, purchase, invest, lagao, lagav
   SELL: बेचो, बेच, becho, bech, vecho, vech, sell, exit, square off
   CHART: चार्ट, chart, ग्राफ, graph, candal, candle, কैंडल, कैंडल
   NEWS: समाचार, खबर, news, samachar, khabar, न्यूज़
   FUNDAMENTALS: फंडामेंटल, fundamental, बुनियादी
   TECHNICALS: तकनीकी, technical, technicals
   PORTFOLIO: पोर्टफोलियो, portfolio, holdings, होल्डिंग
   WATCHLIST: वॉचलिस्ट, watchlist
   SEARCH/PRICE: कीमत, भाव, price, ltp, quote, show, dikhao, batao, search, check

3. AMOUNT DETECTION:
   "ek lakh" = 100000, "paanch hazar" = 5000, "das hazar" = 10000
   "ek lakh pachas hazar" = 150000
   "barah" = 12, "paanch" = 5, "das" = 10, "bis" = 20, "pachas" = 50
   "ek" = 1, "do" = 2, "teen" = 3, "char" = 4, "paanch" = 5
   "chhe" = 6, "saat" = 7, "aath" = 8, "nau" = 9

4. RUPEES CONTEXT — if "rupees", "rupee", "rupe", "rs", "₹", "inr", "रुपये", "रूपए", "રૂ", "paise" present → use amountInr
   Otherwise if number < 1000 → quantity; if number >= 1000 without rupee context → amountInr

5. SYMBOL EXTRACTION — after stripping action words and filler words, the remaining meaningful words are the stock name.
   Map them to the closest symbol from the SYMBOL LOOKUP table above.
   If unsure, return symbol=null (never invent a symbol not in the table).

EXAMPLES (cover all three languages):
"buy 10 Reliance"                    → {"action":"buy","symbol":"RELIANCE","quantity":10}
"Sell 5 TCS at 3200"                 → {"action":"sell","symbol":"TCS","quantity":5,"limitPrice":3200}
"Invest 50000 rupees in Infosys"     → {"action":"buy","symbol":"INFY","amountInr":50000}
"Price of HDFC Bank"                 → {"action":"search","symbol":"HDFCBANK"}
"Chart of Airtel"                    → {"action":"chart","symbol":"BHARTIARTL"}
"Airtel ka chart dikhao"             → {"action":"chart","symbol":"BHARTIARTL"}
"Top gainers"                        → {"action":"gainers"}
"Show my portfolio"                  → {"action":"portfolio"}
"दस रिलायंस खरीदो"                   → {"action":"buy","symbol":"RELIANCE","quantity":10}
"TCS की पांच शेयर बेचो"               → {"action":"sell","symbol":"TCS","quantity":5}
"इन्फोसिस में पचास हज़ार रुपये लगाओ"   → {"action":"buy","symbol":"INFY","amountInr":50000}
"HDFC बैंक की कीमत बताओ"             → {"action":"search","symbol":"HDFCBANK"}
"टाइटन को वॉचलिस्ट में जोड़ो"          → {"action":"add_watchlist","symbol":"TITAN"}
"एयरटेल का चार्ट दिखाओ"              → {"action":"chart","symbol":"BHARTIARTL"}
"SBI की खबर"                        → {"action":"news","symbol":"SBIN"}
"TCS ना 5 share vecho"              → {"action":"sell","symbol":"TCS","quantity":5}
"Reliance no chart"                  → {"action":"chart","symbol":"RELIANCE"}
"ઇન્ફોસિસ માં 50000 રૂ. લગાવો"        → {"action":"buy","symbol":"INFY","amountInr":50000}
"HDFC Bank na shares vecho"          → {"action":"sell","symbol":"HDFCBANK"}
"Airtel no chart dekhado"            → {"action":"chart","symbol":"BHARTIARTL"}
"das Reliance kharido"               → {"action":"buy","symbol":"RELIANCE","quantity":10}
"paanch TCS shares becho NSE par"    → {"action":"sell","symbol":"TCS","quantity":5,"exchange":"NSE"}
"Titan watchlist ma umero"           → {"action":"add_watchlist","symbol":"TITAN"}
"maro portfolio dekhado"             → {"action":"portfolio"}
"top gainers dikhao"                 → {"action":"gainers"}
"zerodha ma funds"                   → {"action":"funds"}
"haan" / "ha" / "haa" / "yes" / "confirm" / "ok" → {"action":"confirm"}
"nahi" / "naa" / "no" / "cancel" / "bandh" → {"action":"cancel"}
"madad" / "help" → {"action":"help"}
"logout" / "baahar niklo" / "sign out" → {"action":"logout"}

CRITICAL: Return ONLY the JSON object. No explanation, no markdown, no extra text.
If truly unable to determine action, return {"action":"unknown"}.`;

// ─── API call ─────────────────────────────────────────────────────────────────

let pendingPrediction: Promise<VoiceCommandResult | null> | null = null;

/**
 * Make a single Gemini API call and parse the JSON response.
 * Returns null on any failure (network, quota, parse error).
 */
async function geminiPredict(transcript: string): Promise<VoiceCommandResult | null> {
  if (!GEMINI_KEY) return null;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: transcript }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,         // Maximum determinism
      maxOutputTokens: 512,
    },
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000), // 5s timeout
    });
    if (!res.ok) {
      console.warn("[Gemini] HTTP", res.status, res.statusText);
      return null;
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Strip any markdown fences Gemini might add despite responseMimeType
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/g, "").trim();

    const parsed = JSON.parse(cleaned) as {
      action?: string;
      symbol?: string | null;
      quantity?: number | null;
      amountInr?: number | null;
      limitPrice?: number | null;
      exchange?: string | null;
    };

    const action = (parsed.action ?? "unknown") as VoiceCommandResult["action"];
    if (!VALID_ACTIONS.has(action)) return null;

    // Validate symbol — must be uppercase alphanumeric+&/- only
    const rawSymbol = parsed.symbol?.trim().toUpperCase() ?? undefined;
    const symbol = rawSymbol && /^[A-Z0-9&\-]+$/.test(rawSymbol) ? rawSymbol : undefined;

    return {
      command: transcript,
      action,
      symbol,
      quantity: typeof parsed.quantity === "number" && parsed.quantity > 0
        ? Math.floor(parsed.quantity)
        : undefined,
      amountInr: typeof parsed.amountInr === "number" && parsed.amountInr > 0
        ? parsed.amountInr
        : undefined,
      limitPrice: typeof parsed.limitPrice === "number" && parsed.limitPrice > 0
        ? parsed.limitPrice
        : undefined,
      exchange: (parsed.exchange as "NSE" | "BSE" | undefined) ?? undefined,
      suggestion: `${action} ${symbol ?? ""}`.trim(),
      confidence: 0.92, // Gemini prediction carries high confidence
    };
  } catch (err) {
    console.warn("[Gemini] Predict error:", err);
    return null;
  }
}

/**
 * Standalone Gemini upgrade function — can be called outside of hook context.
 * Returns the Gemini result if it's better than the rule-based fallback,
 * otherwise returns the fallback. Safe to call from event handlers.
 */
export async function geminiUpgrade(
  transcript: string,
  fallback: VoiceCommandResult | null,
): Promise<VoiceCommandResult | null> {
  try {
    const result = await geminiPredict(transcript);
    if (result && result.action !== "unknown") return result;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Hook that exposes a `predict(transcript, fallback)` function.
 * Call this when the rule-based parser returns action === "unknown"
 * or when confidence < LOW_CONF_THRESHOLD.
 */
export const useCommandPredictor = () => {
  const predict = async (
    transcript: string,
    fallback?: VoiceCommandResult | null,
  ): Promise<VoiceCommandResult | null> => {
    // Deduplicate concurrent identical calls
    if (pendingPrediction) return pendingPrediction;
    pendingPrediction = geminiPredict(transcript)
      .then((geminiResult) => geminiResult ?? fallback ?? null)
      .finally(() => {
        pendingPrediction = null;
      });
    return pendingPrediction;
  };

  return { predict, hasGemini: !!GEMINI_KEY };
};
