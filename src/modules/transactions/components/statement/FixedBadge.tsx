import { Pin } from "lucide-react";
import { Badge } from "@/common/components/ui/badge";
import { cn } from "@/lib/utils";

export function FixedBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-normal gap-1 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
        className
      )}
    >
      <Pin className="h-3 w-3" />
      Fixa
    </Badge>
  );
}
