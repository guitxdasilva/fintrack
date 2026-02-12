import Link from "next/link";
import { TrendingUp, Home } from "lucide-react";
import { Button } from "@/common/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-white">
      <div className="flex items-center gap-2 mb-12">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold">FinTrack</span>
      </div>

      <div className="text-center space-y-4">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-200">
          Página não encontrada
        </h2>
        <p className="text-gray-400 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>
      </div>

      <div className="mt-8">
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
