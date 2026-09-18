/** Indian discount-broker style charge estimates (delivery equity). Pure client-safe math. */
export interface Charges {
  brokerage: number;
  stt: number;
  exchange: number;
  gst: number;
  sebi: number;
  stamp: number;
  total: number;
}

const BROKERAGE_PCT: Record<string, number> = {
  zerodha: 0,
  upstox: 0.0025,
  angel_one: 0.001,
};
const BROKERAGE_CAP = 20;

export const estimateCharges = (
  broker: string,
  side: "buy" | "sell",
  turnover: number,
): Charges => {
  const pct = BROKERAGE_PCT[broker] ?? 0.0025;
  const brokerage = +Math.min(turnover * pct, BROKERAGE_CAP).toFixed(2);
  const stt = +(turnover * 0.001).toFixed(2);
  const exchange = +(turnover * 0.0000297).toFixed(2);
  const sebi = +(turnover * 0.000001).toFixed(2);
  const gst = +((brokerage + exchange + sebi) * 0.18).toFixed(2);
  const stamp = side === "buy" ? +(turnover * 0.00015).toFixed(2) : 0;
  const total = +(brokerage + stt + exchange + sebi + gst + stamp).toFixed(2);
  return { brokerage, stt, exchange, gst, sebi, stamp, total };
};

export const totalChargesFor = (
  orders: Array<{ broker: string; side: string; total_inr: number | string }>,
): number =>
  +orders
    .reduce(
      (sum, o) =>
        sum + estimateCharges(o.broker, o.side === "sell" ? "sell" : "buy", Number(o.total_inr)).total,
      0,
    )
    .toFixed(2);
