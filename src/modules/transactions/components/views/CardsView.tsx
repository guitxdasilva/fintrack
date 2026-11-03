"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, CheckCircle2, CreditCard, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { EmptyState } from "@/common/components/ui/empty-state";
import { Skeleton } from "@/common/components/ui/skeleton";
import type { MonthValue } from "@/common/components/MonthNavigator";
import { errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useCardInvoice, useCards, usePayInvoice } from "@/modules/cards/hooks/useCards";
import type { Transaction } from "@/types";
import { groupByDay, summarize } from "../../lib/statement";
import { StatementView } from "../statement/StatementView";
import { SummaryStrip } from "../statement/SummaryStrip";
import type { TransactionDefaults } from "../TransactionForm";

interface CardsViewProps {
  month: MonthValue;
  /** Selected card id (kept in the URL); defaults to the first card. */
  cardId: string | null;
  onCardChange: (cardId: string) => void;
  onEdit: (t: Transaction) => void;
  onNew: (defaults: TransactionDefaults) => void;
}

/** One card's invoice for the month: period, totals, pay button and its purchases. */
export function CardsView({ month, cardId, onCardChange, onEdit, onNew }: CardsViewProps) {
  const [today] = useState(() => new Date());
  const { data: cards = [], isLoading: cardsLoading } = useCards();
  const card = cards.find((c) => c.id === cardId) ?? cards[0];

  const { data: invoice, isLoading } = useCardInvoice(card?.id, month.month, month.year);
  const payInvoice = usePayInvoice();

  const transactions = useMemo(() => invoice?.transactions ?? [], [invoice]);
  const groups = useMemo(
    () => groupByDay(transactions, today, (t) => t.purchaseDate ?? t.date),
    [transactions, today]
  );
  const summary = summarize(transactions);

  async function handlePay() {
    if (!card) return;
    try {
      const res = await payInvoice.mutateAsync({ cardId: card.id, ...month });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao pagar fatura"));
    }
  }

  if (cardsLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  if (!card) {
    return (
      <div className="rounded-lg border bg-card shadow-sm">
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão cadastrado"
          description="Cadastre seus cartões para acompanhar as faturas aqui"
        />
        <div className="flex justify-center pb-6">
          <Button asChild variant="outline">
            <Link href="/cards">Cadastrar cartão</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cartão">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === card.id}
            onClick={() => onCardChange(c.id)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              c.id === card.id
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <span aria-hidden>{c.icon || "💳"}</span>
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {invoice && (
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <CalendarRange className="h-3.5 w-3.5" />
              Fatura: {invoice.period.label}
            </Badge>
          )}
          {!card.closingDayType && (
            <span className="text-xs text-muted-foreground">
              Sem dia de fechamento: mostrando o mês inteiro
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {summary.pending > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePay}
              disabled={payInvoice.isPending}
              className="gap-1.5"
            >
              {payInvoice.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Pagar fatura
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => onNew({ paymentType: "CARD", cardId: card.id, cardType: "CREDIT" })}
          >
            <Plus className="h-3.5 w-3.5" />
            Nova compra
          </Button>
        </div>
      </div>

      <SummaryStrip
        items={[
          { label: "Total da fatura", value: invoice?.total ?? summary.expense },
          { label: "Pago", value: summary.paid, tone: "muted" },
          { label: "Pendente", value: summary.pending, tone: "muted" },
          { label: "Estornos/créditos", value: summary.income, tone: "income" },
        ]}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <StatementView
          groups={groups}
          loading={isLoading}
          onEdit={onEdit}
          hideCard
          empty={
            <EmptyState
              icon={CreditCard}
              title="Fatura vazia"
              description={`Nenhuma compra no ${card.name} nesta fatura`}
            />
          }
        />
      </div>
    </div>
  );
}
