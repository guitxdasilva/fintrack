"use client";

import { useState } from "react";
import { Bug, Lightbulb, Heart, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { cn } from "@/lib/utils";

type FeedbackType = "BUG" | "SUGGESTION" | "COMPLIMENT";

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
  description: string;
  icon: typeof Bug;
  color: string;
  bgActive: string;
  borderActive: string;
}[] = [
  {
    value: "BUG",
    label: "Bug",
    description: "Algo não funciona como esperado",
    icon: Bug,
    color: "text-red-500",
    bgActive: "bg-red-50 dark:bg-red-500/10",
    borderActive: "border-red-300 dark:border-red-500/40",
  },
  {
    value: "SUGGESTION",
    label: "Sugestão",
    description: "Ideia para melhorar o app",
    icon: Lightbulb,
    color: "text-amber-500",
    bgActive: "bg-amber-50 dark:bg-amber-500/10",
    borderActive: "border-amber-300 dark:border-amber-500/40",
  },
  {
    value: "COMPLIMENT",
    label: "Elogio",
    description: "Algo que você gostou",
    icon: Heart,
    color: "text-emerald-500",
    bgActive: "bg-emerald-50 dark:bg-emerald-500/10",
    borderActive: "border-emerald-300 dark:border-emerald-500/40",
  },
];

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleClose() {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setType(null);
      setMessage("");
      setSuccess(false);
    }, 200);
  }

  async function handleSubmit() {
    if (!type || message.trim().length < 5) return;

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar");
      }

      setSuccess(true);
      toast.success("Feedback enviado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]">
        {success ? (
          <div className="flex flex-col items-center py-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15 mb-4">
              <Heart className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Obrigado pelo feedback!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Sua opinião é muito importante para melhorar o FinTrack.
            </p>
            <Button onClick={handleClose} variant="outline">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Enviar Feedback</DialogTitle>
              <DialogDescription>
                Nos conte o que achou ou reporte um problema. Toda opinião conta!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Type selection */}
              <div className="grid grid-cols-3 gap-3">
                {FEEDBACK_TYPES.map((ft) => {
                  const isActive = type === ft.value;
                  return (
                    <button
                      key={ft.value}
                      onClick={() => setType(ft.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all duration-150 cursor-pointer hover:scale-[1.02]",
                        isActive
                          ? `${ft.bgActive} ${ft.borderActive}`
                          : "border-border bg-card hover:bg-accent/50"
                      )}
                    >
                      <ft.icon
                        className={cn(
                          "h-6 w-6 transition-colors",
                          isActive ? ft.color : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {ft.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <textarea
                  placeholder={
                    type === "BUG"
                      ? "Descreva o bug encontrado..."
                      : type === "SUGGESTION"
                        ? "Qual sua sugestão de melhoria?"
                        : type === "COMPLIMENT"
                          ? "O que você mais gostou?"
                          : "Selecione um tipo acima e descreva..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-colors"
                />
                <div className="flex justify-end">
                  <span className="text-xs text-muted-foreground">
                    {message.length}/1000
                  </span>
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!type || message.trim().length < 5 || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Feedback
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
