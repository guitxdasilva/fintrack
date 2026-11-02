"use client";

import { useMemo } from "react";
import { CalendarRange, Check, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/common/components/ui/dialog";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Separator } from "@/common/components/ui/separator";
import { Spinner } from "@/common/components/ui/spinner";
import { SelectionBar } from "@/common/components/SelectionBar";
import { useSelection } from "@/common/hooks/useSelection";
import { errorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { useCardInvoice, usePayInvoice } from "@/modules/cards/hooks/useCards";
import { useSetTransactionsPaid } from "@/modules/transactions/hooks/useTransactions";
import {
  categoryBreakdown,
  togglePaidUpdates,
  type CardGroup,
} from "../../lib/month-transactions";
import { CategoryPie } from "./CategoryPie";
import { MonthTransactionRow } from "./MonthTransactionRow";

interface CardInvoiceDialogProps {
  group: CardGroup | null;
  month: number;
  year: number;
  onClose: () => void;
}

export function CardInvoiceDialog({ group, month, year, onClose }: CardInvoiceDialogProps) {
  const { data: invoice, isLoading: invoiceLoading } = useCardInvoice(
    group?.cardId,
    month,
    year,
    !!group?.hasClosingDay
  );
  const payInvoice = usePayInvoice();
  const setPaid = useSetTransactionsPaid();
  const selection = useSelection();

  const transactions = useMemo(
    () =>
      [...(invoice?.transactions ?? group?.transactions ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [invoice, group]
  );
  const total = invoice?.total ?? group?.total ?? 0;
  const unpaidCount = transactions.filter((t) => t.type === "EXPENSE" && !t.paid).length;
  const slices = useMemo(() => categoryBreakdown(transactions), [transactions]);

  function handleClose() {
    selection.clear();
    onClose();
  }

  async function handlePayInvoice() {
    if (!group) return;
    try {
      const res = await payInvoice.mutateAsync({ cardId: group.cardId, month, year });
      toast.success(res.data?.message || "Fatura paga com sucesso");
      selection.clear();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao pagar fatura"));
    }
  }

  async function handleConfirmPaid() {
    const updates = togglePaidUpdates(selection.selected, transactions);
    selection.clear();
    try {
      await setPaid.mutateAsync(updates);
      toast.success(`${updates.size} transação(ões) atualizada(s)`);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao atualizar transações"));
    }
  }

  return (
    <Dialog open={!!group} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{group?.cardIcon}</span>
            {group?.cardName}
            <Badge variant="outline" className="ml-auto font-semibold text-red-500">
              -{formatCurrency(total)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {group?.hasClosingDay && (
          <div className="flex items-center gap-2">
            {invoiceLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Carregando fatura...
              </div>
            ) : invoice ? (
              <Badge variant="secondary" className="flex items-center gap-1.5 font-normal">
                <CalendarRange className="h-3.5 w-3.5" />
                Fatura: {invoice.period.label}
              </Badge>
            ) : null}
          </div>
        )}

        {!invoiceLoading && unpaidCount > 0 && (
          <Button
            onClick={handlePayInvoice}
            disabled={payInvoice.isPending}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {payInvoice.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Pagar fatura ({unpaidCount} pendente{unpaidCount !== 1 ? "s" : ""})
          </Button>
        )}

        {!invoiceLoading && slices.length > 0 && (
          <>
            <CategoryPie data={slices} />
            <Separator />
          </>
        )}

        <div className="space-y-3">
          {invoiceLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            transactions.map((t) => (
              <MonthTransactionRow
                key={t.id}
                transaction={t}
                selected={selection.selected.has(t.id)}
                onToggle={selection.toggle}
                variant="invoice"
              />
            ))
          )}
        </div>

        <SelectionBar
          count={selection.selected.size}
          onCancel={selection.clear}
          disabled={setPaid.isPending}
          className="pt-3 pb-1"
        >
          <Button size="sm" onClick={handleConfirmPaid} disabled={setPaid.isPending} className="gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Confirmar
          </Button>
        </SelectionBar>
      </DialogContent>
    </Dialog>
  );
}
