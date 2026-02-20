"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Badge } from "@/common/components/ui/badge";
import { EmptyState } from "@/common/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({
  transactions,
  isLoading,
}: RecentTransactionsProps) {
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

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={ArrowLeftRight}
            title="Nenhuma transação"
            description="Registre sua primeira transação para vê-la aqui"
            compact
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todas &rarr;
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-4 rounded-lg px-2 py-2.5 -mx-2 transition-colors hover:bg-muted/50"
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

            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium leading-none truncate" title={transaction.description}>
                {transaction.description.length > 40 ? transaction.description.slice(0, 40) + "…" : transaction.description}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal text-xs">
                  {transaction.category.name}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(transaction.date), "dd MMM yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>

            <p
              className={`text-sm font-semibold ${
                transaction.type === "INCOME"
                  ? "text-emerald-500"
                  : "text-red-500"
              }`}
            >
              {transaction.type === "INCOME" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
