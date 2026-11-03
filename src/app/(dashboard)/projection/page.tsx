"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { EmptyState } from "@/common/components/ui/empty-state";
import { cn, formatCurrency } from "@/lib/utils";
import { useProjection } from "@/modules/dashboard/hooks/useDashboard";
import { ProjectionChart } from "@/modules/projection/components/ProjectionChart";
import { ProjectionSummary } from "@/modules/projection/components/ProjectionSummary";
import { ProjectionTable } from "@/modules/projection/components/ProjectionTable";

const MONTH_OPTIONS = [3, 6, 12];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="flex items-center rounded-lg border p-0.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <Button
          key={String(o.value)}
          variant={value === o.value ? "default" : "ghost"}
          size="sm"
          className="h-8"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

export default function ProjectionPage() {
  const [now] = useState(() => new Date());
  const [months, setMonths] = useState(6);
  const [estimates, setEstimates] = useState(true);

  const { data, isLoading, isError, isFetching } = useProjection(
    now.getMonth(),
    now.getFullYear(),
    months,
    estimates
  );

  useEffect(() => {
    if (isError) toast.error("Erro ao calcular projeção");
  }, [isError]);

  const hasData = data?.months.some((m) => m.net !== 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projeção</h1>
          <p className="text-muted-foreground mt-1">Como devem ficar os próximos meses</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Período"
            value={months}
            onChange={setMonths}
            options={MONTH_OPTIONS.map((m) => ({ value: m, label: `${m} meses` }))}
          />
          <Segmented
            label="Estimativas"
            value={estimates ? "on" : "off"}
            onChange={(v) => setEstimates(v === "on")}
            options={[
              { value: "on", label: "Com estimativas" },
              { value: "off", label: "Só comprometido" },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      ) : !data || !hasData ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={TrendingUp}
              title="Nada para projetar ainda"
              description="Cadastre parcelas, despesas ou receitas fixas (como o salário) para ver a projeção dos próximos meses."
            />
          </CardContent>
        </Card>
      ) : (
        <div className={cn("space-y-6 transition-opacity", isFetching && "opacity-60")}>
          <ProjectionSummary months={data.months} />

          <Card>
            <CardHeader>
              <CardTitle>Resultado mês a mês</CardTitle>
              <CardDescription>
                Receitas menos despesas de cada mês, e o acumulado desde{" "}
                {now.toLocaleDateString("pt-BR", { month: "long" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectionChart months={data.months} />
              {estimates && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Estimativas pela média dos últimos {data.averages.historyMonths} meses: gastos
                  variáveis de {formatCurrency(data.averages.variableExpense)}/mês (completa o que
                  ainda não foi lançado) e receitas de {formatCurrency(data.averages.variableIncome)}
                  /mês, só em meses sem nenhuma receita lançada. Cadastre o salário como receita
                  fixa para uma projeção mais precisa.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhamento</CardTitle>
              <CardDescription>Valores estimados aparecem com ~</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <ProjectionTable months={data.months} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
