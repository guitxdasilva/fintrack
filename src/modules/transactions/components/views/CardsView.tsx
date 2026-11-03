"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarRange, CheckCircle2, CreditCard, LayoutGrid, Loader2, Plus, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { EmptyState } from "@/common/components/ui/empty-state";
import { Skeleton } from "@/common/components/ui/skeleton";
import type { MonthValue } from "@/common/components/MonthNavigator";
import { errorMessage } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { useCardInvoice, useCards, usePayInvoice } from "@/modules/cards/hooks/useCards";
import type { Card, Transaction } from "@/types";
import { groupByDay, summarize, withoutLinkedRefunds } from "../../lib/statement";
import { CardRefundDialog } from "../statement/CardRefundDialog";
import { StatementView } from "../statement/StatementView";
import { SummaryStrip } from "../statement/SummaryStrip";
import type { TransactionDefaults } from "../TransactionForm";

/** `card` URL value for the side-by-side overview of every card. */
export const ALL_CARDS = "all";

interface CardsViewProps {
  month: MonthValue;
  /** Selected card id or ALL_CARDS (kept in the URL); defaults to ALL_CARDS. */
  cardId: string | null;
  onCardChange: (cardId: string) => void;
  onEdit: (t: Transaction) => void;
  onNew: (defaults: TransactionDefaults) => void;
}

/** A card's invoice for the month: purchases grouped by purchase day, totals, pay action. */
function useCardInvoiceState(card: Card, month: MonthValue) {
  const [today] = useState(() => new Date());
  const { data: invoice, isLoading } = useCardInvoice(card.id, month.month, month.year);
  const payInvoice = usePayInvoice();

  const transactions = useMemo(() => invoice?.transactions ?? [], [invoice]);
  const groups = useMemo(
    () => groupByDay(withoutLinkedRefunds(transactions), today, (t) => t.purchaseDate ?? t.date),
    [transactions, today]
  );
  const summary = summarize(transactions);

  async function pay() {
    try {
      const res = await payInvoice.mutateAsync({ cardId: card.id, ...month });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao pagar fatura"));
    }
  }

  return {
    invoice,
    isLoading,
    groups,
    summary,
    total: invoice?.total ?? summary.expense,
    pay,
    paying: payInvoice.isPending,
  };
}

const newPurchase = (card: Card): TransactionDefaults => ({
  paymentType: "CARD",
  cardId: card.id,
  cardType: "CREDIT",
});

interface CardPanelProps {
  card: Card;
  month: MonthValue;
  onEdit: (t: Transaction) => void;
  onNew: (defaults: TransactionDefaults) => void;
}

function PayButton({
  card,
  onPay,
  paying,
  compact,
}: {
  card: Card;
  onPay: () => void;
  paying: boolean;
  compact?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onPay}
      disabled={paying}
      className="gap-1.5"
      aria-label={`Pagar fatura do ${card.name}`}
    >
      {paying ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" />
      )}
      {compact ? "Pagar" : "Pagar fatura"}
    </Button>
  );
}

function NewPurchaseButton({
  card,
  onNew,
  compact,
}: {
  card: Card;
  onNew: CardPanelProps["onNew"];
  compact?: boolean;
}) {
  return (
    <Button
      size="sm"
      className="gap-1.5"
      onClick={() => onNew(newPurchase(card))}
      aria-label={`Nova compra no ${card.name}`}
    >
      <Plus className="h-3.5 w-3.5" />
      {compact ? "Compra" : "Nova compra"}
    </Button>
  );
}

function RefundButton({ card, onClick, compact }: { card: Card; onClick: () => void; compact?: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={onClick}
      aria-label={`Reembolso no ${card.name}`}
    >
      <Undo2 className="h-3.5 w-3.5" />
      {compact ? "Reembolso" : "Adicionar reembolso"}
    </Button>
  );
}

/** Column of the side-by-side overview. */
function CardColumn({ card, month, onEdit, onNew }: CardPanelProps) {
  const state = useCardInvoiceState(card, month);
  const [refundOpen, setRefundOpen] = useState(false);

  return (
    <section
      aria-label={`Fatura do ${card.name}`}
      className="flex min-w-0 flex-col rounded-lg border bg-card shadow-sm"
    >
      <header className="space-y-3 border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate font-semibold">
              <span aria-hidden>{card.icon || "💳"}</span>
              <span className="truncate">{card.name}</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {state.invoice ? `Fatura ${state.invoice.period.label}` : "Mês inteiro"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold tabular-nums" data-testid="invoice-total">
              {formatCurrency(state.total)}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {state.summary.pending > 0
                ? `${formatCurrency(state.summary.pending)} pendente`
                : state.total > 0
                  ? "Paga"
                  : state.total < 0
                    ? "Saldo a favor"
                    : "Sem compras"}
            </p>
            {state.summary.refunds > 0 && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(state.summary.refunds)} reembolsado
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {state.summary.pending > 0 && (
            <PayButton card={card} onPay={state.pay} paying={state.paying} compact />
          )}
          <NewPurchaseButton card={card} onNew={onNew} compact />
          <RefundButton card={card} onClick={() => setRefundOpen(true)} compact />
        </div>
      </header>
      <CardRefundDialog card={refundOpen ? card : null} month={month} onClose={() => setRefundOpen(false)} />
      <div className="max-h-[520px] flex-1 overflow-y-auto">
        <StatementView
          groups={state.groups}
          loading={state.isLoading}
          onEdit={onEdit}
          hideCard
          compact
          empty={
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhuma compra nesta fatura
            </p>
          }
        />
      </div>
    </section>
  );
}

/** One card in detail (when picked from the chips). */
function CardDetail({ card, month, onEdit, onNew }: CardPanelProps) {
  const state = useCardInvoiceState(card, month);
  const [refundOpen, setRefundOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {state.invoice && (
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <CalendarRange className="h-3.5 w-3.5" />
              Fatura: {state.invoice.period.label}
            </Badge>
          )}
          {!card.closingDayType && (
            <span className="text-xs text-muted-foreground">
              Sem dia de fechamento: mostrando o mês inteiro
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {state.summary.pending > 0 && (
            <PayButton card={card} onPay={state.pay} paying={state.paying} />
          )}
          <NewPurchaseButton card={card} onNew={onNew} />
          <RefundButton card={card} onClick={() => setRefundOpen(true)} />
        </div>
      </div>
      <CardRefundDialog card={refundOpen ? card : null} month={month} onClose={() => setRefundOpen(false)} />

      <SummaryStrip
        items={[
          { label: "Total da fatura", value: state.total },
          { label: "Pago", value: state.summary.paid, tone: "muted" },
          { label: "Pendente", value: state.summary.pending, tone: "muted" },
          { label: "Reembolsos", value: state.summary.refunds, tone: "income" },
        ]}
      />

      <div className="rounded-lg border bg-card shadow-sm">
        <StatementView
          groups={state.groups}
          loading={state.isLoading}
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

function Chip({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
        checked
          ? "border-primary bg-primary/10 font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

/** Every card side by side, or one card in detail. */
export function CardsView({ month, cardId, onCardChange, onEdit, onNew }: CardsViewProps) {
  const { data: cards = [], isLoading } = useCards();
  const selected = cards.find((c) => c.id === cardId) ?? null;

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  if (cards.length === 0) {
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
        <Chip checked={!selected} onClick={() => onCardChange(ALL_CARDS)}>
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
          Todos
        </Chip>
        {cards.map((c) => (
          <Chip key={c.id} checked={selected?.id === c.id} onClick={() => onCardChange(c.id)}>
            <span aria-hidden>{c.icon || "💳"}</span>
            {c.name}
          </Chip>
        ))}
      </div>

      {selected ? (
        <CardDetail card={selected} month={month} onEdit={onEdit} onNew={onNew} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <CardColumn key={c.id} card={c} month={month} onEdit={onEdit} onNew={onNew} />
          ))}
        </div>
      )}
    </div>
  );
}
