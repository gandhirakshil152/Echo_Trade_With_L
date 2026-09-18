import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getMarketQuotes, type Quote } from "@/lib/quotes.functions";
import { ALL_STOCKS, INDIAN_INDICES, POPULAR_INDIAN_STOCKS } from "@/lib/stocks";

export { POPULAR_INDIAN_STOCKS, ALL_STOCKS, INDIAN_INDICES };
/** Kept for compatibility with the original voice-command hook import. */
export const POPULAR_US_STOCKS: typeof POPULAR_INDIAN_STOCKS = [];

export interface LiveQuote extends Quote {
  name: string;
  exchange: string;
  sector: string;
}

const seed = (): Record<string, Quote> => {
  const out: Record<string, Quote> = {};
  for (const s of [...ALL_STOCKS, ...INDIAN_INDICES.map((i) => ({ symbol: i.symbol, base: i.base }))]) {
    out[s.symbol] = {
      symbol: s.symbol,
      price: s.base,
      prevClose: s.base,
      change: 0,
      changePercent: 0,
      live: false,
    };
  }
  return out;
};

export const useStockData = () => {
  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["market-quotes"],
    queryFn: () => getMarketQuotes(),
    // Real exchange polling — refresh every 10s, including while the tab is idle.
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });

  const [tape, setTape] = useState<Record<string, Quote>>(seed);

  useEffect(() => {
    if (!data) return;
    setTape((prev) => {
      const next = { ...prev };
      for (const q of [...data.stocks, ...data.indices]) next[q.symbol] = q;
      return next;
    });
  }, [data]);

  // No simulated ticks: prices only move when a fresh exchange quote arrives.



  const stocks = useMemo<LiveQuote[]>(
    () =>
      ALL_STOCKS.map((s) => ({
        ...(tape[s.symbol] ?? { symbol: s.symbol, price: s.base, prevClose: s.base, change: 0, changePercent: 0, live: false }),
        name: s.name,
        exchange: s.exchange,
        sector: s.sector,
      })),
    [tape],
  );

  const indices = useMemo(
    () =>
      INDIAN_INDICES.map((i) => ({
        ...(tape[i.symbol] ?? { symbol: i.symbol, price: i.base, prevClose: i.base, change: 0, changePercent: 0, live: false }),
        name: i.name,
      })),
    [tape],
  );

  const priceOf = (symbol: string) =>
    tape[symbol.toUpperCase()]?.price ?? ALL_STOCKS.find((s) => s.symbol === symbol.toUpperCase())?.base ?? 0;

  return {
    stocks,
    indices,
    priceOf,
    isLoading,
    isFetching,
    updatedAt: data?.fetchedAt ? new Date(data.fetchedAt) : dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    isLiveFeed: !!data?.stocks.some((s) => s.live),
  };
};
