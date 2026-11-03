import { cn, formatCurrency } from "@/lib/utils";

export interface SummaryItem {
  label: string;
  value: number;
  tone?: "income" | "expense" | "muted";
}

/** Compact totals row at the top of a transactions view. */
export function SummaryStrip({ items }: { items: SummaryItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-card px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd
            className={cn(
              "text-base font-semibold tabular-nums",
              item.tone === "income" && "text-emerald-600 dark:text-emerald-400",
              item.tone === "muted" && "text-muted-foreground"
            )}
          >
            {formatCurrency(item.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
