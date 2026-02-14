"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/common/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-8" : "py-16"}`}>
      <div className={`relative ${compact ? "mb-3" : "mb-5"}`}>
        {/* Decorative rings */}
        <div className={`absolute inset-0 ${compact ? "scale-125" : "scale-150"} rounded-full bg-primary/5 animate-pulse`} />
        <div className={`relative flex items-center justify-center ${compact ? "h-12 w-12" : "h-16 w-16"} rounded-full bg-muted/80 border border-border/50`}>
          <Icon className={`${compact ? "h-5 w-5" : "h-7 w-7"} text-muted-foreground/70`} />
        </div>
      </div>
      <h3 className={`font-semibold text-foreground/80 ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </h3>
      <p className={`mt-1 max-w-xs text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          size={compact ? "sm" : "default"}
          className={compact ? "mt-3" : "mt-5"}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
