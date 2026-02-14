"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

const schema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
});

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const result = schema.safeParse({ email });

    if (!result.success) {
      const errors: { email?: string } = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === "email") errors.email = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.data.email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao enviar email");
        toast.error(data.error || "Erro ao enviar email");
        setLoading(false);
        return;
      }

      setSent(true);
      toast.success("Email enviado!");
    } catch {
      setError("Erro ao processar solicitação");
      toast.error("Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 animate-in zoom-in duration-300">
            <Mail className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">Email enviado!</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Se uma conta com o email <strong>{email}</strong> existir, você receberá um link para redefinir sua senha.
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Não recebeu? Verifique sua pasta de spam.
          </p>
          <Button variant="ghost" size="sm" asChild className="mt-2">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
      <CardHeader className="text-center space-y-1">
        <div className="flex justify-center mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
            <Mail className="h-6 w-6 text-indigo-500" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Esqueceu a senha?</CardTitle>
        <CardDescription>
          Digite seu email e enviaremos um link para redefinir sua senha
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldErrors.email ? "border-destructive" : ""}
              autoFocus
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Enviar link de redefinição
          </Button>
          <p className="text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Voltar ao login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
