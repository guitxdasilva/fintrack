"use client";

import { useState } from "react";
import { useOpenSession } from "@/common/hooks/useOpenSession";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api-client";
import { useSaveCategory } from "@/modules/categories/hooks/useCategories";
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
import type { Category, TransactionType } from "@/types";

const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
});

type FieldErrors = Partial<Record<"name", string>>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSuccess?: () => void;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#0ea5e9", "#6b7280",
];

const PRESET_ICONS = [
  "💰", "💻", "📈", "📦", "🍔", "🚗", "🏠", "🏥",
  "📚", "🎮", "👕", "📱", "🎬", "✈️", "🛒", "💳",
  "🎯", "🏋️", "🐾", "🎵",
];

function CategoryFormContent({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormProps) {
  const saveCategory = useSaveCategory();
  const loading = saveCategory.isPending;
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<TransactionType>(category?.type ?? "EXPENSE");
  const [color, setColor] = useState(category?.color ?? "#6366f1");
  const [icon, setIcon] = useState(category?.icon || "📦");
  const [budget, setBudget] = useState(category?.budget ? String(category.budget) : "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEditing = !!category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = categorySchema.safeParse({ name: name.trim() });

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        type,
        color,
        icon,
        budget: budget ? parseFloat(budget) : null,
      };

      await saveCategory.mutateAsync({
        id: isEditing ? category.id : undefined,
        payload,
      });

      toast.success(
        isEditing
          ? "Categoria atualizada com sucesso"
          : "Categoria criada com sucesso"
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao salvar categoria"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Alimentação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldErrors.name ? "border-destructive" : ""}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as TransactionType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent portal={false} position="popper">
                <SelectItem value="EXPENSE">Despesa</SelectItem>
                <SelectItem value="INCOME">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-lg transition-colors ${
                    icon === emoji
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    color === c
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
              style={{ backgroundColor: color + "20" }}
            >
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium">{name || "Nome da categoria"}</p>
              <p className="text-xs text-muted-foreground">
                {type === "INCOME" ? "Receita" : "Despesa"}
              </p>
            </div>
          </div>

          {type === "EXPENSE" && (
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento mensal (opcional)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Ex: 1000.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="0"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Defina um limite mensal para acompanhar seus gastos nesta categoria
              </p>
            </div>
          )}

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


export function CategoryForm(props: CategoryFormProps) {
  const session = useOpenSession(props.open);
  return <CategoryFormContent key={`${session}-${props.category?.id ?? "new"}`} {...props} />;
}
