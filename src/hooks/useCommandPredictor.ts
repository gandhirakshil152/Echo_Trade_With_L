/**
 * useCommandPredictor — Gemini-powered intent fallback for voice commands.
 *
 * If VITE_GEMINI_API_KEY is set, ambiguous voice commands (action === "unknown")
 * are sent to Gemini 2.0 Flash for prediction. Falls back silently to rule-based
 * if the API key is missing or the request fails.
 */

import { useCallback } from "react";

import type { VoiceCommandResult } from "@/hooks/useVoiceCommands";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/** Valid actions the predictor can return */
const VALID_ACTIONS = new Set([
  "buy","sell","search","chart","news","fundamentals","technicals",
  "portfolio","watchlist","add_watchlist","remove_watchlist",
  "history","brokers","funds","add_funds","gainers","losers",
  "confirm","cancel","help","logout","select_broker","filter_broker","pin",
]);

const SYSTEM_PROMPT = `You are a voice command parser for an Indian stock market trading terminal.
The user's spoken text has been transcribed. Extract the intent and parameters.
Return ONLY valid JSON, nothing else.

JSON schema:
{
  "action": one of [buy,sell,search,chart,news,fundamentals,technicals,portfolio,watchlist,add_watchlist,remove_watchlist,history,brokers,funds,add_funds,gainers,losers,confirm,cancel,help,logout],
  "symbol": NSE/BSE ticker symbol string or null,
  "quantity": integer or null,
  "amountInr": number (rupees) or null,
  "limitPrice": number or null,
  "exchange": "NSE" or "BSE" or null
}

Rules:
- For "buy fifty thousand rupees of Reliance" → action=buy, amountInr=50000, symbol=RELIANCE
- For "Airtel chart dikhao" → action=chart, symbol=BHARTIARTL
- For "TCS ka fundamental batao" → action=fundamentals, symbol=TCS
- NSE symbol for Reliance=RELIANCE, TCS=TCS, HDFC Bank=HDFCBANK, Infosys=INFY, Airtel=BHARTIARTL
- For number words: "barah" = 12, "paanch hazar" = 5000, "ek lakh" = 100000
- If action is unclear, return action=unknown`;

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
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4_000), // 4s timeout so we don't block UX
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text) as {
      action?: string;
      symbol?: string | null;
      quantity?: number | null;
      amountInr?: number | null;
      limitPrice?: number | null;
      exchange?: string | null;
    };

    const action = (parsed.action ?? "unknown") as VoiceCommandResult["action"];
    if (!VALID_ACTIONS.has(action)) return null;

    return {
      command: transcript,
      action,
      symbol: parsed.symbol ?? undefined,
      quantity: parsed.quantity ?? undefined,
      amountInr: parsed.amountInr ?? undefined,
      limitPrice: parsed.limitPrice ?? undefined,
      exchange: (parsed.exchange as "NSE" | "BSE" | undefined) ?? undefined,
      suggestion: `${action} ${parsed.symbol ?? ""}`.trim(),
      confidence: 0.88,
    };
  } catch {
    return null;
  }
}

/**
 * Hook that exposes a `predict(transcript)` function.
 * Call this when the rule-based parser returns action === "unknown".
 */
export const useCommandPredictor = () => {
  const predict = useCallback(
    async (transcript: string): Promise<VoiceCommandResult | null> => {
      // Deduplicate concurrent calls with the same transcript
      if (pendingPrediction) return pendingPrediction;
      pendingPrediction = geminiPredict(transcript).finally(() => {
        pendingPrediction = null;
      });
      return pendingPrediction;
    },
    [],
  );

  return { predict, hasGemini: !!GEMINI_KEY };
};
