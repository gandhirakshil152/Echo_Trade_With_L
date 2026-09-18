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

// ─── Core Math ────────────────────────────────────────────────────────────────

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

// ─── Bollinger Bands ──────────────────────────────────────────────────────────

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
}

export const bollingerBands = (values: number[], period = 20, multiplier = 2): BollingerBands | null => {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mid) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = +(mid + multiplier * stdDev).toFixed(2);
  const lower = +(mid - multiplier * stdDev).toFixed(2);
  return {
    upper,
    middle: +mid.toFixed(2),
    lower,
    bandwidth: +((upper - lower) / mid * 100).toFixed(2),
  };
};

// ─── ATR (Average True Range) ─────────────────────────────────────────────────

export const atr = (candles: Candle[], period = 14): number | null => {
  if (candles.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    const prev = candles[i - 1]!;
    trs.push(Math.max(
      c.high - c.low,
      Math.abs(c.high - prev.close),
      Math.abs(c.low - prev.close),
    ));
  }
  return sma(trs, period);
};

// ─── Stochastic Oscillator ────────────────────────────────────────────────────

export interface Stochastic {
  k: number;
  d: number;
}

export const stochastic = (candles: Candle[], kPeriod = 14, dPeriod = 3): Stochastic | null => {
  if (candles.length < kPeriod + dPeriod) return null;
  const kValues: number[] = [];
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map((c) => c.high));
    const low = Math.min(...slice.map((c) => c.low));
    const close = slice[slice.length - 1]!.close;
    kValues.push(high === low ? 50 : +((close - low) / (high - low) * 100).toFixed(2));
  }
  const k = kValues[kValues.length - 1] ?? 50;
  const d = +(kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / Math.min(dPeriod, kValues.length)).toFixed(2);
  return { k: +k.toFixed(2), d };
};

// ─── On-Balance Volume ────────────────────────────────────────────────────────

export const obv = (candles: Candle[]): number | null => {
  if (candles.length < 2) return null;
  let total = 0;
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i]!;
    const prev = candles[i - 1]!;
    if (cur.close > prev.close) total += cur.volume;
    else if (cur.close < prev.close) total -= cur.volume;
  }
  return total;
};

// ─── Support / Resistance (Pivot Points) ─────────────────────────────────────

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export const pivotPoints = (candles: Candle[]): PivotPoints | null => {
  if (!candles.length) return null;
  // Use the last complete session
  const c = candles[candles.length - 1]!;
  const pivot = +((c.high + c.low + c.close) / 3).toFixed(2);
  return {
    pivot,
    r1: +((2 * pivot) - c.low).toFixed(2),
    r2: +(pivot + (c.high - c.low)).toFixed(2),
    r3: +(c.high + 2 * (pivot - c.low)).toFixed(2),
    s1: +((2 * pivot) - c.high).toFixed(2),
    s2: +(pivot - (c.high - c.low)).toFixed(2),
    s3: +(c.low - 2 * (c.high - pivot)).toFixed(2),
  };
};

// ─── ADX (Average Directional Index) ─────────────────────────────────────────

export const adx = (candles: Candle[], period = 14): number | null => {
  if (candles.length < period * 2) return null;
  const dxValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    const p = candles[i - 1]!;
    const upMove = c.high - p.high;
    const downMove = p.low - c.low;
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    const tr = Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close));
    if (tr === 0) continue;
    const plusDI = (plusDM / tr) * 100;
    const minusDI = (minusDM / tr) * 100;
    const diSum = plusDI + minusDI;
    if (diSum > 0) dxValues.push(Math.abs(plusDI - minusDI) / diSum * 100);
  }
  if (dxValues.length < period) return null;
  return +(dxValues.slice(-period).reduce((a, b) => a + b, 0) / period).toFixed(2);
};

// ─── SMA series for chart overlays ───────────────────────────────────────────

/** Returns an array of SMA values aligned to the candle array (null for early candles) */
export const smaSeries = (candles: Candle[], period: number): (number | null)[] =>
  candles.map((_, i) => {
    if (i < period - 1) return null;
    const slice = candles.slice(i - period + 1, i + 1).map((c) => c.close);
    return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(2);
  });

/** Returns upper/middle/lower BB arrays aligned to the candle array */
export const bollingerSeries = (
  candles: Candle[],
  period = 20,
  mult = 2,
): { upper: (number | null)[]; lower: (number | null)[] } => {
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { upper.push(null); lower.push(null); continue; }
    const slice = candles.slice(i - period + 1, i + 1).map((c) => c.close);
    const mid = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mid) ** 2, 0) / period);
    upper.push(+(mid + mult * std).toFixed(2));
    lower.push(+(mid - mult * std).toFixed(2));
  }
  return { upper, lower };
};

// ─── Full Analysis ────────────────────────────────────────────────────────────

export interface TechnicalRead {
  sma20: number | null;
  sma50: number | null;
  ema20: number | null;
  rsi14: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  vwap: number | null;
  bollinger: BollingerBands | null;
  atr14: number | null;
  stoch: Stochastic | null;
  adx14: number | null;
  pivots: PivotPoints | null;
  verdict: "Bullish" | "Bearish" | "Neutral";
  strength: "Strong" | "Moderate" | "Weak";
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
  const bb = bollingerBands(closes);
  const atr14 = atr(candles);
  const stoch = stochastic(candles);
  const adx14 = adx(candles);
  const pivots = pivotPoints(candles);

  let score = 0;
  const reasons: string[] = [];

  if (s20 !== null) {
    if (last > s20) { score++; reasons.push(`Price ₹${last} above 20-SMA ₹${s20}`); }
    else { score--; reasons.push(`Price ₹${last} below 20-SMA ₹${s20}`); }
  }
  if (s50 !== null && s20 !== null) {
    if (s20 > s50) { score++; reasons.push(`20-SMA ₹${s20} above 50-SMA ₹${s50} — uptrend`); }
    else { score--; reasons.push(`20-SMA ₹${s20} below 50-SMA ₹${s50} — downtrend`); }
  }
  if (r !== null) {
    if (r > 70) { score--; reasons.push(`RSI ${r} — overbought zone`); }
    else if (r < 30) { score++; reasons.push(`RSI ${r} — oversold, bounce possible`); }
    else if (r > 55) { score += 0.5; reasons.push(`RSI ${r} — bullish momentum`); }
    else if (r < 45) { score -= 0.5; reasons.push(`RSI ${r} — bearish momentum`); }
    else reasons.push(`RSI ${r} — neutral`);
  }
  if (m) {
    if (m.histogram > 0) { score++; reasons.push(`MACD ${m.macd} above signal ${m.signal}`); }
    else { score--; reasons.push(`MACD ${m.macd} below signal ${m.signal}`); }
  }
  if (v !== null) {
    if (last > v) { score++; reasons.push(`Above VWAP ₹${v}`); }
    else { score--; reasons.push(`Below VWAP ₹${v}`); }
  }
  if (bb) {
    if (last > bb.upper) { score--; reasons.push(`Above Bollinger upper ₹${bb.upper} — overextended`); }
    else if (last < bb.lower) { score++; reasons.push(`Below Bollinger lower ₹${bb.lower} — potential reversal`); }
  }
  if (stoch) {
    if (stoch.k > 80) { score -= 0.5; reasons.push(`Stochastic %K ${stoch.k} — overbought`); }
    else if (stoch.k < 20) { score += 0.5; reasons.push(`Stochastic %K ${stoch.k} — oversold`); }
    if (stoch.k > stoch.d) reasons.push(`Stoch %K ${stoch.k} crossing above %D ${stoch.d}`);
  }
  if (adx14 !== null) {
    if (adx14 > 25) reasons.push(`ADX ${adx14} — strong trend`);
    else reasons.push(`ADX ${adx14} — weak/ranging`);
  }

  const absScore = Math.abs(score);
  const strength: TechnicalRead["strength"] = absScore >= 3 ? "Strong" : absScore >= 1.5 ? "Moderate" : "Weak";

  return {
    sma20: s20,
    sma50: s50,
    ema20: e20,
    rsi14: r,
    macd: m,
    vwap: v,
    bollinger: bb,
    atr14,
    stoch,
    adx14,
    pivots,
    verdict: score >= 1.5 ? "Bullish" : score <= -1.5 ? "Bearish" : "Neutral",
    strength,
    reasons,
  };
};
