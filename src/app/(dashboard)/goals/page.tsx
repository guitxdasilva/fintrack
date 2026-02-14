"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import { Skeleton } from "@/common/components/ui/skeleton";
import { EmptyState } from "@/common/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { GoalCard } from "@/modules/goals/components/GoalCard";
import { GoalForm } from "@/modules/goals/components/GoalForm";
import type { Goal } from "@/types";

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.data) setGoals(json.data);
    } catch {
      toast.error("Erro ao carregar metas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    setFormOpen(true);
  }

  function handleNew() {
    setEditingGoal(null);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/goals/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao excluir meta");
        return;
      }

      toast.success("Meta excluída com sucesso");
      setDeleteTarget(null);
      fetchGoals();
    } catch {
      toast.error("Erro ao excluir meta");
    } finally {
      setDeleting(false);
    }
  }

  const completedGoals = goals.filter(
    (g) => g.currentAmount >= g.targetAmount
  );
  const activeGoals = goals.filter(
    (g) => g.currentAmount < g.targetAmount
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metas</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas metas financeiras
          </p>
        </div>
        <Button onClick={handleNew} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={Target}
            title="Nenhuma meta cadastrada"
            description="Crie sua primeira meta financeira para começar a acompanhar seu progresso"
            action={{ label: "Criar Meta", onClick: handleNew }}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                Em andamento ({activeGoals.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                Concluídas ({completedGoals.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <GoalForm
        open={formOpen}
        onOpenChange={setFormOpen}
        goal={editingGoal}
        onSuccess={fetchGoals}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Excluir meta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a meta &quot;{deleteTarget?.name}&quot;?
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
