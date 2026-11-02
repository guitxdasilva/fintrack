"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api-client";
import { useCards, useDeleteCard } from "@/modules/cards/hooks/useCards";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { EmptyState } from "@/common/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { CardForm } from "@/modules/cards/components/CardForm";
import type { Card as CardType } from "@/types";
import { formatClosingDayDescription } from "@/lib/invoice";

export default function CardsPage() {
  const { data: cards = [], isLoading, isError } = useCards();
  const deleteCard = useDeleteCard();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CardType | null>(null);
  const deleting = deleteCard.isPending;

  useEffect(() => {
    if (isError) toast.error("Erro ao carregar cartões");
  }, [isError]);

  function handleEdit(card: CardType) {
    setEditingCard(card);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingCard(null);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      await deleteCard.mutateAsync(deleteTarget.id);
      toast.success("Cartão excluído");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao excluir cartão"));
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Cartões</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus cartões de crédito e débito
          </p>
        </div>
        <Button onClick={handleNew} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={CreditCard}
            title="Nenhum cartão cadastrado"
            description="Adicione seus cartões para usá-los em transações"
            action={{ label: "Novo Cartão", onClick: handleNew }}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="group relative">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
                  {card.icon || "💳"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.name}</p>
                  {card.closingDayType && card.closingDayValue && (
                    <p className="text-xs text-muted-foreground">
                      Fecha: {formatClosingDayDescription(card.closingDayType, card.closingDayValue)}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(card)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(card)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CardForm
        open={formOpen}
        onOpenChange={setFormOpen}
        card={editingCard}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir cartão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.name}&quot;?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
