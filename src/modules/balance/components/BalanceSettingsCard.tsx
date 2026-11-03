"use client";

import { useState } from "react";
import { Loader2, Save, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { errorMessage } from "@/lib/api-client";
import { formatDateOnly, isDateOnlyString, parseDateOnly } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useBalance, useSaveBalance, type BalanceData } from "../hooks/useBalance";

function BalanceForm({ balance }: { balance: BalanceData | null }) {
  const saveBalance = useSaveBalance();
  const [amount, setAmount] = useState(balance ? String(balance.initialBalance) : "");
  const [date, setDate] = useState(balance?.initialBalanceDate ?? formatDateOnly(new Date()));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed)) {
      toast.error("Informe um valor válido");
      return;
    }
    if (!isDateOnlyString(date)) {
      toast.error("Informe uma data válida");
      return;
    }
    try {
      await saveBalance.mutateAsync({ amount: parsed, date });
      toast.success("Saldo atualizado");
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao salvar saldo"));
    }
  }

  async function handleClear() {
    try {
      await saveBalance.mutateAsync({ amount: null });
      setAmount("");
      toast.success("Saldo removido");
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao remover saldo"));
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        {balance && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Saldo hoje</p>
            <p className="text-xl font-bold tabular-nums">
              {formatCurrency(balance.currentBalance)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(balance.initialBalance)} em{" "}
              {formatDate(parseDateOnly(balance.initialBalanceDate))} + transações dos dias seguintes
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="initialBalance" className="text-sm font-medium">
              Saldo (somando suas contas)
            </label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Ex: 2500,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="initialBalanceDate" className="text-sm font-medium">
              Em qual data
            </label>
            <Input
              id="initialBalanceDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Use o saldo do fim desse dia: as transações dele e as anteriores já estão incluídas; só as
          dos dias seguintes são somadas.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          {balance && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              disabled={saveBalance.isPending}
            >
              Remover
            </Button>
          )}
          <Button type="submit" disabled={saveBalance.isPending}>
            {saveBalance.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar saldo
          </Button>
        </div>
      </CardContent>
    </form>
  );
}

export function BalanceSettingsCard() {
  const { data, isLoading } = useBalance();

  return (
    <Card id="saldo" className="transition-all duration-200 hover:shadow-md scroll-mt-24">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Wallet className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle>Saldo atual</CardTitle>
            <CardDescription>
              Informe quanto você tem para ver o saldo real e projetado
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {isLoading ? (
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      ) : (
        <BalanceForm key={data?.initialBalanceDate ?? "empty"} balance={data ?? null} />
      )}
    </Card>
  );
}
