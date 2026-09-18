import { CheckCircle2, Loader2, QrCode, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addFunds } from "@/lib/funds.functions";
import { brokerLabel, formatINR, type BrokerId } from "@/lib/stocks";

const QUICK = [5000, 25000, 100000, 500000];

/** Deterministic pseudo-QR block grid — a simulated payment code, not a real one. */
function FakeQr({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    let h = 2166136261;
    for (const ch of seed) h = (h ^ ch.charCodeAt(0)) * 16777619;
    const out: boolean[] = [];
    for (let i = 0; i < 625; i++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      out.push((h >> 8) % 100 < 46);
    }
    return out;
  }, [seed]);

  return (
    <div className="mx-auto grid w-40 grid-cols-25 gap-0 rounded-lg bg-foreground p-2" style={{ gridTemplateColumns: "repeat(25, 1fr)" }}>
      {cells.map((on, i) => (
        <span key={i} className={on ? "aspect-square bg-background" : "aspect-square"} />
      ))}
    </div>
  );
}

export function AddFundsDialog({
  broker,
  onClose,
  onDone,
}: {
  broker: BrokerId | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("25000");
  const [upiId, setUpiId] = useState("");
  const [stage, setStage] = useState<"form" | "pending" | "done">("form");
  const [ref, setRef] = useState("");

  useEffect(() => {
    if (broker) {
      setStage("form");
      setAmount("25000");
      setUpiId("");
      setRef("");
    }
  }, [broker]);

  if (!broker) return null;

  const value = Number(amount);
  const submit = async (method: "upi_qr" | "upi_id") => {
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (method === "upi_id" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
      toast.error("Enter a UPI ID like name@bank");
      return;
    }
    setStage("pending");
    await new Promise((r) => setTimeout(r, 1600));
    const res = await addFunds({
      data: { broker, amount: value, method, ...(method === "upi_id" ? { upiId } : {}) },
    });
    if (!res.ok) {
      setStage("form");
      toast.error(res.message);
      return;
    }
    setRef(res.upiRef);
    setStage("done");
    toast.success(`${formatINR(res.amount, 0)} added to ${brokerLabel(broker)}`);
    onDone();
  };

  return (
    <Dialog open={!!broker} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add funds · {brokerLabel(broker)}</DialogTitle>
          <DialogDescription>
            Simulated UPI top-up for this demo account. No real money is transferred.
          </DialogDescription>
        </DialogHeader>

        {stage === "done" ? (
          <div className="space-y-3 py-4 text-center">
            <CheckCircle2 className="mx-auto size-10 text-bull" />
            <p className="font-display text-lg">{formatINR(value, 0)} credited</p>
            <p className="num text-xs text-muted-foreground">Ref {ref}</p>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input
                id="amount"
                className="num"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <Button key={q} size="sm" variant="outline" onClick={() => setAmount(String(q))}>
                    {formatINR(q, 0)}
                  </Button>
                ))}
              </div>
            </div>

            <Tabs defaultValue="qr">
              <TabsList className="w-full">
                <TabsTrigger value="qr" className="flex-1">
                  <QrCode className="size-4" /> Scan QR
                </TabsTrigger>
                <TabsTrigger value="upi" className="flex-1">
                  <Smartphone className="size-4" /> UPI ID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-3 pt-4">
                <FakeQr seed={`${broker}-${amount}`} />
                <p className="text-center text-xs text-muted-foreground">
                  Scan with any UPI app to pay {formatINR(value || 0, 0)} to echotrade@demo
                </p>
                <Button className="w-full" disabled={stage === "pending"} onClick={() => submit("upi_qr")}>
                  {stage === "pending" ? <Loader2 className="size-4 animate-spin" /> : null}
                  {stage === "pending" ? "Waiting for payment…" : "I have paid"}
                </Button>
              </TabsContent>

              <TabsContent value="upi" className="space-y-3 pt-4">
                <div>
                  <Label htmlFor="upi">Your UPI ID</Label>
                  <Input
                    id="upi"
                    placeholder="name@bank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={stage === "pending"} onClick={() => submit("upi_id")}>
                  {stage === "pending" ? <Loader2 className="size-4 animate-spin" /> : null}
                  {stage === "pending" ? "Collect request sent…" : "Send collect request"}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
