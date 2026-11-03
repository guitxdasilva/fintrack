"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pin, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { ConfirmDialog } from "@/common/components/ConfirmDialog";
import { errorMessage } from "@/lib/api-client";
import { formatCurrency, truncateText } from "@/lib/utils";
import {
  useApplyRecurring,
  useDismissRecurring,
  useRecurringSuggestions,
  type RecurringSuggestion,
} from "../hooks/useRecurrences";

const monthYear = (iso: string) => format(new Date(iso), "MMM/yyyy", { locale: ptBR });

function amountLabel(s: RecurringSuggestion) {
  return s.amountRange
    ? `~${formatCurrency(s.amount)}/mês (varia de ${formatCurrency(s.amountRange.min)} a ${formatCurrency(s.amountRange.max)})`
    : `${formatCurrency(s.amount)}/mês`;
}

function SuggestionList({ suggestions }: { suggestions: RecurringSuggestion[] }) {
  const [target, setTarget] = useState<RecurringSuggestion | null>(null);
  const apply = useApplyRecurring();
  const dismiss = useDismissRecurring();

  async function handleApply() {
    if (!target) return;
    try {
      const res = await apply.mutateAsync(target);
      toast.success(res.data.message);
      setTarget(null);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao tornar fixa"));
    }
  }

  async function handleDismiss(s: RecurringSuggestion) {
    try {
      await dismiss.mutateAsync(s);
      toast.success("Sugestão ignorada");
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao ignorar sugestão"));
    }
  }

  return (
    <>
      <ul className="divide-y">
        {suggestions.map((s) => (
          <li
            key={`${s.type}:${s.key}`}
            className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={s.description}>
                {s.categoryIcon} {truncateText(s.description)}
                {s.type === "INCOME" && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">receita</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {amountLabel(s)} · em {s.monthsSeen} meses
                {s.cardName && ` · ${s.cardName}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(s)}
                disabled={dismiss.isPending}
              >
                Ignorar
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setTarget(s)}>
                <Pin className="h-3.5 w-3.5" />
                Tornar fixa
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(null)}
        title={`Tornar "${truncateText(target?.description ?? "", 30)}" fixa?`}
        variant="default"
        confirmLabel="Tornar fixa"
        loadingLabel="Salvando..."
        loading={apply.isPending}
        onConfirm={handleApply}
        description={
          target && (
            <>
              Os {target.occurrences} lançamentos anteriores passam a ser fixos, e serão criados
              lançamentos de <strong>{formatCurrency(target.amount)}</strong> por mês de{" "}
              {monthYear(target.firstNewDate)} em diante, por {target.seriesMonths} meses (meses que
              já têm esse lançamento são pulados). Depois você pode editar ou excluir a série
              inteira.
            </>
          )
        }
      />
    </>
  );
}

const intro =
  "Lançamentos que se repetem todo mês. Torná-los fixos deixa a projeção mais precisa: eles saem da estimativa de gastos variáveis e passam a contar nos meses futuros.";

/**
 * Recurring-transaction suggestions. "card": full list (projection page).
 * "banner": one line that opens the list in a dialog (transactions page).
 */
export function RecurringSuggestions({ variant }: { variant: "card" | "banner" }) {
  const { data: suggestions = [] } = useRecurringSuggestions();
  const [open, setOpen] = useState(false);

  if (suggestions.length === 0) return null;

  const title = `${suggestions.length} lançamento${suggestions.length > 1 ? "s parecem recorrentes" : " parece recorrente"}`;

  if (variant === "card") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
          <CardDescription>{intro}</CardDescription>
        </CardHeader>
        <CardContent>
          <SuggestionList suggestions={suggestions} />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Repeat className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{title}</strong> e não estão marcados como fixos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Revisar
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{intro}</DialogDescription>
          </DialogHeader>
          <SuggestionList suggestions={suggestions} />
        </DialogContent>
      </Dialog>
    </>
  );
}
