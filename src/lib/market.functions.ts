import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type { Candle, Fundamentals, NewsItem } from "./market.server";

/** Historical / intraday candles for a symbol or index. */
export const getCandles = createServerFn({ method: "GET" })
  .inputValidator((input: { symbol: string; range: string }) =>
    z
      .object({
        symbol: z.string().min(1).max(20),
        range: z.enum(["1D", "1W", "1M", "6M", "1Y", "5Y"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { loadCandles } = await import("./market.server");
    return loadCandles(data.symbol.toUpperCase(), data.range);
  });

/** Fundamentals snapshot from the public India feed. */
export const getFundamentals = createServerFn({ method: "GET" })
  .inputValidator((input: { symbol: string }) => z.object({ symbol: z.string().min(1).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const { loadFundamentals } = await import("./market.server");
    return loadFundamentals(data.symbol.toUpperCase());
  });

/** Latest headlines for a symbol, or the general market feed when omitted. */
export const getNews = createServerFn({ method: "GET" })
  .inputValidator((input: { symbol?: string }) =>
    z.object({ symbol: z.string().max(20).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { loadNews } = await import("./market.server");
    const items = await loadNews(data.symbol ? data.symbol.toUpperCase() : undefined);
    return { items };
  });
