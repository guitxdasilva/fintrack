import { AlertTriangle, CalendarClock, Layers, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/common/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProjectionMonth } from "@/lib/projection";
import { longMonth, shortMonth } from "../lib/format";

function Tile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function ProjectionSummary({ months }: { months: ProjectionMonth[] }) {
  const last = months[months.length - 1];
  const worst = months.reduce((a, b) => (b.net < a.net ? b : a));
  const negative = months.filter((m) => m.net < 0).length;
  const installments = months.reduce((sum, m) => sum + m.expense.installments, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        icon={Wallet}
        label="Acumulado no período"
        value={formatCurrency(last.cumulative)}
        hint={`Soma dos resultados até ${longMonth(last)}`}
      />
      <Tile
        icon={AlertTriangle}
        label="Pior mês"
        value={formatCurrency(worst.net)}
        hint={`Resultado de ${shortMonth(worst)}`}
      />
      <Tile
        icon={CalendarClock}
        label="Meses no negativo"
        value={`${negative} de ${months.length}`}
        hint={negative === 0 ? "Nenhum mês fecha no vermelho" : "Resultado mensal abaixo de zero"}
      />
      <Tile
        icon={Layers}
        label="Parcelas no período"
        value={formatCurrency(installments)}
        hint="Já comprometido em compras parceladas"
      />
    </div>
  );
}
