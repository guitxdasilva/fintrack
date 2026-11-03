"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { ProjectionMonth } from "@/lib/projection";
import {
  PROJECTION_COLORS,
  longMonth,
  shortMonth,
  totalExpense,
  totalIncome,
} from "../lib/format";

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  if (value === 0) return null;
  return (
    <div className="flex justify-between gap-6 text-xs">
      <span className={muted ? "text-muted-foreground italic" : "text-muted-foreground"}>{label}</span>
      <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

function ProjectionTooltip({ month }: { month: ProjectionMonth }) {
  return (
    <div className="min-w-56 space-y-2 rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{longMonth(month)}</p>
      <div className="space-y-0.5">
        <Row label="Receitas" value={month.income.committed} />
        <Row label="Receitas (estimadas)" value={month.income.estimated} muted />
        <Row label="Parcelas" value={month.expense.installments} />
        <Row label="Despesas fixas" value={month.expense.fixed} />
        <Row label="Despesas variáveis" value={month.expense.variable} />
        <Row label="Variáveis (estimadas)" value={month.expense.estimated} muted />
      </div>
      <div className="space-y-0.5 border-t pt-2">
        <div className="flex justify-between gap-6 text-xs">
          <span className="text-muted-foreground">Resultado do mês</span>
          <span className="font-semibold tabular-nums">{formatCurrency(month.net)}</span>
        </div>
        <div className="flex justify-between gap-6 text-xs">
          <span className="text-muted-foreground">Acumulado</span>
          <span className="font-semibold tabular-nums">{formatCurrency(month.cumulative)}</span>
        </div>
      </div>
    </div>
  );
}

function compactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function ProjectionChart({ months }: { months: ProjectionMonth[] }) {
  const data = months.map((m) => ({
    ...m,
    label: shortMonth(m),
    income: totalIncome(m),
    expense: totalExpense(m),
  }));
  const lastIndex = data.length - 1;

  return (
    <div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 24, right: 72, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" className="text-xs" tickLine={false} axisLine={false} />
            <YAxis
              className="text-xs"
              tickLine={false}
              axisLine={false}
              tickFormatter={compactCurrency}
              width={72}
            />
            <ReferenceLine y={0} className="stroke-muted-foreground" strokeOpacity={0.5} />
            <Tooltip
              cursor={{ className: "fill-muted", opacity: 0.4 }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ProjectionTooltip month={payload[0].payload as ProjectionMonth} />
                ) : null
              }
            />
            {/* Recharts draws negative bars from the value end, so [4,4,0,0]
                rounds the end away from the zero line for both signs. */}
            <Bar dataKey="net" maxBarSize={36} radius={[4, 4, 0, 0]} name="Resultado do mês" isAnimationActive={false}>
              {data.map((m, i) => (
                <Cell
                  key={i}
                  fill={m.net >= 0 ? PROJECTION_COLORS.positive : PROJECTION_COLORS.negative}
                />
              ))}
            </Bar>
            <Line
              dataKey="cumulative"
              name="Acumulado"
              isAnimationActive={false}
              type="monotone"
              stroke={PROJECTION_COLORS.cumulative}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, fill: PROJECTION_COLORS.cumulative, className: "stroke-background" }}
              activeDot={{ r: 5, strokeWidth: 2, fill: PROJECTION_COLORS.cumulative, className: "stroke-background" }}
            >
              {/* Direct label on the last point only, placed past the bar */}
              <LabelList
                dataKey="cumulative"
                content={({ x, y, value, index }) =>
                  index === lastIndex ? (
                    <text
                      x={Number(x) + 22}
                      y={Number(y)}
                      dy={4}
                      className="fill-foreground text-xs font-medium"
                    >
                      {compactCurrency(Number(value))}
                    </text>
                  ) : null
                }
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: PROJECTION_COLORS.positive }} />
          Resultado positivo
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: PROJECTION_COLORS.negative }} />
          Resultado negativo
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded" style={{ backgroundColor: PROJECTION_COLORS.cumulative }} />
          Acumulado no período
        </span>
      </div>
    </div>
  );
}
