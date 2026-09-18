import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface InstrumentHit {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  sector: string;
  price: number;
  changePercent: number;
  live: boolean;
}

/** Count of every equity listed on NSE and BSE right now. */
export const getUniverseStats = createServerFn({ method: "GET" }).handler(async () => {
  const { universe } = await import("./instruments.server");
  const { list } = await universe();
  return {
    total: list.length,
    nse: list.filter((i) => i.exchange === "NSE").length,
    bse: list.filter((i) => i.exchange === "BSE").length,
  };
});

/** Search the complete NSE + BSE listed universe, with live prices for the top hits. */
export const searchListedStocks = createServerFn({ method: "GET" })
  .inputValidator((input: { query: string }) =>
    z.object({ query: z.string().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ results: InstrumentHit[] }> => {
    const { searchUniverse, livePrices } = await import("./instruments.server");
    const hits = await searchUniverse(data.query, 10);
    const quotes = await livePrices(hits.map((h) => ({ symbol: h.symbol, exchange: h.exchange })));
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
    return {
      results: hits.map((h) => {
        const q = bySymbol.get(h.symbol);
        return {
          symbol: h.symbol,
          name: h.name,
          exchange: q?.exchange ?? h.exchange,
          sector: h.sector,
          price: q?.price ?? 0,
          changePercent: q?.changePercent ?? 0,
          live: !!q,
        };
      }),
    };
  });

/** Live quote for any listed symbol, including scrips outside the tracked tape. */
export const getListedQuote = createServerFn({ method: "GET" })
  .inputValidator((input: { symbol: string }) =>
    z.object({ symbol: z.string().min(1).max(24) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { resolveInstrument, livePrice } = await import("./instruments.server");
    const symbol = data.symbol.toUpperCase();
    const [meta, quote] = await Promise.all([resolveInstrument(symbol), livePrice(symbol)]);
    if (!quote) return null;
    return {
      symbol,
      name: meta?.name ?? symbol,
      exchange: quote.exchange,
      sector: meta?.sector ?? "Listed equity",
      price: quote.price,
      prevClose: quote.prevClose,
      change: quote.change,
      changePercent: quote.changePercent,
      live: quote.live,
    };
  });
