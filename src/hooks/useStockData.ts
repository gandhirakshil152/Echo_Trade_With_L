import { keepPreviousData, useQuery } from "@tanstack/react-query";
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

/** Returns true during NSE/BSE trading hours (Mon–Fri 09:15–15:30 IST) */
export const isMarketOpen = (): boolean => {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const ist = new Date(now.getTime() + (5.5 - now.getTimezoneOffset() / 60) * 3600_000);
  const day = ist.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const hm = ist.getHours() * 100 + ist.getMinutes();
  return hm >= 915 && hm <= 1530;
};

const seed = (): Record<string, Quote> => {
  const out: Record<string, Quote> = {};
  for (const s of [
    ...ALL_STOCKS,
    ...INDIAN_INDICES.map((i) => ({ symbol: i.symbol, base: i.base })),
  ]) {
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
  // Dynamic refresh interval: 5s during market hours, 30s otherwise
  const [refreshMs, setRefreshMs] = useState(() => (isMarketOpen() ? 5_000 : 30_000));

  useEffect(() => {
    // Re-evaluate every minute so the interval transitions at open/close
    const id = setInterval(() => setRefreshMs(isMarketOpen() ? 5_000 : 30_000), 60_000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["market-quotes"],
    queryFn: () => getMarketQuotes(),
    refetchInterval: refreshMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 4_000,
    // Keep previous data so UI never shows a loading blank state
    placeholderData: keepPreviousData,
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

  const stocks = useMemo<LiveQuote[]>(
    () =>
      ALL_STOCKS.map((s) => ({
        ...(tape[s.symbol] ?? {
          symbol: s.symbol,
          price: s.base,
          prevClose: s.base,
          change: 0,
          changePercent: 0,
          live: false,
        }),
        name: s.name,
        exchange: s.exchange,
        sector: s.sector,
      })),
    [tape],
  );

  const indices = useMemo(
    () =>
      INDIAN_INDICES.map((i) => ({
        ...(tape[i.symbol] ?? {
          symbol: i.symbol,
          price: i.base,
          prevClose: i.base,
          change: 0,
          changePercent: 0,
          live: false,
        }),
        name: i.name,
      })),
    [tape],
  );

  const priceOf = (symbol: string) =>
    tape[symbol.toUpperCase()]?.price ??
    ALL_STOCKS.find((s) => s.symbol === symbol.toUpperCase())?.base ??
    0;

  return {
    stocks,
    indices,
    priceOf,
    isLoading,
    isFetching,
    marketOpen: isMarketOpen(),
    updatedAt: data?.fetchedAt
      ? new Date(data.fetchedAt)
      : dataUpdatedAt
        ? new Date(dataUpdatedAt)
        : null,
    isLiveFeed: !!data?.stocks.some((s) => s.live),
  };
};
