"use client";

import { useState } from "react";
import { Pencil, Trash2, ArrowLeftRight, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
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
import { formatCurrency, formatDate, getTransactionColor } from "@/lib/utils";
import type { Transaction } from "@/types";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS } from "@/types";
import type { PaymentType } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: () => void;
}

export function TransactionList({
  transactions,
  loading,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ArrowLeftRight className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm mt-1">Crie sua primeira transação clicando no botão acima</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
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
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.description}
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
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden divide-y">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-3 p-4"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                transaction.type === "INCOME"
                  ? "bg-emerald-500/10"
                  : "bg-red-500/10"
              }`}
            >
              {transaction.type === "INCOME" ? (
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {transaction.description}
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
        ))}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir transação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a transação &quot;{deleteTarget?.description}&quot;?
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
    </div>
  );
}
