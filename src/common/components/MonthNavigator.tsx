import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/common/components/ui/button";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface MonthValue {
  month: number;
  year: number;
}

export function shiftMonth({ month, year }: MonthValue, delta: number): MonthValue {
  const idx = year * 12 + month + delta;
  return { month: ((idx % 12) + 12) % 12, year: Math.floor(idx / 12) };
}

interface MonthNavigatorProps {
  value: MonthValue;
  onChange: (value: MonthValue) => void;
}

/** "‹ Novembro 2026 ›" with a "Hoje" shortcut when away from the current month. */
export function MonthNavigator({ value, onChange }: MonthNavigatorProps) {
  const now = new Date();
  const isCurrent = value.month === now.getMonth() && value.year === now.getFullYear();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(shiftMonth(value, -1))}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex min-w-[170px] items-center justify-center gap-2 rounded-lg border px-4 py-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {MONTH_NAMES[value.month]} {value.year}
        </span>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(shiftMonth(value, 1))}
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrent && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => onChange({ month: now.getMonth(), year: now.getFullYear() })}
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
