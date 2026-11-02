import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/common/components/ui/table";
import { cn } from "@/lib/utils";

export interface SortState {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
}

interface SortableHeadProps extends SortState {
  field: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}

export function SortableHead({
  field,
  children,
  className,
  align = "left",
  sortBy,
  sortOrder,
  onSort,
}: SortableHeadProps) {
  const Icon = sortBy !== field ? ArrowUpDown : sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={className}>
      <button
        className={cn(
          "flex items-center gap-1 hover:text-foreground transition-colors",
          align === "right" && "ml-auto"
        )}
        onClick={() => onSort?.(field)}
      >
        {children}
        <Icon className={cn("h-3.5 w-3.5", sortBy !== field && "opacity-40")} />
      </button>
    </TableHead>
  );
}
