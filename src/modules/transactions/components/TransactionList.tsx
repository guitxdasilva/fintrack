"use client";

import { Pencil, Trash2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { formatCurrency, formatDate, getTransactionColor } from "@/lib/utils";
import type { Transaction } from "@/types";

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
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Erro ao excluir transação");
        return;
      }

      toast.success("Transação excluída com sucesso");
      onDelete();
    } catch {
      toast.error("Erro ao excluir transação");
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right w-[100px]">Ações</TableHead>
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
                    onClick={() => handleDelete(transaction.id)}
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
  );
}
