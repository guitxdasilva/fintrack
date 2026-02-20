"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { Badge } from "@/common/components/ui/badge";
import { formatCurrency, getTransactionColor } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/types";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

type FilterType = "ALL" | "INCOME" | "EXPENSE";

interface BulkDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkDuplicateDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkDuplicateDialogProps) {
  const now = new Date();
  const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
  const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();

  // Source month/year
  const [sourceMonth, setSourceMonth] = useState(now.getMonth());
  const [sourceYear, setSourceYear] = useState(now.getFullYear());

  // Target month/year
  const [targetMonth, setTargetMonth] = useState(nextMonth);
  const [targetYear, setTargetYear] = useState(nextYear);

  // Filter & selection
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sourceTransactions, setSourceTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingSource, setLoadingSource] = useState(false);

  // State
  const [duplicating, setDuplicating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate year options
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i);

  // Fetch transactions for source month
  const fetchSourceTransactions = useCallback(async () => {
    setLoadingSource(true);
    setErrorMsg(null);
    try {
      const startDate = new Date(sourceYear, sourceMonth, 1);
      const endDate = new Date(sourceYear, sourceMonth + 1, 0, 23, 59, 59);
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: "200",
      });

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      const allData: Transaction[] = json.data || [];
      // Exclude installment transactions — they auto-generate across months
      const data = allData.filter((t) => !t.installmentGroupId);
      setSourceTransactions(data);
      setSelectedIds(new Set(data.map((t) => t.id)));
    } catch {
      setSourceTransactions([]);
      setSelectedIds(new Set());
    } finally {
      setLoadingSource(false);
    }
  }, [sourceMonth, sourceYear]);

  useEffect(() => {
    if (open) {
      fetchSourceTransactions();
    }
  }, [open, fetchSourceTransactions]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setFilter("ALL");
      setErrorMsg(null);
      setSourceMonth(now.getMonth());
      setSourceYear(now.getFullYear());
      setTargetMonth(nextMonth);
      setTargetYear(nextYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Filter displayed transactions
  const displayedTransactions = sourceTransactions.filter((t) => {
    if (filter === "ALL") return true;
    return t.type === filter;
  });

  // Toggle selection
  function toggleTransaction(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Select/deselect all visible
  function toggleSelectAll() {
    const visibleIds = displayedTransactions.map((t) => t.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  // Quick-select by type
  function selectByType(type: TransactionType) {
    setFilter(type);
    const matching = sourceTransactions.filter((t) => t.type === type);
    setSelectedIds(new Set(matching.map((t) => t.id)));
  }

  // Count selected that are visible
  const selectedCount = displayedTransactions.filter((t) =>
    selectedIds.has(t.id)
  ).length;
  const allVisibleSelected =
    displayedTransactions.length > 0 &&
    displayedTransactions.every((t) => selectedIds.has(t.id));

  // Total selected across all
  const totalSelected = sourceTransactions.filter((t) =>
    selectedIds.has(t.id)
  ).length;

  async function handleDuplicate() {
    if (totalSelected === 0) {
      toast.error("Selecione ao menos uma transação");
      return;
    }

    setDuplicating(true);
    setErrorMsg(null);

    try {
      const idsToSend = sourceTransactions
        .filter((t) => selectedIds.has(t.id))
        .map((t) => t.id);

      const res = await fetch("/api/transactions/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionIds: idsToSend,
          month: targetMonth,
          year: targetYear,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "Erro ao duplicar transações");
        return;
      }

      toast.success(
        `${json.count} transação(ões) duplicada(s) para ${MONTH_NAMES[targetMonth]} de ${targetYear}`
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erro ao duplicar transações");
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicar Transações
          </DialogTitle>
          <DialogDescription>
            Selecione as transações de um mês e duplique para outro.
          </DialogDescription>
        </DialogHeader>

        {/* Source month/year */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Mês de origem</label>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={String(sourceMonth)}
              onValueChange={(v) => setSourceMonth(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(sourceYear)}
              onValueChange={(v) => setSourceYear(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick filter buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilter("ALL");
              setSelectedIds(new Set(sourceTransactions.map((t) => t.id)));
            }}
          >
            Todas
          </Button>
          <Button
            variant={filter === "INCOME" ? "default" : "outline"}
            size="sm"
            onClick={() => selectByType("INCOME")}
            className={filter === "INCOME" ? "" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
          >
            Receitas
          </Button>
          <Button
            variant={filter === "EXPENSE" ? "default" : "outline"}
            size="sm"
            onClick={() => selectByType("EXPENSE")}
            className={filter === "EXPENSE" ? "" : "text-red-600 border-red-200 hover:bg-red-50"}
          >
            Despesas
          </Button>
        </div>

        {/* Transaction list with checkboxes */}
        <div className="flex-1 overflow-y-auto border rounded-lg min-h-0 max-h-60">
          {loadingSource ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : displayedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma transação neste mês</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Select all header */}
              <button
                type="button"
                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
                onClick={toggleSelectAll}
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    allVisibleSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {allVisibleSelected && <Check className="h-3 w-3" />}
                </div>
                Selecionar todas ({displayedTransactions.length})
                {selectedCount > 0 && selectedCount < displayedTransactions.length && (
                  <span className="text-muted-foreground ml-auto">
                    {selectedCount} selecionada(s)
                  </span>
                )}
              </button>

              {displayedTransactions.map((t) => {
                const isSelected = selectedIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${
                      isSelected ? "" : "opacity-50"
                    }`}
                    onClick={() => toggleTransaction(t.id)}
                  >
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={t.description}>
                        {t.description.length > 40 ? t.description.slice(0, 40) + "…" : t.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                          {t.category?.icon} {t.category?.name}
                        </Badge>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold whitespace-nowrap ${getTransactionColor(
                        t.type
                      )}`}
                    >
                      {t.type === "EXPENSE" ? "-" : "+"}
                      {formatCurrency(t.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{errorMsg}</p>
          </div>
        )}

        {/* Target month/year */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Duplicar para</label>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={String(targetMonth)}
              onValueChange={(v) => setTargetMonth(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(targetYear)}
              onValueChange={(v) => setTargetYear(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleDuplicate}
            disabled={duplicating || totalSelected === 0}
          >
            {duplicating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplicando...
              </>
            ) : (
              `Duplicar ${totalSelected} transação(ões)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
