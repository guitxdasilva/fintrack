"use client";

import { useState, type ReactNode } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { ConfirmDialog } from "@/common/components/ConfirmDialog";
import { SelectionBar } from "@/common/components/SelectionBar";
import { useSelection } from "@/common/hooks/useSelection";
import { errorMessage } from "@/lib/api-client";
import type { SeriesScope } from "@/lib/transactions/series";
import { cn, formatCurrency, truncateText } from "@/lib/utils";
import {
  useDeleteTransaction,
  useDeleteTransactions,
  useSetTransactionsPaid,
} from "@/modules/transactions/hooks/useTransactions";
import type { Transaction } from "@/types";
import type { StatementGroup } from "../../lib/statement";
import { SeriesScopePicker, isSeries } from "../SeriesScopePicker";
import { RefundDialog } from "./RefundDialog";
import { StatementRow } from "./StatementRow";

interface StatementViewProps {
  groups: StatementGroup[];
  loading: boolean;
  empty: ReactNode;
  onEdit: (t: Transaction) => void;
  /** "paid": the row icon marks as paid directly (bills checklist) instead of selecting. */
  iconAction?: "select" | "paid";
  hideCard?: boolean;
  /** Tighter layout for narrow columns (cards side by side). */
  compact?: boolean;
}

/**
 * Grouped transaction list (bank-statement style) with selection, bulk
 * mark-as-paid / delete, and series-aware single delete.
 */
export function StatementView({
  groups,
  loading,
  empty,
  onEdit,
  iconAction = "select",
  hideCard,
  compact = false,
}: StatementViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleteScope, setDeleteScope] = useState<SeriesScope>("this");
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Transaction | null>(null);
  const selection = useSelection();
  const setPaid = useSetTransactionsPaid();
  const deleteOne = useDeleteTransaction();
  const deleteMany = useDeleteTransactions();
  const busy = setPaid.isPending || deleteMany.isPending;

  const all = groups.flatMap((g) => g.items);
  const selectedExpenses = all.filter((t) => selection.selected.has(t.id) && t.type === "EXPENSE");
  const allSelectedPaid = selectedExpenses.length > 0 && selectedExpenses.every((t) => t.paid);

  async function markPaid(updates: Map<string, boolean>, message: string) {
    try {
      await setPaid.mutateAsync(updates);
      toast.success(message);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao atualizar transações"));
    }
  }

  function togglePaid(t: Transaction) {
    markPaid(new Map([[t.id, !t.paid]]), t.paid ? "Marcado como pendente" : "Marcado como pago");
  }

  function handleIconClick(t: Transaction) {
    if (iconAction === "paid") togglePaid(t);
    else selection.toggle(t.id);
  }

  function handleBulkPaid() {
    if (selectedExpenses.length === 0) {
      toast.error("Selecione despesas para marcar como pagas");
      return;
    }
    const paid = !allSelectedPaid;
    selection.clear();
    markPaid(
      new Map(selectedExpenses.map((t) => [t.id, paid])),
      `${selectedExpenses.length} transação(ões) atualizada(s)`
    );
  }

  async function handleBulkDelete() {
    try {
      const res = await deleteMany.mutateAsync([...selection.selected]);
      toast.success(res.data.message);
      selection.clear();
      setShowBulkDelete(false);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao excluir transações"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await deleteOne.mutateAsync({ id: deleteTarget.id, scope: deleteScope });
      toast.success(res.message);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao excluir transação"));
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (all.length === 0) return <>{empty}</>;

  return (
    <div>
      <div className={compact ? "space-y-4 p-1.5" : "space-y-5 p-2 sm:p-3"}>
        {groups.map((g) => (
          <section key={g.key} aria-label={g.title}>
            <header className={cn("flex items-baseline justify-between pb-1", compact ? "px-2" : "px-2 sm:px-3")}>
              <h3 className="text-sm font-semibold">{g.title}</h3>
              <span
                className={cn(
                  "text-xs font-medium tabular-nums",
                  g.total < 0 ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {g.total < 0 ? "−" : "+"}
                {formatCurrency(Math.abs(g.total))}
              </span>
            </header>
            <ul className="space-y-0.5">
              {g.items.map((t) => (
                <StatementRow
                  key={t.id}
                  transaction={t}
                  selected={selection.selected.has(t.id)}
                  iconAction={iconAction}
                  onIconClick={handleIconClick}
                  onEdit={onEdit}
                  onTogglePaid={togglePaid}
                  onDelete={(target) => {
                    setDeleteScope("this");
                    setDeleteTarget(target);
                  }}
                  onRefund={setRefundTarget}
                  hideCard={hideCard}
                  compact={compact}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <SelectionBar
        count={selection.selected.size}
        onCancel={selection.clear}
        disabled={busy}
        className="px-4 py-3"
      >
        <Button size="sm" onClick={handleBulkPaid} disabled={busy} className="gap-1.5">
          {setPaid.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {allSelectedPaid ? "Desmarcar Pago" : "Marcar Pago"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowBulkDelete(true)}
          disabled={busy}
          className="gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </Button>
      </SelectionBar>

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
        loading={deleteOne.isPending}
        onConfirm={handleDelete}
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

      <RefundDialog purchase={refundTarget} onClose={() => setRefundTarget(null)} />

      <ConfirmDialog
        open={showBulkDelete}
        onOpenChange={setShowBulkDelete}
        title="Excluir transações"
        description={`Tem certeza que deseja excluir ${selection.selected.size} transação(ões) selecionada(s)? Esta ação não pode ser desfeita.`}
        confirmLabel={`Excluir ${selection.selected.size}`}
        loading={deleteMany.isPending}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
