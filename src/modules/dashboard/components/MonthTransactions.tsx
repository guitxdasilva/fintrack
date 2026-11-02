"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { EmptyState } from "@/common/components/ui/empty-state";
import { SelectionBar } from "@/common/components/SelectionBar";
import { useSelection } from "@/common/hooks/useSelection";
import { errorMessage } from "@/lib/api-client";
import { useCardInvoices } from "@/modules/cards/hooks/useCards";
import { useSetTransactionsPaid } from "@/modules/transactions/hooks/useTransactions";
import type { Transaction } from "@/types";
import { groupByCard, togglePaidUpdates } from "../lib/month-transactions";
import { CardGroupRow } from "./month-transactions/CardGroupRow";
import { CardInvoiceDialog } from "./month-transactions/CardInvoiceDialog";
import { MonthTransactionRow } from "./month-transactions/MonthTransactionRow";

interface MonthTransactionsProps {
  transactions: Transaction[];
  month: number;
  year: number;
  isLoading?: boolean;
}

export function MonthTransactions({ transactions, month, year, isLoading }: MonthTransactionsProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const selection = useSelection();
  const setPaid = useSetTransactionsPaid();

  const { individualItems, cardGroups } = useMemo(() => groupByCard(transactions), [transactions]);

  const closingDayCardIds = useMemo(
    () => cardGroups.filter((g) => g.hasClosingDay).map((g) => g.cardId),
    [cardGroups]
  );
  const { invoices, isLoading: invoicesLoading } = useCardInvoices(closingDayCardIds, month, year);

  const selectedCard = cardGroups.find((g) => g.cardId === selectedCardId) ?? null;

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (individualItems.length === 0 && cardGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações do Mês</CardTitle>
          <CardDescription>Movimentações e cartões</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ArrowDownCircle}
            title="Sem movimentações"
            description="Nenhuma transação registrada neste mês"
            compact
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transações do Mês</CardTitle>
          <CardDescription>
            {cardGroups.length > 0
              ? `${cardGroups.length} cartão(ões) · ${individualItems.length} avulsa(s)`
              : `${individualItems.length} transação(ões)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-105 overflow-y-auto">
          {cardGroups.map((group) => (
            <CardGroupRow
              key={`card-${group.cardId}`}
              group={group}
              invoice={invoices.get(group.cardId)}
              invoiceLoading={invoicesLoading}
              onClick={() => setSelectedCardId(group.cardId)}
            />
          ))}

          {individualItems.map((t) => (
            <MonthTransactionRow
              key={t.id}
              transaction={t}
              selected={selection.selected.has(t.id)}
              onToggle={selection.toggle}
              variant="list"
            />
          ))}

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
        </CardContent>
      </Card>

      <CardInvoiceDialog
        group={selectedCard}
        month={month}
        year={year}
        onClose={() => setSelectedCardId(null)}
      />
    </>
  );
}
