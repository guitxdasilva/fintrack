"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import type { MonthValue } from "@/common/components/MonthNavigator";
import { useOpenSession } from "@/common/hooks/useOpenSession";
import { errorMessage } from "@/lib/api-client";
import { formatDateOnly } from "@/lib/dates";
import { useCardRefund } from "@/modules/cards/hooks/useCards";
import { useCategories } from "@/modules/categories/hooks/useCategories";
import type { Card } from "@/types";

interface CardRefundDialogProps {
  card: Card | null;
  month: MonthValue;
  onClose: () => void;
}

function CardRefundForm({ card, month, onClose }: { card: Card; month: MonthValue; onClose: () => void }) {
  const refund = useCardRefund();
  const { data: categories = [] } = useCategories("EXPENSE");
  const [description, setDescription] = useState("Reembolso");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(formatDateOnly(new Date()));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(",", "."));
    if (!(value > 0)) {
      toast.error("Informe o valor do reembolso");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione a categoria");
      return;
    }
    try {
      const res = await refund.mutateAsync({
        cardId: card.id,
        amount: value,
        categoryId,
        description: description.trim() || undefined,
        date: date || undefined,
        ...month,
      });
      toast.success(res.message);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao registrar reembolso"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardRefundDescription">Descrição</Label>
        <Input
          id="cardRefundDescription"
          value={description}
          maxLength={100}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cardRefundAmount">Valor (R$)</Label>
        <Input
          id="cardRefundAmount"
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label>Categoria (o reembolso abate desse gasto)</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cardRefundDate">Data do reembolso</Label>
        <Input id="cardRefundDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={refund.isPending}>
          {refund.isPending ? "Salvando..." : "Adicionar reembolso"}
        </Button>
      </div>
    </form>
  );
}

/** A refund/credit on a card that isn't tied to a purchase, credited to the viewed invoice. */
export function CardRefundDialog({ card, month, onClose }: CardRefundDialogProps) {
  const session = useOpenSession(!!card);
  return (
    <Dialog open={!!card} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Reembolso no {card?.name}</DialogTitle>
          <DialogDescription>
            Um crédito na fatura que não está ligado a uma compra específica. Ele é abatido da
            fatura que você está vendo.
          </DialogDescription>
        </DialogHeader>
        {card && <CardRefundForm key={session} card={card} month={month} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
