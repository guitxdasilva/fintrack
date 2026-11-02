"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { EmptyState } from "@/common/components/ui/empty-state";
import { ConfirmDialog } from "@/common/components/ConfirmDialog";
import { SelectionBar } from "@/common/components/SelectionBar";
import { useSelection } from "@/common/hooks/useSelection";
import { errorMessage } from "@/lib/api-client";
import { truncateText } from "@/lib/utils";
import type { SeriesScope } from "@/lib/transactions/series";
import {
  useDeleteTransaction,
  useDeleteTransactions,
  useSetTransactionsPaid,
} from "@/modules/transactions/hooks/useTransactions";
import { SeriesScopePicker, isSeries } from "./SeriesScopePicker";
import type { Transaction } from "@/types";
import type { SortState } from "./transaction-list/SortableHead";
import { TransactionCards } from "./transaction-list/TransactionCards";
import { TransactionTable } from "./transaction-list/TransactionTable";

interface TransactionListProps extends SortState {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (transaction: Transaction) => void;
  viewMode?: "table" | "cards";
}

export function TransactionList({
  transactions,
  loading,
  onEdit,
  viewMode = "table",
  ...sort
}: TransactionListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteScope, setDeleteScope] = useState<SeriesScope>("this");
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const selection = useSelection();
  const setPaid = useSetTransactionsPaid();
  const deleteTransactions = useDeleteTransactions();
  const deleteTransaction = useDeleteTransaction();
  const busy = setPaid.isPending || deleteTransactions.isPending;

  function askDelete(transaction: Transaction) {
    setDeleteScope("this");
    setDeleteTarget(transaction);
  }

  const selectedExpenses = transactions.filter(
    (t) => selection.selected.has(t.id) && t.type === "EXPENSE"
  );
  const allSelectedPaid = selectedExpenses.length > 0 && selectedExpenses.every((t) => t.paid);

  function toggleSelectAll() {
    if (selection.selected.size === transactions.length) selection.clear();
    else selection.replace(transactions.map((t) => t.id));
  }

  async function handleConfirmPaid() {
    if (selectedExpenses.length === 0) {
      toast.error("Selecione despesas para marcar como pagas");
      return;
    }
    const paid = !allSelectedPaid;
    selection.clear();
    try {
      await setPaid.mutateAsync(new Map(selectedExpenses.map((t) => [t.id, paid])));
      toast.success(`${selectedExpenses.length} transação(ões) atualizada(s)`);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao atualizar transações"));
    }
  }

  async function handleBulkDelete() {
    try {
      const res = await deleteTransactions.mutateAsync([...selection.selected]);
      toast.success(res.data.message);
      selection.clear();
      setShowBulkDeleteDialog(false);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao excluir transações"));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await deleteTransaction.mutateAsync({ id: deleteTarget.id, scope: deleteScope });
      toast.success(res.message);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao excluir transação"));
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Nenhuma transação encontrada"
        description="Crie sua primeira transação clicando no botão acima"
      />
    );
  }

  const selectionBar = (compact: boolean) => (
    <SelectionBar
      count={selection.selected.size}
      onCancel={selection.clear}
      disabled={busy}
      className="px-4 py-3"
    >
      <Button size="sm" onClick={handleConfirmPaid} disabled={busy} className="gap-1.5">
        {setPaid.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {compact
          ? allSelectedPaid ? "Desmarcar" : "Pago"
          : allSelectedPaid ? "Desmarcar Pago" : "Marcar Pago"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setShowBulkDeleteDialog(true)}
        disabled={busy}
        className="gap-1.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {!compact && "Excluir"}
      </Button>
    </SelectionBar>
  );

  return (
    <div>
      <div className={viewMode === "table" ? "hidden md:block" : "hidden"}>
        <TransactionTable
          transactions={transactions}
          selected={selection.selected}
          onToggle={selection.toggle}
          onToggleAll={toggleSelectAll}
          onEdit={onEdit}
          onDelete={askDelete}
          {...sort}
        />
        {selectionBar(false)}
      </div>

      <div className={viewMode === "table" ? "md:hidden divide-y" : "divide-y"}>
        <TransactionCards
          transactions={transactions}
          selected={selection.selected}
          onToggle={selection.toggle}
          onEdit={onEdit}
          onDelete={askDelete}
        />
        {selectionBar(true)}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir transação"
        description={
          <>
            Tem certeza que deseja excluir a transação &quot;
            <span className="font-medium" title={deleteTarget?.description}>
              {truncateText(deleteTarget?.description ?? "")}
            </span>
            &quot;? Esta ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        loading={deleteTransaction.isPending}
        onConfirm={handleConfirmDelete}
      >
        {isSeries(deleteTarget) && deleteTarget && (
          <SeriesScopePicker
            transaction={deleteTarget}
            value={deleteScope}
            onChange={setDeleteScope}
            label="Excluir"
          />
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title="Excluir transações"
        description={`Tem certeza que deseja excluir ${selection.selected.size} transação(ões) selecionada(s)? Esta ação não pode ser desfeita.`}
        confirmLabel={`Excluir ${selection.selected.size}`}
        loading={deleteTransactions.isPending}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
