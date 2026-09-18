import { useServerFn } from "@tanstack/react-start";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR, type BrokerId } from "@/lib/stocks";
import { setupBrokerAccount } from "@/lib/trading.functions";

type Props = {
  broker: { id: BrokerId; label: string } | null;
  existing?: { account_name: string; client_code: string; pin: string } | null;
  onClose: () => void;
  onDone: () => void;
};

export function BrokerSetupDialog({ broker, existing, onClose, onDone }: Props) {
  const setup = useServerFn(setupBrokerAccount);
  const [name, setName] = useState(existing?.account_name ?? "");
  const [clientCode, setClientCode] = useState(existing?.client_code ?? "");
  const [pin, setPin] = useState(existing?.pin ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!broker) return;
    setBusy(true);
    try {
      const res = await setup({
        data: { broker: broker.id, accountName: name, clientCode, pin },
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(
        res.created
          ? `${broker.label} linked · funds allotted ${formatINR(res.balance, 0)}`
          : `${broker.label} panel updated`,
      );
      onDone();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Broker setup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!broker} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {existing ? "Update" : "Set up"} {broker?.label} panel
          </DialogTitle>
          <DialogDescription>
            Enter the account holder name, client ID and a 4-6 digit trading PIN. Funds are allotted
            randomly between {formatINR(5000, 0)} and {formatINR(2000000, 0)} on first setup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bname" className="text-xs">
              Account holder name
            </Label>
            <Input id="bname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rakshil Gandhi" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bcode" className="text-xs">
              Client ID
            </Label>
            <Input
              id="bcode"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value.toUpperCase())}
              placeholder="ZR12345"
              className="num"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bpin" className="flex items-center gap-2 text-xs">
              <KeyRound className="size-3.5" /> Trading PIN (typed only, never spoken)
            </Label>
            <Input
              id="bpin"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="num tracking-[0.4em]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || name.trim().length < 2 || clientCode.trim().length < 3 || pin.length < 4}>
            {busy ? "Saving…" : existing ? "Update panel" : "Create panel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
