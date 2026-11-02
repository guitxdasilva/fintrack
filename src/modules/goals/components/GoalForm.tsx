"use client";

import { useState } from "react";
import { useOpenSession } from "@/common/hooks/useOpenSession";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api-client";
import { useSaveGoal } from "@/modules/goals/hooks/useGoals";
import { z } from "zod";
import { formatDateOnly } from "@/lib/dates";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";
import { Calendar } from "@/common/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import type { Goal } from "@/types";

const goalSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  targetAmount: z
    .string()
    .min(1, "Valor alvo é obrigatório")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Valor alvo deve ser maior que zero"),
  currentAmount: z
    .string()
    .refine((v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0), "Valor atual não pode ser negativo"),
});

type FieldErrors = Partial<Record<keyof z.infer<typeof goalSchema>, string>>;

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
  onSuccess?: () => void;
}

function GoalFormContent({
  open,
  onOpenChange,
  goal,
  onSuccess,
}: GoalFormProps) {
  const saveGoal = useSaveGoal();
  const loading = saveGoal.isPending;
  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.targetAmount) : "");
  const [currentAmount, setCurrentAmount] = useState(goal ? String(goal.currentAmount) : "");
  const [deadline, setDeadline] = useState<Date | undefined>(
    goal?.deadline ? new Date(goal.deadline) : undefined
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isEditing = !!goal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = goalSchema.safeParse({ name: name.trim(), targetAmount, currentAmount });

    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FieldErrors;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    const parsedTarget = parseFloat(result.data.targetAmount);
    const parsedCurrent = result.data.currentAmount ? parseFloat(result.data.currentAmount) : 0;

    try {
      const payload = {
        name: name.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        deadline: deadline ? formatDateOnly(deadline) : null,
      };

      await saveGoal.mutateAsync({ id: isEditing ? goal.id : undefined, payload });

      toast.success(
        isEditing ? "Meta atualizada com sucesso" : "Meta criada com sucesso"
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao salvar meta"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Meta" : "Nova Meta"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goalName">Nome</Label>
            <Input
              id="goalName"
              placeholder="Ex: Reserva de emergência"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldErrors.name ? "border-destructive" : ""}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Valor Alvo</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className={fieldErrors.targetAmount ? "border-destructive" : ""}
              />
              {targetAmount && !isNaN(parseFloat(targetAmount)) && parseFloat(targetAmount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseFloat(targetAmount))}
                </p>
              )}
              {fieldErrors.targetAmount && (
                <p className="text-xs text-destructive">{fieldErrors.targetAmount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentAmount">Valor Atual</Label>
              <Input
                id="currentAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className={fieldErrors.currentAmount ? "border-destructive" : ""}
              />
              {currentAmount && !isNaN(parseFloat(currentAmount)) && parseFloat(currentAmount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseFloat(currentAmount))}
                </p>
              )}
              {fieldErrors.currentAmount && (
                <p className="text-xs text-destructive">{fieldErrors.currentAmount}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prazo (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline
                    ? format(deadline, "dd/MM/yyyy", { locale: ptBR })
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {deadline && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={() => setDeadline(undefined)}
              >
                Remover prazo
              </Button>
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


export function GoalForm(props: GoalFormProps) {
  const session = useOpenSession(props.open);
  return <GoalFormContent key={`${session}-${props.goal?.id ?? "new"}`} {...props} />;
}
