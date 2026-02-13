"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, Pin, ShoppingBag } from "lucide-react";
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
import { cn, formatCurrency } from "@/lib/utils";
import type { Transaction, Category, TransactionType, Card, PaymentType } from "@/types";
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPE_ICONS, PAYMENT_TYPES } from "@/types";

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
  defaultType?: TransactionType;
  onSuccess: () => void;
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  defaultType = "EXPENSE",
  onSuccess,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType | "">("");
  const [cardId, setCardId] = useState("");
  const [cardType, setCardType] = useState<"CREDIT" | "DEBIT" | "">("")
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [isFixed, setIsFixed] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEditing = !!transaction;

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setCategoryId(transaction.categoryId);
      setPaymentType((transaction.paymentType as PaymentType) || "");
      setCardId(transaction.cardId || "");
      setCardType((transaction.cardType as "CREDIT" | "DEBIT") || "");
      setIsInstallment(false);
      setInstallments("2");
      setIsFixed(transaction.isFixed || false);
      setDate(new Date(transaction.date));
    } else {
      setType(defaultType);
      setDescription("");
      setAmount("");
      setCategoryId("");
      setPaymentType("");
      setCardId("");
      setCardType("");
      setIsInstallment(false);
      setInstallments("2");
      setIsFixed(false);
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

    async function fetchCards() {
      try {
        const res = await fetch("/api/cards");
        const json = await res.json();
        if (json.data) setCards(json.data);
      } catch {
        // silently fail
      }
    }

    fetchCards();
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
      if (paymentType === "CARD" && !cardType) {
        toast.error("Selecione se é Crédito ou Débito");
        return;
      }

      const payload = {
        amount: parsedAmount,
        type,
        description: description.trim(),
        date: date.toISOString(),
        categoryId,
        isFixed: type === "EXPENSE" ? isFixed : false,
        paymentType: type === "EXPENSE" && !isFixed ? (paymentType || undefined) : undefined,
        cardId: type === "EXPENSE" && !isFixed && paymentType === "CARD" && cardId ? cardId : undefined,
        cardType: type === "EXPENSE" && !isFixed && paymentType === "CARD" && cardType ? cardType : undefined,
        ...(type === "EXPENSE" && !isFixed && isInstallment && !isEditing
          ? { installments: parseInt(installments) }
          : {}),
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
          : type === "EXPENSE" && isInstallment
            ? `Despesa parcelada em ${installments}x criada com sucesso`
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
          {/* Type toggle - only shown when editing (user already chose type via button) */}
          {isEditing && (
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
          )}

          {/* Type indicator when creating */}
          {!isEditing && (
            <div className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-center",
              type === "INCOME"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}>
              {type === "INCOME" ? "Nova Receita" : "Nova Despesa"}
            </div>
          )}

          {/* Fixed vs Variable toggle - only for EXPENSE */}
          {type === "EXPENSE" && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={!isFixed ? "default" : "outline"}
                className={cn(
                  "gap-2",
                  !isFixed && "bg-orange-600 hover:bg-orange-700 text-white"
                )}
                onClick={() => setIsFixed(false)}
              >
                <ShoppingBag className="h-4 w-4" />
                Variável
              </Button>
              <Button
                type="button"
                variant={isFixed ? "default" : "outline"}
                className={cn(
                  "gap-2",
                  isFixed && "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                onClick={() => setIsFixed(true)}
              >
                <Pin className="h-4 w-4" />
                Fixa
              </Button>
            </div>
          )}

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
            {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
              <p className="text-xs text-muted-foreground">
                Valor: <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </p>
            )}
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

          {type === "EXPENSE" && !isFixed && (
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <Select value={paymentType} onValueChange={(v) => {
                const newType = v === "none" ? "" : v as PaymentType;
                setPaymentType(newType);
                if (newType !== "CARD") {
                  setCardId("");
                  setCardType("");
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent portal={false} position="popper" className="max-h-60">
                  <SelectItem value="none">Nenhum</SelectItem>
                  {PAYMENT_TYPES.map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      <span className="flex items-center gap-2">
                        <span>{PAYMENT_TYPE_ICONS[pt]}</span>
                        {PAYMENT_TYPE_LABELS[pt]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
          </div>
          )}

          {type === "EXPENSE" && !isFixed && paymentType === "CARD" && (
            <>
              {cards.length > 0 && (
                <div className="space-y-2">
                  <Label>Cartão</Label>
                  <Select value={cardId} onValueChange={setCardId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o cartão (opcional)" />
                    </SelectTrigger>
                    <SelectContent portal={false} position="popper" className="max-h-60">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {cards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            {c.icon && <span>{c.icon}</span>}
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Tipo do Cartão</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={cardType === "CREDIT" ? "default" : "outline"}
                    onClick={() => setCardType("CREDIT")}
                  >
                    Crédito
                  </Button>
                  <Button
                    type="button"
                    variant={cardType === "DEBIT" ? "default" : "outline"}
                    onClick={() => setCardType("DEBIT")}
                  >
                    Débito
                  </Button>
                </div>
              </div>
            </>
          )}

          {type === "EXPENSE" && !isFixed && !isEditing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isInstallment}
                  onClick={() => setIsInstallment(!isInstallment)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                    isInstallment ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                      isInstallment ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
                <Label className="cursor-pointer" onClick={() => setIsInstallment(!isInstallment)}>
                  Parcelado
                </Label>
              </div>
              {isInstallment && (
                <div className="space-y-2">
                  <Label htmlFor="installments">Número de parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="2"
                    max="48"
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                  />
                  {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && parseInt(installments) >= 2 && (
                    <p className="text-xs text-muted-foreground">
                      {parseInt(installments)}x de{" "}
                      <span className="font-medium">
                        {formatCurrency(parseFloat(amount) / parseInt(installments))}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{type === "EXPENSE" && isFixed ? "Data de Vencimento" : "Data"}</Label>
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
