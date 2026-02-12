"use client";

import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import {
  Dialog,
  DialogContent,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";
import { Calendar } from "@/common/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Transaction, Category, TransactionType } from "@/types";

const transactionSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(100, "Descrição deve ter no máximo 100 caracteres"),
  amount: z
    .string()
    .min(1, "Valor é obrigatório")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor deve ser maior que zero"),
  categoryId: z
    .string()
    .min(1, "Selecione uma categoria"),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof transactionSchema>, string>>;

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSuccess: () => void;
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEditing = !!transaction;

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setDate(new Date(transaction.date));
    } else {
      setType("EXPENSE");
      setDescription("");
      setAmount("");
      setCategoryId("");
      setDate(new Date());
    }
  }, [transaction, open]);

  useEffect(() => {
    if (!open) return;

    async function fetchCategories() {
      try {
        const res = await fetch(`/api/categories?type=${type}`);
        const json = await res.json();
        if (json.data) {
          setCategories(json.data);
        }
      } catch {
        toast.error("Erro ao carregar categorias");
      }
    }

    fetchCategories();
  }, [type, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = transactionSchema.safeParse({ description, amount, categoryId });

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    const parsedAmount = parseFloat(result.data.amount);

    setLoading(true);

    try {
      const payload = {
        amount: parsedAmount,
        type,
        description: description.trim(),
        date: date.toISOString(),
        categoryId,
      };

      const url = isEditing
        ? `/api/transactions/${transaction.id}`
        : "/api/transactions";

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar transação");
        return;
      }

      toast.success(
        isEditing
          ? "Transação atualizada com sucesso"
          : "Transação criada com sucesso"
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erro ao salvar transação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={type === "EXPENSE" ? "default" : "outline"}
              className={
                type === "EXPENSE"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
              onClick={() => {
                setType("EXPENSE");
                setCategoryId("");
              }}
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={type === "INCOME" ? "default" : "outline"}
              className={
                type === "INCOME"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }
              onClick={() => {
                setType("INCOME");
                setCategoryId("");
              }}
            >
              Receita
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Supermercado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={fieldErrors.description ? "border-destructive" : ""}
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldErrors.amount ? "border-destructive" : ""}
            />
            {fieldErrors.amount && (
              <p className="text-xs text-destructive">{fieldErrors.amount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className={cn("w-full", fieldErrors.categoryId && "border-destructive")}>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent portal={false} position="popper" className="max-h-60">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      {cat.icon && <span>{cat.icon}</span>}
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
                {categories.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma categoria encontrada
                  </div>
                )}
              </SelectContent>
            </Select>
            {fieldErrors.categoryId && (
              <p className="text-xs text-destructive">{fieldErrors.categoryId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date
                    ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
