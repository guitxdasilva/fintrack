import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { cn, formatCurrency, formatDate, getTransactionColor, truncateText } from "@/lib/utils";
import type { PaymentType, Transaction } from "@/types";
import { PAYMENT_TYPE_ICONS, PAYMENT_TYPE_LABELS } from "@/types";
import { FixedBadge } from "./FixedBadge";

interface TransactionCardsProps {
  transactions: Transaction[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

/** Compact card view (mobile, or "cards" mode on desktop). */
export function TransactionCards({
  transactions,
  selected,
  onToggle,
  onEdit,
  onDelete,
}: TransactionCardsProps) {
  return (
    <>
      {transactions.map((t) => {
        const isExpense = t.type === "EXPENSE";
        const isSelected = selected.has(t.id);
        return (
          <div
            key={t.id}
            className={cn("flex items-center gap-3 p-4", t.paid && "opacity-60", isSelected && "bg-primary/5")}
          >
            <button
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                isSelected
                  ? "bg-primary/10"
                  : isExpense && !t.paid
                    ? "bg-red-500/10"
                    : "bg-emerald-500/10"
              )}
              onClick={() => onToggle(t.id)}
              title={isSelected ? "Desmarcar" : "Selecionar"}
            >
              {isSelected ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : isExpense && t.paid ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : isExpense ? (
                <Circle className="h-5 w-5 text-red-400" />
              ) : (
                <Circle className="h-5 w-5 text-emerald-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  t.paid && "line-through decoration-muted-foreground/50"
                )}
                title={t.description}
              >
                {truncateText(t.description)}
                {t.isFixed && <FixedBadge className="ml-1.5" />}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {t.category?.icon} {t.category?.name}
                </span>
                {t.paymentType && (
                  <span className="text-xs text-muted-foreground">
                    • {PAYMENT_TYPE_ICONS[t.paymentType as PaymentType]}{" "}
                    {PAYMENT_TYPE_LABELS[t.paymentType as PaymentType]}
                    {t.paymentType === "CARD" && t.card && <> · {t.card.name}</>}
                    {t.cardType && <> ({t.cardType === "CREDIT" ? "Créd." : "Déb."})</>}
                  </span>
                )}
                {t.installments && (
                  <span className="text-xs text-muted-foreground">
                    • {t.currentInstallment}/{t.installments}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {t.purchaseDate ? `Compra: ${formatDate(t.purchaseDate)}` : formatDate(t.date)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <p className={cn("text-sm font-semibold whitespace-nowrap", getTransactionColor(t.type))}>
                {t.type === "EXPENSE" ? "-" : "+"}
                {formatCurrency(t.amount)}
              </p>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(t)} aria-label={`Editar ${t.description}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500"
                  onClick={() => onDelete(t)}
                  aria-label={`Excluir ${t.description}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
