"use client";

import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Pencil, Trash2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { GoalProgress } from "./GoalProgress";
import type { Goal } from "@/types";

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const percentage = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100
  );
  const isCompleted = percentage >= 100;

  const daysLeft = goal.deadline
    ? differenceInDays(new Date(goal.deadline), new Date())
    : null;

  function getStatusBadge() {
    if (isCompleted) {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-0">Concluída</Badge>;
    }
    if (daysLeft !== null && daysLeft < 0) {
      return <Badge variant="destructive" className="border-0">Vencida</Badge>;
    }
    if (daysLeft !== null && daysLeft <= 7) {
      return <Badge className="bg-amber-500/10 text-amber-500 border-0">Urgente</Badge>;
    }
    return <Badge variant="secondary" className="border-0">Em andamento</Badge>;
  }

  function getProgressColor() {
    if (isCompleted) return "#22c55e";
    if (daysLeft !== null && daysLeft < 0) return "#ef4444";
    if (percentage >= 75) return "#22c55e";
    if (percentage >= 50) return "#f59e0b";
    return "#6366f1";
  }

  return (
    <Card className="group">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
            <Target className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <CardTitle className="text-base">{goal.name}</CardTitle>
            {goal.deadline && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(goal.deadline), "dd MMM yyyy", {
                  locale: ptBR,
                })}
                {daysLeft !== null && daysLeft >= 0 && (
                  <span className="ml-1">({daysLeft} dias restantes)</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(goal)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(goal)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <GoalProgress
          current={goal.currentAmount}
          target={goal.targetAmount}
          color={getProgressColor()}
        />
      </CardContent>
    </Card>
  );
}
