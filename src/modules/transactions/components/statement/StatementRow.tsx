import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, CheckCircle2, MoreVertical, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { cn, formatCurrency, truncateText } from "@/lib/utils";
import type { PaymentType, Transaction } from "@/types";
import { PAYMENT_TYPE_LABELS } from "@/types";
import { refundedOf } from "../../lib/statement";
import { FixedBadge } from "./FixedBadge";

interface StatementRowProps {
  transaction: Transaction;
  selected: boolean;
  /** "select": the icon toggles selection. "paid": it toggles paid (bills checklist). */
  iconAction: "select" | "paid";
  onIconClick: (t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  onTogglePaid: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
  /** Offered on card purchases that still have something to refund. */
  onRefund?: (t: Transaction) => void;
  /** Hide the card name (inside a card's own invoice). */
  hideCard?: boolean;
  /** Tighter layout for narrow columns. */
  compact?: boolean;
}

const dayMonth = (iso: string) => format(new Date(iso), "dd/MM", { locale: ptBR });

function details(t: Transaction, hideCard: boolean): string[] {
  const parts = t.isRefund ? ["Reembolso", t.category?.name ?? "Sem categoria"] : [t.category?.name ?? "Sem categoria"];
  if (t.paymentType === "CARD") {
    if (!hideCard && t.card) parts.push(t.card.name);
    if (t.cardType) parts.push(t.cardType === "CREDIT" ? "Crédito" : "Débito");
  } else if (t.paymentType) {
    parts.push(PAYMENT_TYPE_LABELS[t.paymentType as PaymentType]);
  }
  if (t.installments && !t.isFixed) parts.push(`${t.currentInstallment}/${t.installments}`);
  if (t.purchaseDate) {
    parts.push(`${t.isRefund ? "em" : "Compra"} ${dayMonth(t.purchaseDate)}`);
  }
  return parts;
}

/** One bank-statement line: category icon, description, details, amount, actions. */
export function StatementRow({
  transaction: t,
  selected,
  iconAction,
  onIconClick,
  onEdit,
  onTogglePaid,
  onDelete,
  onRefund,
  hideCard = false,
  compact = false,
}: StatementRowProps) {
  const isExpense = t.type === "EXPENSE";
  const paidMark = isExpense && t.paid;
  const refunded = refundedOf(t);
  const fullyRefunded = isExpense && refunded > 0 && refunded >= t.amount;
  const canRefund = !!onRefund && isExpense && t.paymentType === "CARD" && !fullyRefunded;

  const iconTitle =
    iconAction === "paid"
      ? t.paid
        ? "Desmarcar como paga"
        : "Marcar como paga"
      : selected
        ? "Desmarcar"
        : "Selecionar";

  return (
    <li
      className={cn(
        "group flex items-center rounded-lg transition-colors",
        compact ? "gap-2 px-1.5 py-2" : "gap-3 px-2 py-2.5 sm:px-3",
        selected ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"
      )}
    >
      <button
        type="button"
        onClick={() => onIconClick(t)}
        title={iconTitle}
        aria-label={`${iconTitle}: ${t.description}`}
        aria-pressed={iconAction === "paid" ? !!t.paid : selected}
        disabled={iconAction === "paid" && !isExpense}
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-default",
          compact ? "h-8 w-8 text-base" : "h-10 w-10 text-lg"
        )}
        style={{ backgroundColor: `${t.category?.color ?? "#6366f1"}1f` }}
      >
        {selected ? (
          <Check className="h-5 w-5 text-primary" />
        ) : (
          <span aria-hidden>{t.category?.icon ?? "•"}</span>
        )}
        {paidMark && !selected && (
          <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background text-emerald-500" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onEdit(t)}
        aria-label={`Editar ${t.description}`}
        className={cn("flex min-w-0 flex-1 items-center text-left", compact ? "gap-2" : "gap-3")}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              paidMark && "text-muted-foreground"
            )}
            title={t.description}
          >
            <span className="truncate">{truncateText(t.description)}</span>
            {t.isFixed && <FixedBadge className="shrink-0" />}
          </p>
          <p className="truncate text-xs text-muted-foreground">{details(t, hideCard).join(" · ")}</p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              isExpense ? "text-foreground" : "text-emerald-600 dark:text-emerald-400",
              fullyRefunded && "text-muted-foreground line-through"
            )}
          >
            {isExpense ? "−" : "+"}
            {formatCurrency(t.amount)}
          </p>
          {isExpense && refunded > 0 ? (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
              {fullyRefunded ? "Reembolsado" : `${formatCurrency(refunded)} reembolsado`}
            </p>
          ) : isExpense ? (
            <p className={cn("text-xs", t.paid ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
              {t.paid ? "Pago" : "Pendente"}
            </p>
          ) : null}
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={`Ações de ${t.description}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(t)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          {isExpense && (
            <DropdownMenuItem onClick={() => onTogglePaid(t)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t.paid ? "Desmarcar pago" : "Marcar como pago"}
            </DropdownMenuItem>
          )}
          {canRefund && (
            <DropdownMenuItem onClick={() => onRefund(t)}>
              <Undo2 className="mr-2 h-4 w-4" />
              Reembolsar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(t)} className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
