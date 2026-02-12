"use client";

interface GoalProgressProps {
  current: number;
  target: number;
  color?: string;
}

export function GoalProgress({
  current,
  target,
  color = "#6366f1",
}: GoalProgressProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {percentage}% concluído
        </span>
        <span className="font-medium">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(current)}{" "}
          <span className="text-muted-foreground">
            / {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(target)}
          </span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
