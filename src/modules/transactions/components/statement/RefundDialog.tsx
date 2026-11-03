"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { useOpenSession } from "@/common/hooks/useOpenSession";
import { errorMessage } from "@/lib/api-client";
import { formatDateOnly } from "@/lib/dates";
import { refundableAmount } from "@/lib/refunds";
import { cn, formatCurrency, truncateText } from "@/lib/utils";
import { useRefundTransaction } from "@/modules/transactions/hooks/useTransactions";
import type { Transaction } from "@/types";

interface RefundDialogProps {
  purchase: Transaction | null;
  onClose: () => void;
}

function RefundForm({ purchase, onClose }: { purchase: Transaction; onClose: () => void }) {
  const refund = useRefundTransaction();
  const available = refundableAmount(purchase, purchase.refunds ?? []);
  const alreadyRefunded = purchase.amount - available;
  const [mode, setMode] = useState<"total" | "partial">("total");
  const [partial, setPartial] = useState("");
  const [date, setDate] = useState(formatDateOnly(new Date()));

  const amount = mode === "total" ? available : parseFloat(partial.replace(",", "."));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!(amount > 0)) {
      toast.error("Informe o valor do reembolso");
      return;
    }
    if (amount > available) {
      toast.error(`O máximo é ${formatCurrency(available)}`);
      return;
    }
    try {
      const res = await refund.mutateAsync({ id: purchase.id, amount, date: date || undefined });
      toast.success(res.message);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao registrar reembolso"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-muted/40 p-3 text-sm">
        <p className="font-medium" title={purchase.description}>
          {truncateText(purchase.description)}
        </p>
        <p className="text-muted-foreground">
          Compra de {formatCurrency(purchase.amount)}
          {alreadyRefunded > 0 && ` · ${formatCurrency(alreadyRefunded)} já reembolsado`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg border p-1" role="radiogroup">
        {(["total", "partial"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {m === "total" ? `Total (${formatCurrency(available)})` : "Parcial"}
          </button>
        ))}
      </div>

      {mode === "partial" && (
        <div className="space-y-2">
          <Label htmlFor="refundAmount">Valor reembolsado (R$)</Label>
          <Input
            id="refundAmount"
            type="number"
            step="0.01"
            min="0.01"
            max={available}
            inputMode="decimal"
            placeholder="0,00"
            value={partial}
            onChange={(e) => setPartial(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="refundDate">Data do reembolso</Label>
        <Input id="refundDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <p className="text-xs text-muted-foreground">
        O valor é abatido da fatura desta compra e do gasto da categoria.
      </p>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={refund.isPending}>
          {refund.isPending ? "Salvando..." : "Reembolsar"}
        </Button>
      </div>
    </form>
  );
}

/** Full or partial refund of one purchase. */
export function RefundDialog({ purchase, onClose }: RefundDialogProps) {
  const session = useOpenSession(!!purchase);
  return (
    <Dialog open={!!purchase} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Reembolsar compra</DialogTitle>
          <DialogDescription>Registre o valor devolvido pela loja ou pelo banco.</DialogDescription>
        </DialogHeader>
        {purchase && <RefundForm key={session} purchase={purchase} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
