"use client";

import { useTheme } from "@/common/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/common/components/ui/button";

interface ThemeToggleProps {
  variant?: "ghost" | "outline";
  className?: string;
}

export function ThemeToggle({ variant = "ghost", className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
