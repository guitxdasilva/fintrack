"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  ChevronRight,
  CalendarRange,
  Check,
  Circle,
  CheckCircle2,
  Loader2,
  Pin,
} from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/common/components/ui/button";
import { Separator } from "@/common/components/ui/separator";
import { Spinner } from "@/common/components/ui/spinner";
import { EmptyState } from "@/common/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS } from "@/types";
import type { PaymentType } from "@/types";

interface CardGroup {
  cardId: string;
  cardName: string;
  cardIcon: string;
  cardType: string | null | undefined;
  hasClosingDay: boolean;
  total: number;
  transactions: Transaction[];
}

interface InvoiceData {
  transactions: Transaction[];
  total: number;
  period: { start: string; end: string; label: string };
  effectiveClosing: number | null;
}

interface MonthTransactionsProps {
  transactions: Transaction[];
  month: number;
  year: number;
  isLoading?: boolean;
  onDataChange?: () => void;
}

export function MonthTransactions({
  transactions,
  month,
  year,
  isLoading,
  onDataChange,
}: MonthTransactionsProps) {
  const [selectedCard, setSelectedCard] = useState<CardGroup | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModalSelection(id: string) {
    setModalSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmPaid(ids: Set<string>, clearFn: () => void) {
    setConfirming(true);
    try {
      const results = await Promise.all(
        Array.from(ids).map((id) =>
          fetch(`/api/transactions/${id}/toggle-paid`, { method: "PATCH" })
        )
      );
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast.success(`${ids.size} transação(ões) atualizada(s)`);
      } else {
        toast.error("Erro ao atualizar algumas transações");
      }
      clearFn();
      onDataChange?.();
    } catch {
      toast.error("Erro ao atualizar transações");
    } finally {
      setConfirming(false);
    }
  }

  // Fetch invoice data when a card with closing day is selected
  const fetchInvoice = useCallback(
    async (cardId: string) => {
      setInvoiceLoading(true);
      try {
        const res = await fetch(
          `/api/cards/${cardId}/invoice?month=${month}&year=${year}`
        );
        const json = await res.json();
        if (json.data) {
          setInvoiceData(json.data);
        }
      } catch {
        setInvoiceData(null);
      } finally {
        setInvoiceLoading(false);
      }
    },
    [month, year]
  );

  function handleCardClick(group: CardGroup) {
    setSelectedCard(group);
    setInvoiceData(null);
    if (group.hasClosingDay) {
      fetchInvoice(group.cardId);
    }
  }

  function handleCloseModal() {
    setSelectedCard(null);
    setInvoiceData(null);
    setModalSelectedIds(new Set());
  }

  // Use invoice transactions if available, otherwise use group transactions
  const activeTransactions = useMemo(() => {
    if (invoiceData) return invoiceData.transactions;
    return selectedCard?.transactions ?? [];
  }, [invoiceData, selectedCard]);

  const activeTotal = invoiceData ? invoiceData.total : (selectedCard?.total ?? 0);

  // Compute category chart data for the selected card
  const cardCategoryData = useMemo(() => {
    if (!selectedCard) return [];

    const catMap = new Map<string, { name: string; color: string; total: number }>();
    for (const t of activeTransactions) {
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
  }, [selectedCard, activeTransactions]);

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
            cardType: t.cardType,            hasClosingDay: !!((t.card as unknown as Record<string, unknown>).closingDayType),            total: t.type === "EXPENSE" ? t.amount : -t.amount,
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

  // Merge into a single sorted list: cards first, then individual transactions by date
  type ListItem =
    | { kind: "card"; data: CardGroup }
    | { kind: "transaction"; data: Transaction };

  const listItems: ListItem[] = [
    ...cardGroups.map((g) => ({ kind: "card" as const, data: g })),
    ...individualItems
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
        <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
          {listItems.map((item) => {
            if (item.kind === "card") {
              const group = item.data;
              return (
                <button
                  key={`card-${group.cardId}`}
                  onClick={() => handleCardClick(group)}
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
                      {group.transactions.length} transação(ões)
                      {group.transactions.some((t) => t.type === "EXPENSE") && (
                        <>
                          {" · "}
                          {group.transactions.filter((t) => t.type === "EXPENSE" && t.paid).length} paga(s)
                        </>
                      )}
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
            const isExpense = transaction.type === "EXPENSE";
            const isSelected = selectedIds.has(transaction.id);
            return (
              <div
                key={transaction.id}
                className={`flex items-center gap-4 rounded-lg p-3 ${transaction.paid ? "opacity-60" : ""} ${isSelected ? "bg-primary/5 ring-1 ring-primary/20 rounded-lg" : ""}`}
              >
                {isExpense ? (
                  <button
                    onClick={() => toggleSelection(transaction.id)}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                      transaction.paid
                        ? "bg-emerald-500/10"
                        : isSelected
                          ? "bg-primary/10"
                          : "bg-red-500/10"
                    }`}
                    title={transaction.paid ? "Desmarcar como pago" : "Selecionar para marcar como pago"}
                  >
                    {transaction.paid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-red-400" />
                    )}
                  </button>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <p className={`text-sm font-medium leading-none truncate ${transaction.paid ? "line-through decoration-muted-foreground/50" : ""}`}>
                    {transaction.description}
                    {transaction.isFixed && (
                      <Badge variant="outline" className="ml-1.5 text-xs font-normal gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
                        <Pin className="h-3 w-3" />
                        Fixa
                      </Badge>
                    )}
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
          {/* Floating confirm bar */}
          {selectedIds.size > 0 && (
            <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t pt-3 pb-1 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selecionada(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={confirming}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmPaid(selectedIds, () => setSelectedIds(new Set()))}
                  disabled={confirming}
                  className="gap-1.5"
                >
                  {confirming ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card detail modal */}
      <Dialog open={!!selectedCard} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">{selectedCard?.cardIcon}</span>
              {selectedCard?.cardName}
              <Badge variant="outline" className="ml-auto font-semibold text-red-500">
                -{formatCurrency(activeTotal)}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Invoice period info */}
          {selectedCard?.hasClosingDay && (
            <div className="flex items-center gap-2">
              {invoiceLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  Carregando fatura...
                </div>
              ) : invoiceData ? (
                <Badge variant="secondary" className="flex items-center gap-1.5 font-normal">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Fatura: {invoiceData.period.label}
                </Badge>
              ) : null}
            </div>
          )}

          {/* Category pie chart */}
          {!invoiceLoading && cardCategoryData.length > 0 && (
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
            {invoiceLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              activeTransactions
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((t) => {
                const isExp = t.type === "EXPENSE";
                const isSel = modalSelectedIds.has(t.id);
                return (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${t.paid ? "opacity-60" : ""} ${isSel ? "ring-1 ring-primary/20 bg-primary/5" : ""}`}
                >
                  {isExp ? (
                    <button
                      onClick={() => toggleModalSelection(t.id)}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                        t.paid
                          ? "bg-emerald-500/10"
                          : isSel
                            ? "bg-primary/10"
                            : "bg-red-500/10"
                      }`}
                      title={t.paid ? "Desmarcar como pago" : "Selecionar"}
                    >
                      {t.paid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : isSel ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-red-400" />
                      )}
                    </button>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={`text-sm font-medium truncate ${t.paid ? "line-through decoration-muted-foreground/50" : ""}`}>
                      {t.description}
                      {t.isFixed && (
                        <Badge variant="outline" className="ml-1.5 text-xs font-normal gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800">
                          <Pin className="h-3 w-3" />
                          Fixa
                        </Badge>
                      )}
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
              );
              })
            )}
          </div>

          {/* Modal confirm bar */}
          {modalSelectedIds.size > 0 && (
            <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t pt-3 pb-1 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {modalSelectedIds.size} selecionada(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalSelectedIds(new Set())}
                  disabled={confirming}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmPaid(modalSelectedIds, () => setModalSelectedIds(new Set()))}
                  disabled={confirming}
                  className="gap-1.5"
                >
                  {confirming ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
