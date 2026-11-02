import { ChevronRight, CreditCard } from "lucide-react";
import { Spinner } from "@/common/components/ui/spinner";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceData } from "@/types";
import type { CardGroup } from "../../lib/month-transactions";

interface CardGroupRowProps {
  group: CardGroup;
  /** The card's invoice for the month, when it has a closing day. */
  invoice?: InvoiceData;
  invoiceLoading: boolean;
  onClick: () => void;
}

export function CardGroupRow({ group, invoice, invoiceLoading, onClick }: CardGroupRowProps) {
  const transactions = invoice?.transactions ?? group.transactions;
  const total = invoice?.total ?? group.total;
  const paidCount = transactions.filter((t) => t.type === "EXPENSE" && t.paid).length;
  const loading = invoiceLoading && group.hasClosingDay && !invoice;

  return (
    <button
      onClick={onClick}
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
          {loading ? (
            "Carregando fatura..."
          ) : (
            <>
              {transactions.length} transação(ões)
              {paidCount > 0 && <> · {paidCount} paga(s)</>}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {loading ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <p className="text-sm font-semibold text-red-500">-{formatCurrency(total)}</p>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  );
}
