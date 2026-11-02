import { Label } from "@/common/components/ui/label";
import { cn } from "@/lib/utils";
import {
  SERIES_SCOPE_LABELS,
  SERIES_SCOPES,
  type SeriesScope,
} from "@/lib/transactions/series";
import type { Transaction } from "@/types";

/** True for installment purchases and fixed expenses created as a series. */
export function isSeries(transaction: Transaction | null | undefined): boolean {
  return !!transaction?.installmentGroupId;
}

interface SeriesScopePickerProps {
  transaction: Transaction;
  value: SeriesScope;
  onChange: (scope: SeriesScope) => void;
  label: string;
}

/** "Só esta / Esta e as próximas / Todas" for a transaction that belongs to a series. */
export function SeriesScopePicker({ transaction, value, onChange, label }: SeriesScopePickerProps) {
  const position =
    transaction.currentInstallment && transaction.installments
      ? ` (${transaction.currentInstallment}/${transaction.installments})`
      : "";

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {position && <span className="ml-1 font-normal text-muted-foreground">{position}</span>}
      </Label>
      <div className="grid grid-cols-3 gap-1 rounded-lg border p-1" role="radiogroup">
        {SERIES_SCOPES.map((scope) => (
          <button
            key={scope}
            type="button"
            role="radio"
            aria-checked={value === scope}
            onClick={() => onChange(scope)}
            className={cn(
              "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              value === scope
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {SERIES_SCOPE_LABELS[scope]}
          </button>
        ))}
      </div>
    </div>
  );
}
