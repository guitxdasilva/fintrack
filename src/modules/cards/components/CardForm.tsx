"use client";

import { useState, useEffect } from "react";
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
import type { Card } from "@/types";
import { CLOSING_DAY_TYPE_LABELS } from "@/types";
import type { ClosingDayType } from "@/types";
import { getEffectiveClosingDay } from "@/lib/invoice";

const ICON_OPTIONS = ["💳", "🏧", "💰", "🪙", "📲", "🔄", "⭐", "🎯", "🏦", "💎"];

const cardSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
});

type FieldErrors = Partial<Record<"name", string>>;

interface CardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: Card | null;
  onSuccess: () => void;
}

export function CardForm({
  open,
  onOpenChange,
  card,
  onSuccess,
}: CardFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💳");
  const [closingDayType, setClosingDayType] = useState<ClosingDayType | "">("");
  const [closingDayValue, setClosingDayValue] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEditing = !!card;

  useEffect(() => {
    if (card) {
      setName(card.name);
      setIcon(card.icon || "💳");
      setClosingDayType((card.closingDayType as ClosingDayType) || "");
      setClosingDayValue(card.closingDayValue?.toString() || "");
    } else {
      setName("");
      setIcon("💳");
      setClosingDayType("");
      setClosingDayValue("");
    }
    setFieldErrors({});
  }, [card, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = cardSchema.safeParse({ name });

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const url = isEditing ? `/api/cards/${card.id}` : "/api/cards";

      const payload: Record<string, unknown> = { name: name.trim(), icon };

      if (closingDayType && closingDayValue) {
        payload.closingDayType = closingDayType;
        payload.closingDayValue = parseInt(closingDayValue);
      } else {
        payload.closingDayType = null;
        payload.closingDayValue = null;
      }

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao salvar cartão");
        return;
      }

      toast.success(
        isEditing ? "Cartão atualizado" : "Cartão criado"
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erro ao salvar cartão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cartão" : "Novo Cartão"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-name">Nome</Label>
            <Input
              id="card-name"
              placeholder="Ex: Nubank, Inter, Itaú..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldErrors.name ? "border-destructive" : ""}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-colors ${
                    icon === opt
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-muted-foreground/20 hover:bg-muted"
                  }`}
                  onClick={() => setIcon(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Fechamento da fatura */}
          <div className="space-y-2">
            <Label>Fechamento da fatura</Label>
            <Select
              value={closingDayType}
              onValueChange={(v) => {
                if (v === "none") {
                  setClosingDayType("");
                  setClosingDayValue("");
                } else {
                  setClosingDayType(v as ClosingDayType);
                  setClosingDayValue(closingDayValue || "3");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem fechamento configurado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fechamento</SelectItem>
                {(Object.keys(CLOSING_DAY_TYPE_LABELS) as ClosingDayType[]).map(
                  (type) => (
                    <SelectItem key={type} value={type}>
                      {CLOSING_DAY_TYPE_LABELS[type]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            {closingDayType && (
              <div className="space-y-1.5">
                <Input
                  type="number"
                  min={1}
                  max={closingDayType === "FIXED" ? 31 : 15}
                  placeholder={
                    closingDayType === "FIXED"
                      ? "Ex: 15"
                      : "Ex: 3 (Nubank), 2 (Santander)"
                  }
                  value={closingDayValue}
                  onChange={(e) => setClosingDayValue(e.target.value)}
                />
                <ClosingDayHint type={closingDayType} value={parseInt(closingDayValue) || 0} />
              </div>
            )}
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

function ClosingDayHint({ type, value }: { type: ClosingDayType; value: number }) {
  if (!value || value < 1) return null;

  if (type === "FIXED") {
    // Show examples for months with fewer days
    const feb = getEffectiveClosingDay("FIXED", value, 1, 2026); // Feb
    const showFebNote = feb < value;
    return (
      <p className="text-xs text-muted-foreground">
        Fecha dia {value} de cada mês
        {showFebNote && ` (Fev: dia ${feb})`}
      </p>
    );
  }

  // BEFORE_END examples
  const jan = getEffectiveClosingDay("BEFORE_END", value, 0, 2026); // Jan=31 days
  const feb = getEffectiveClosingDay("BEFORE_END", value, 1, 2026); // Feb=28 days
  const apr = getEffectiveClosingDay("BEFORE_END", value, 3, 2026); // Apr=30 days

  return (
    <p className="text-xs text-muted-foreground">
      Ex: Jan→dia {jan}, Fev→dia {feb}, Abr→dia {apr}
    </p>
  );
}
