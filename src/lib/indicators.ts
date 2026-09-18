/** Pure technical-analysis helpers (client-safe). */
export interface Candle {
  t: number;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const sma = (values: number[], period: number): number | null => {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(2);
};

export const ema = (values: number[], period: number): number | null => {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (const v of values.slice(period)) e = v * k + e * (1 - k);
  return +e.toFixed(2);
};

export const rsi = (values: number[], period = 14): number | null => {
  if (values.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const diff = values[i]! - values[i - 1]!;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return +(100 - 100 / (1 + rs)).toFixed(2);
};

export const macd = (values: number[]): { macd: number; signal: number; histogram: number } | null => {
  if (values.length < 35) return null;
  const line: number[] = [];
  for (let i = 26; i <= values.length; i++) {
    const slice = values.slice(0, i);
    const fast = ema(slice, 12);
    const slow = ema(slice, 26);
    if (fast === null || slow === null) continue;
    line.push(fast - slow);
  }
  const last = line[line.length - 1] ?? 0;
  const signal = ema(line, 9) ?? last;
  return {
    macd: +last.toFixed(2),
    signal: +signal.toFixed(2),
    histogram: +(last - signal).toFixed(2),
  };
};

export const vwap = (candles: Candle[]): number | null => {
  let pv = 0;
  let vol = 0;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    const v = c.volume || 1;
    pv += typical * v;
    vol += v;
  }
  if (!vol) return null;
  return +(pv / vol).toFixed(2);
};

export interface TechnicalRead {
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  rsi14: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  vwap: number | null;
  verdict: "Bullish" | "Bearish" | "Neutral";
  reasons: string[];
}

export const analyse = (candles: Candle[]): TechnicalRead => {
  const closes = candles.map((c) => c.close);
  const last = closes[closes.length - 1] ?? 0;
  const s20 = sma(closes, 20);
  const s50 = sma(closes, 50);
  const e20 = ema(closes, 20);
  const r = rsi(closes);
  const m = macd(closes);
  const v = vwap(candles);

  let score = 0;
  const reasons: string[] = [];
  if (s20 !== null) {
    if (last > s20) { score++; reasons.push("Price above 20-period SMA"); }
    else { score--; reasons.push("Price below 20-period SMA"); }
  }
  if (s50 !== null && s20 !== null) {
    if (s20 > s50) { score++; reasons.push("20 SMA above 50 SMA (uptrend)"); }
    else { score--; reasons.push("20 SMA below 50 SMA (downtrend)"); }
  }
  if (r !== null) {
    if (r > 70) { score--; reasons.push(`RSI ${r} — overbought`); }
    else if (r < 30) { score++; reasons.push(`RSI ${r} — oversold bounce zone`); }
    else reasons.push(`RSI ${r} — neutral momentum`);
  }
  if (m) {
    if (m.histogram > 0) { score++; reasons.push("MACD above signal line"); }
    else { score--; reasons.push("MACD below signal line"); }
  }
  if (v !== null) {
    if (last > v) { score++; reasons.push("Trading above VWAP"); }
    else { score--; reasons.push("Trading below VWAP"); }
  }

  return {
    sma20: s20,
    sma50: s50,
    ema20: e20,
    rsi14: r,
    macd: m,
    vwap: v,
    verdict: score >= 2 ? "Bullish" : score <= -2 ? "Bearish" : "Neutral",
    reasons,
  };
};
