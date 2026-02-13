import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { LoginForm } from "@/modules/auth/components/LoginForm";
import { ThemeToggle } from "@/common/components/ThemeToggle";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gray-950 p-10 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">FinTrack</span>
        </div>

        <div className="space-y-4">
          <blockquote className="text-2xl font-semibold leading-relaxed">
            &ldquo;Organizar suas finanças é o primeiro passo para conquistar seus objetivos.&rdquo;
          </blockquote>
          <p className="text-gray-400">
            Dashboard financeiro pessoal com gráficos interativos e metas.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          &copy; 2026 FinTrack
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle className="size-9" />
        </div>
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-2 lg:hidden justify-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">FinTrack</span>
            </Link>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
