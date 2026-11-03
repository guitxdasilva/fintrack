import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProjectionMonth } from "@/lib/projection";
import { hasBalance, lineValue, shortMonth, totalIncome } from "../lib/format";

function Money({ value, estimated }: { value: number; estimated?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn("tabular-nums", estimated && "italic text-muted-foreground")}>
      {estimated && "~"}
      {formatCurrency(value)}
    </span>
  );
}

/** Month-by-month breakdown (also the accessible view of the chart). */
export function ProjectionTable({ months }: { months: ProjectionMonth[] }) {
  const withBalance = hasBalance(months);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mês</TableHead>
            <TableHead className="text-right">Receitas</TableHead>
            <TableHead className="text-right">Parcelas</TableHead>
            <TableHead className="text-right">Fixas</TableHead>
            <TableHead className="text-right">Variáveis</TableHead>
            <TableHead className="text-right">Estimado</TableHead>
            <TableHead className="text-right">Resultado</TableHead>
            <TableHead className="text-right">{withBalance ? "Saldo" : "Acumulado"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((m) => (
            <TableRow key={`${m.year}-${m.month}`}>
              <TableCell className="font-medium">{shortMonth(m)}</TableCell>
              <TableCell className="text-right">
                <Money value={totalIncome(m)} estimated={m.income.committed === 0 && m.income.estimated > 0} />
              </TableCell>
              <TableCell className="text-right">
                <Money value={m.expense.installments} />
              </TableCell>
              <TableCell className="text-right">
                <Money value={m.expense.fixed} />
              </TableCell>
              <TableCell className="text-right">
                <Money value={m.expense.variable} />
              </TableCell>
              <TableCell className="text-right">
                <Money value={m.expense.estimated} estimated />
              </TableCell>
              <TableCell className="text-right font-semibold">
                <span className={cn("tabular-nums", m.net < 0 && "text-red-600 dark:text-red-400")}>
                  {formatCurrency(m.net)}
                </span>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold tabular-nums",
                  withBalance && m.balance! < 0 && "text-red-600 dark:text-red-400"
                )}
              >
                {formatCurrency(lineValue(m))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
