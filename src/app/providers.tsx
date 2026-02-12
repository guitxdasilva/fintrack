"use client";

import { Toaster } from "@/common/components/ui/sonner";
import { TooltipProvider } from "@/common/components/ui/tooltip";
import { ThemeProvider } from "@/common/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton />
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
