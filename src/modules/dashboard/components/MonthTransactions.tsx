"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS } from "@/types";
import type { PaymentType } from "@/types";

interface CardGroup {
  cardId: string;
  cardName: string;
  cardIcon: string;
  cardType: string | null | undefined;
  total: number;
  transactions: Transaction[];
}

interface MonthTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function MonthTransactions({
  transactions,
  isLoading,
}: MonthTransactionsProps) {
  const [selectedCard, setSelectedCard] = useState<CardGroup | null>(null);

  // Compute category chart data for the selected card
  const cardCategoryData = useMemo(() => {
    if (!selectedCard) return [];

    const catMap = new Map<string, { name: string; color: string; total: number }>();
    for (const t of selectedCard.transactions) {
      if (t.type !== "EXPENSE") continue;
      const key = t.category?.name || "Outros";
      const existing = catMap.get(key);
      if (existing) {
        existing.total += t.amount;
      } else {
        catMap.set(key, {
          name: `${t.category?.icon || ""} ${key}`.trim(),
          color: t.category?.color || "#6366f1",
          total: t.amount,
        });
      }
    }

    const items = Array.from(catMap.values()).sort((a, b) => b.total - a.total);
    const totalExpense = items.reduce((sum, i) => sum + i.total, 0);
    return items.map((item) => ({
      ...item,
      value: item.total,
      percentage: totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
    }));
  }, [selectedCard]);

  // Build a mixed list: non-card transactions as individual items,
  // card transactions grouped by card
  const { individualItems, cardGroups } = useMemo(() => {
    const individual: Transaction[] = [];
    const groupMap = new Map<string, CardGroup>();

    for (const t of transactions) {
      if (t.paymentType === "CARD" && t.card) {
        const key = t.card.id;
        const existing = groupMap.get(key);
        if (existing) {
          existing.total += t.type === "EXPENSE" ? t.amount : -t.amount;
          existing.transactions.push(t);
        } else {
          groupMap.set(key, {
            cardId: t.card.id,
            cardName: t.card.name,
            cardIcon: t.card.icon || "💳",
            cardType: t.cardType,
            total: t.type === "EXPENSE" ? t.amount : -t.amount,
            transactions: [t],
          });
        }
      } else {
        individual.push(t);
      }
    }

    return {
      individualItems: individual,
      cardGroups: Array.from(groupMap.values()).sort((a, b) => b.total - a.total),
    };
  }, [transactions]);

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

  const hasItems = individualItems.length > 0 || cardGroups.length > 0;

  if (!hasItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transações do Mês</CardTitle>
          <CardDescription>Movimentações e cartões</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma transação registrada
          </p>
        </CardContent>
      </Card>
    );
  }

  // Merge into a single sorted list: cards first, then individual transactions by date
  type ListItem =
    | { kind: "card"; data: CardGroup }
    | { kind: "transaction"; data: Transaction };

  const listItems: ListItem[] = [
    ...cardGroups.map((g) => ({ kind: "card" as const, data: g })),
    ...individualItems
      .slice(0, 10)
      .map((t) => ({ kind: "transaction" as const, data: t })),
  ];

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
        <CardContent className="space-y-2">
          {listItems.map((item) => {
            if (item.kind === "card") {
              const group = item.data;
              return (
                <button
                  key={`card-${group.cardId}`}
                  onClick={() => setSelectedCard(group)}
                  className="flex w-full items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 text-left"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                      <span>{group.cardIcon}</span>
                      {group.cardName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.transactions.length} transação(ões) no cartão
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-red-500">
                      -{formatCurrency(group.total)}
                    </p>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              );
            }

            const transaction = item.data;
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-4 rounded-lg p-3"
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
                  <p className="text-sm font-medium leading-none truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-normal text-xs">
                      {transaction.category?.icon} {transaction.category?.name}
                    </Badge>
                    {transaction.paymentType && transaction.paymentType !== "CARD" && (
                      <span className="text-xs text-muted-foreground">
                        {PAYMENT_TYPE_ICONS[transaction.paymentType as PaymentType]}{" "}
                        {PAYMENT_TYPE_LABELS[transaction.paymentType as PaymentType]}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), "dd MMM", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>

                <p
                  className={`text-sm font-semibold whitespace-nowrap ${
                    transaction.type === "INCOME"
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}

          {individualItems.length > 10 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              e mais {individualItems.length - 10} transações avulsas...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Card detail modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedCard?.cardIcon}</span>
              {selectedCard?.cardName}
              <Badge variant="outline" className="ml-auto font-semibold text-red-500">
                -{formatCurrency(selectedCard?.total ?? 0)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Category pie chart */}
          {cardCategoryData.length > 0 && (
            <>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-[160px] w-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cardCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {cardCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const item = payload[0];
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <p className="text-xs font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.value as number)}
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  {cardCategoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs flex-1 truncate">{item.name}</span>
                      <span className="text-xs font-medium">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />
            </>
          )}

          <div className="space-y-3">
            {selectedCard?.transactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      t.type === "INCOME"
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    {t.type === "INCOME" ? (
                      <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium truncate">
                      {t.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-normal text-xs">
                        {t.category?.icon} {t.category?.name}
                      </Badge>
                      {t.cardType && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {t.cardType === "CREDIT" ? "Crédito" : "Débito"}
                        </Badge>
                      )}
                      {t.installments && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {t.currentInstallment}/{t.installments}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(t.date), "dd MMM yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                  <p
                    className={`text-sm font-semibold whitespace-nowrap ${
                      t.type === "INCOME"
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
