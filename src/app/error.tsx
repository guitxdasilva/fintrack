"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TrendingUp, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/common/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-red-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 h-72 w-72 rounded-full bg-orange-500/5 blur-3xl" />

      <div className="flex items-center gap-2 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold">FinTrack</span>
      </div>

      <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 delay-150">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          500
        </h1>
        <h2 className="text-2xl font-semibold">
          Algo deu errado
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Ocorreu um erro inesperado. Tente novamente ou volte para o início.
        </p>
      </div>

      <div className="flex gap-3 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <Button
          variant="outline"
          onClick={reset}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
        <Button asChild className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>
        </Button>
      </div>
    </div>
  );
}
