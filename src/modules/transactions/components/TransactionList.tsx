"use client";

import { useState } from "react";
import { Pencil, Trash2, ArrowLeftRight, Check, Circle, CheckCircle2, Loader2, Pin } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { EmptyState } from "@/common/components/ui/empty-state";
import { formatCurrency, formatDate, getTransactionColor } from "@/lib/utils";
import type { Transaction } from "@/types";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS } from "@/types";
import type { PaymentType } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: () => void;
  onTogglePaid?: () => void;
  viewMode?: "table" | "cards";
}

export function TransactionList({
  transactions,
  loading,
  onEdit,
  onDelete,
  onTogglePaid,
  viewMode = "table",
}: TransactionListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmPaid() {
    const expenseIds = Array.from(selectedIds).filter((id) =>
      transactions.find((t) => t.id === id && t.type === "EXPENSE")
    );
    if (expenseIds.length === 0) {
      toast.error("Selecione despesas para marcar como pagas");
      return;
    }
    setConfirming(true);
    try {
      const results = await Promise.all(
        expenseIds.map((id) =>
          fetch(`/api/transactions/${id}/toggle-paid`, { method: "PATCH" })
        )
      );
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast.success(`${expenseIds.length} transação(ões) atualizada(s)`);
      } else {
        toast.error("Erro ao atualizar algumas transações");
      }
      setSelectedIds(new Set());
      onTogglePaid?.();
    } catch {
      toast.error("Erro ao atualizar transações");
    } finally {
      setConfirming(false);
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/transactions/${id}`, { method: "DELETE" })
        )
      );
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast.success(`${selectedIds.size} transação(ões) excluída(s)`);
      } else {
        toast.error("Erro ao excluir algumas transações");
      }
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      onDelete();
    } catch {
      toast.error("Erro ao excluir transações");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/transactions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Erro ao excluir transação");
        return;
      }

      toast.success("Transação excluída com sucesso");
      setDeleteTarget(null);
      onDelete();
    } catch {
      toast.error("Erro ao excluir transação");
    } finally {
      setDeleting(false);
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

  return (
    <div>
      <div className={viewMode === "table" ? "hidden md:block" : "hidden"}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Status</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right w-25">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const isExpense = transaction.type === "EXPENSE";
              const isSelected = selectedIds.has(transaction.id);
              return (
              <TableRow key={transaction.id} className={`${transaction.paid ? "opacity-60" : ""} ${isSelected ? "bg-primary/5" : ""}`}>
                <TableCell>
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-md transition-colors hover:bg-muted"
                    onClick={() => toggleSelection(transaction.id)}
                    title={isSelected ? "Desmarcar" : "Selecionar"}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : isExpense && transaction.paid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </TableCell>
                <TableCell className="font-medium max-w-48 lg:max-w-72">
                  <span className={`flex items-center gap-1.5 truncate ${transaction.paid ? "line-through decoration-muted-foreground/50" : ""}`} title={transaction.description}>
                    <span className="truncate">{transaction.description.length > 40 ? transaction.description.slice(0, 40) + "…" : transaction.description}</span>
                    {transaction.isFixed && (
                      <Badge variant="outline" className="text-xs font-normal gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
                        <Pin className="h-3 w-3" />
                        Fixa
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1.5 font-normal">
                    {transaction.category?.icon && (
                      <span>{transaction.category.icon}</span>
                    )}
                    {transaction.category?.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.paymentType ? (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <span>{PAYMENT_TYPE_ICONS[transaction.paymentType as PaymentType]}</span>
                        {PAYMENT_TYPE_LABELS[transaction.paymentType as PaymentType]}
                      </Badge>
                      {transaction.paymentType === "CARD" && transaction.card && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {transaction.card.icon} {transaction.card.name}
                        </Badge>
                      )}
                      {transaction.cardType && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {transaction.cardType === "CREDIT" ? "Crédito" : "Débito"}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.installments ? (
                    <Badge variant="outline" className="font-normal text-xs">
                      {transaction.currentInstallment}/{transaction.installments}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell
                  className={`text-right font-semibold ${getTransactionColor(
                    transaction.type
                  )}`}
                >
                  {transaction.type === "EXPENSE" ? "- " : "+ "}
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(transaction)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => setDeleteTarget(transaction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Desktop confirm bar */}
        {selectedIds.size > 0 && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selecionada(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                disabled={confirming || bulkDeleting}
              >
                Cancelar
              </Button>
              {(() => {
                const selectedExpenses = Array.from(selectedIds)
                  .map((id) => transactions.find((t) => t.id === id))
                  .filter((t) => t && t.type === "EXPENSE");
                const allPaid = selectedExpenses.length > 0 && selectedExpenses.every((t) => t!.paid);
                return (
                  <Button
                    size="sm"
                    onClick={handleConfirmPaid}
                    disabled={confirming || bulkDeleting}
                    className="gap-1.5"
                  >
                    {confirming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {allPaid ? "Desmarcar Pago" : "Marcar Pago"}
                  </Button>
                );
              })()}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={confirming || bulkDeleting}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className={viewMode === "table" ? "md:hidden divide-y" : "divide-y"}>
        {transactions.map((transaction) => {
          const isExpense = transaction.type === "EXPENSE";
          const isSelected = selectedIds.has(transaction.id);
          return (
          <div
            key={transaction.id}
            className={`flex items-center gap-3 p-4 ${transaction.paid ? "opacity-60" : ""} ${isSelected ? "bg-primary/5" : ""}`}
          >
            <button
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                isSelected
                  ? "bg-primary/10"
                  : isExpense && transaction.paid
                    ? "bg-emerald-500/10"
                    : isExpense
                      ? "bg-red-500/10"
                      : "bg-emerald-500/10"
              }`}
              onClick={() => toggleSelection(transaction.id)}
              title={isSelected ? "Desmarcar" : "Selecionar"}
            >
              {isSelected ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : isExpense && transaction.paid ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : isExpense ? (
                <Circle className="h-5 w-5 text-red-400" />
              ) : (
                <Circle className="h-5 w-5 text-emerald-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${transaction.paid ? "line-through decoration-muted-foreground/50" : ""}`} title={transaction.description}>
                {transaction.description.length > 40 ? transaction.description.slice(0, 40) + "…" : transaction.description}
                {transaction.isFixed && (
                  <Badge variant="outline" className="ml-1.5 text-xs font-normal gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
                    <Pin className="h-3 w-3" />
                    Fixa
                  </Badge>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {transaction.category?.icon} {transaction.category?.name}
                </span>
                {transaction.paymentType && (
                  <span className="text-xs text-muted-foreground">
                    • {PAYMENT_TYPE_ICONS[transaction.paymentType as PaymentType]} {PAYMENT_TYPE_LABELS[transaction.paymentType as PaymentType]}
                    {transaction.paymentType === "CARD" && transaction.card && (
                      <> · {transaction.card.name}</>
                    )}
                    {transaction.cardType && (
                      <> ({transaction.cardType === "CREDIT" ? "Créd." : "Déb."})</>
                    )}
                  </span>
                )}
                {transaction.installments && (
                  <span className="text-xs text-muted-foreground">
                    • {transaction.currentInstallment}/{transaction.installments}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDate(transaction.date)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-semibold whitespace-nowrap ${getTransactionColor(
                  transaction.type
                )}`}
              >
                {transaction.type === "EXPENSE" ? "-" : "+"}
                {formatCurrency(transaction.amount)}
              </p>
              <div className="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(transaction)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500"
                  onClick={() => setDeleteTarget(transaction)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
          );
        })}

        {/* Mobile confirm bar */}
        {selectedIds.size > 0 && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selecionada(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                disabled={confirming || bulkDeleting}
              >
                Cancelar
              </Button>
              {(() => {
                const selectedExpenses = Array.from(selectedIds)
                  .map((id) => transactions.find((t) => t.id === id))
                  .filter((t) => t && t.type === "EXPENSE");
                const allPaid = selectedExpenses.length > 0 && selectedExpenses.every((t) => t!.paid);
                return (
                  <Button
                    size="sm"
                    onClick={handleConfirmPaid}
                    disabled={confirming || bulkDeleting}
                    className="gap-1.5"
                  >
                    {confirming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {allPaid ? "Desmarcar" : "Pago"}
                  </Button>
                );
              })()}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={confirming || bulkDeleting}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir transação</DialogTitle>
            <DialogDescription className="break-words">
              Tem certeza que deseja excluir a transação &quot;<span className="font-medium" title={deleteTarget?.description}>{(deleteTarget?.description?.length ?? 0) > 40 ? deleteTarget?.description?.slice(0, 40) + "…" : deleteTarget?.description}</span>&quot;?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir transações</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} transação(ões) selecionada(s)?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={bulkDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? "Excluindo..." : `Excluir ${selectedIds.size}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
