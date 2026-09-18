import { useEffect, useState } from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { estimateCharges } from "@/lib/brokerage";
import { BROKERS, brokerLabel, formatINR, type BrokerId } from "@/lib/stocks";
import { placeOrder, verifyBrokerPin } from "@/lib/trading.functions";

export interface OrderDraft {
  symbol: string;
  exchange: "NSE" | "BSE";
  side: "buy" | "sell";
  quantity: number;
  price: number;
  orderType: "market" | "limit";
  source: "voice" | "manual";
  broker?: BrokerId | undefined;
}

interface BrokerRow {
  id: string;
  broker: string;
  client_code: string;
  balance_inr: number | string;
  is_connected: boolean;
}

export function OrderTicket({
  draft,
  brokers,
  onClose,
  onPlaced,
  speak,
}: {
  draft: OrderDraft | null;
  brokers: BrokerRow[];
  onClose: () => void;
  onPlaced: () => void;
  speak: (text: string) => void;
}) {
  const [broker, setBroker] = useState<BrokerId | null>(null);
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!draft) return;
    setBroker(draft.broker ?? null);
    setPin("");
    setVerified(false);
    setQuantity(Math.max(1, draft.quantity));
    setPrice(draft.price);
    if (!draft.broker) speak(`Which broker should place this order? Zerodha, Upstox or Angel One?`);
    else speak(`${brokerLabel(draft.broker)} selected. Enter your broker PIN to verify the account.`);
  }, [draft, speak]);

  if (!draft) return null;

  const total = +(quantity * price).toFixed(2);
  const selected = brokers.find((b) => b.broker === broker);
  const charges = estimateCharges(broker ?? "zerodha", draft.side, total);


  const verify = async () => {
    if (!broker) {
      toast.error("Choose a broker first");
      return;
    }
    setBusy(true);
    const res = await verifyBrokerPin({ data: { broker, pin } });
    setBusy(false);
    if (!res.ok) {
      setVerified(false);
      toast.error(res.message);
      speak(res.message);
      return;
    }
    setVerified(true);
    toast.success(`${brokerLabel(broker)} verified · ${res.clientCode}`);
    speak(`${brokerLabel(broker)} account verified. Review and place the order.`);
  };

  const submit = async () => {
    if (!broker || !verified) return;
    setBusy(true);
    const res = await placeOrder({
      data: {
        broker,
        symbol: draft.symbol,
        exchange: draft.exchange,
        side: draft.side,
        quantity,
        price,
        orderType: draft.orderType,
        pin,
        source: draft.source,
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      speak(res.message);
      return;
    }
    const msg = `${draft.side === "buy" ? "Bought" : "Sold"} ${quantity} ${draft.symbol} on ${brokerLabel(broker)} for ${formatINR(total, 0)}`;
    toast.success(msg);
    speak(msg);
    onPlaced();
    onClose();
  };

  return (
    <Dialog open={!!draft} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-xl">
            <span className={draft.side === "buy" ? "text-bull" : "text-bear"}>
              {draft.side.toUpperCase()}
            </span>
            {draft.symbol}
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] tracking-widest text-muted-foreground">
              {draft.exchange}
            </span>
          </DialogTitle>
          <DialogDescription>
            Step 1 — pick the broker account. Step 2 — verify it with your PIN. Step 3 — place the order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {BROKERS.map((b) => {
              const row = brokers.find((r) => r.broker === b.id);
              const active = broker === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBroker(b.id);
                    setVerified(false);
                    setPin("");
                  }}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border bg-surface/60 hover:border-primary/50"
                  }`}
                >
                  <div className="font-display text-sm font-semibold">{b.label}</div>
                  <div className="num text-[11px] text-muted-foreground">{row?.client_code ?? "—"}</div>
                  <div className="num mt-1 text-xs text-primary">
                    {row ? formatINR(Number(row.balance_inr), 0) : "—"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                className="num"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div>
              <Label htmlFor="price">
                {draft.orderType === "limit" ? "Limit price (₹)" : "Market price (₹)"}
              </Label>
              <Input
                id="price"
                className="num"
                type="number"
                step="0.05"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-2/60 p-3">
            <Label htmlFor="pin" className="flex items-center gap-2 text-xs">
              <Lock className="size-3.5" /> Broker verification PIN
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="pin"
                className="num"
                inputMode="numeric"
                placeholder="Type your 4-digit PIN"
                value={pin}
                maxLength={6}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setVerified(false);
                }}
              />
              <Button type="button" variant="secondary" onClick={verify} disabled={busy || pin.length < 4}>
                {verified ? <CheckCircle2 className="size-4 text-bull" /> : <ShieldCheck className="size-4" />}
                {verified ? "Verified" : "Verify"}
              </Button>
            </div>
            {selected && !selected.is_connected ? (
              <p className="mt-2 text-xs text-bear">This broker is currently disconnected.</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-surface/60 px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order value</span>
              <span className="num text-xl font-bold">{formatINR(total)}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
              <span className="num">Brokerage {formatINR(charges.brokerage)}</span>
              <span className="num">STT {formatINR(charges.stt)}</span>
              <span className="num">Exchange {formatINR(charges.exchange)}</span>
              <span className="num">GST {formatINR(charges.gst)}</span>
              <span className="num">SEBI {formatINR(charges.sebi)}</span>
              <span className="num">Stamp {formatINR(charges.stamp)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
              <span className="text-sm text-muted-foreground">Est. charges · net {draft.side === "buy" ? "debit" : "credit"}</span>
              <span className="num text-sm font-bold">
                {formatINR(charges.total)} ·{" "}
                {formatINR(draft.side === "buy" ? total + charges.total : total - charges.total)}
              </span>
            </div>
          </div>


          <Button
            className="w-full"
            variant={draft.side === "buy" ? "default" : "destructive"}
            disabled={!verified || busy}
            onClick={submit}
          >
            {busy ? "Sending to broker…" : `Place ${draft.side} order`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
