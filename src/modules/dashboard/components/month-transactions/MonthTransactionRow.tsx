import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpCircle, CheckCircle2, Circle, Pin } from "lucide-react";
import { Badge } from "@/common/components/ui/badge";
import { cn, formatCurrency, truncateText } from "@/lib/utils";
import type { PaymentType, Transaction } from "@/types";
import { PAYMENT_TYPE_ICONS, PAYMENT_TYPE_LABELS } from "@/types";

interface MonthTransactionRowProps {
  transaction: Transaction;
  selected: boolean;
  onToggle: (id: string) => void;
  /** "list": dashboard list. "invoice": card invoice dialog (bordered, card details). */
  variant: "list" | "invoice";
}

export function MonthTransactionRow({
  transaction: t,
  selected,
  onToggle,
  variant,
}: MonthTransactionRowProps) {
  const isExpense = t.type === "EXPENSE";
  const isInvoice = variant === "invoice";
  const iconBox = isInvoice ? "h-9 w-9" : "h-10 w-10";
  const iconSize = isInvoice ? "h-4 w-4" : "h-5 w-5";

  return (
    <div
      className={cn(
        "flex items-center rounded-lg p-3",
        isInvoice ? "gap-3 border" : "gap-4",
        t.paid && "opacity-60",
        selected && "bg-primary/5 ring-1 ring-primary/20"
      )}
    >
      {isExpense ? (
        <button
          onClick={() => onToggle(t.id)}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-colors",
            iconBox,
            t.paid ? "bg-emerald-500/10" : selected ? "bg-primary/10" : "bg-red-500/10"
          )}
          title={t.paid ? "Desmarcar como pago" : "Selecionar para marcar como pago"}
        >
          {t.paid ? (
            <CheckCircle2 className={cn(iconSize, "text-emerald-500")} />
          ) : selected ? (
            <CheckCircle2 className={cn(iconSize, "text-primary")} />
          ) : (
            <Circle className={cn(iconSize, "text-red-400")} />
          )}
        </button>
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-emerald-500/10",
            iconBox
          )}
        >
          <ArrowUpCircle className={cn(iconSize, "text-emerald-500")} />
        </div>
      )}

      <div className={cn("flex-1 min-w-0", isInvoice ? "space-y-0.5" : "space-y-1")}>
        <div className="flex items-center gap-1.5">
          <p
            className={cn(
              "text-sm font-medium truncate",
              !isInvoice && "leading-none",
              t.paid && "line-through decoration-muted-foreground/50"
            )}
            title={t.description}
          >
            {truncateText(t.description)}
          </p>
          {t.isFixed && (
            <Badge
              variant="outline"
              className="shrink-0 text-xs font-normal gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800"
            >
              <Pin className="h-3 w-3" />
              Fixa
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="font-normal text-xs">
            {t.category?.icon} {t.category?.name}
          </Badge>
          {!isInvoice && t.paymentType && t.paymentType !== "CARD" && (
            <span className="text-xs text-muted-foreground">
              {PAYMENT_TYPE_ICONS[t.paymentType as PaymentType]}{" "}
              {PAYMENT_TYPE_LABELS[t.paymentType as PaymentType]}
            </span>
          )}
          {isInvoice && t.cardType && (
            <Badge variant="outline" className="text-xs font-normal">
              {t.cardType === "CREDIT" ? "Crédito" : "Débito"}
            </Badge>
          )}
          {isInvoice && t.installments && (
            <Badge variant="outline" className="text-xs font-normal">
              {t.currentInstallment}/{t.installments}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {format(new Date(t.date), isInvoice ? "dd MMM yyyy" : "dd MMM", { locale: ptBR })}
            {t.purchaseDate && (
              <span className="ml-1 text-muted-foreground/70">
                (Compra: {format(new Date(t.purchaseDate), "dd MMM", { locale: ptBR })})
              </span>
            )}
          </span>
        </div>
      </div>

      <p
        className={cn(
          "text-sm font-semibold whitespace-nowrap",
          t.type === "INCOME" ? "text-emerald-500" : "text-red-500"
        )}
      >
        {t.type === "INCOME" ? "+" : "-"}
        {formatCurrency(t.amount)}
      </p>
    </div>
  );
}
