import type { ReactNode } from "react";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/lib/utils";

interface SelectionBarProps {
  count: number;
  onCancel: () => void;
  disabled?: boolean;
  className?: string;
  /** Action buttons shown next to "Cancelar". */
  children: ReactNode;
}

/** Sticky bar shown at the bottom of a list while items are selected. */
export function SelectionBar({ count, onCancel, disabled, className, children }: SelectionBarProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "sticky bottom-0 bg-background/95 backdrop-blur border-t flex items-center justify-between gap-3",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">{count} selecionada(s)</span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={disabled}>
          Cancelar
        </Button>
        {children}
      </div>
    </div>
  );
}
