"use client";

import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  BarChart3,
  Target,
  Shield,
  Wallet,
  PieChart,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/common/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      <header className="border-b border-gray-200 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">FinTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle className="size-9" />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-white"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-36">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-600 dark:text-indigo-300">
              <Zap className="h-3.5 w-3.5" />
              Dashboard financeiro pessoal
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Suas finanças no{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                controle total
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 dark:text-gray-400 sm:text-xl">
              Acompanhe receitas, despesas e metas financeiras com gráficos
              interativos. Simples, rápido e seguro.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:scale-[1.02]"
              >
                Começar grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-8 py-4 text-lg font-medium text-gray-600 dark:text-gray-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Tudo que você precisa para{" "}
                <span className="text-indigo-400">organizar suas finanças</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
                Funcionalidades pensadas para simplificar o controle do seu dinheiro
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: BarChart3,
                  title: "Dashboard Inteligente",
                  description:
                    "Visualize receitas, despesas e saldo em gráficos interativos e fáceis de entender.",
                  color: "text-indigo-500 dark:text-indigo-400",
                  bg: "bg-indigo-500/10",
                },
                {
                  icon: Wallet,
                  title: "Controle de Transações",
                  description:
                    "Registre todas as suas movimentações com categorias, filtros e busca avançada.",
                  color: "text-emerald-500 dark:text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  icon: PieChart,
                  title: "Categorias Personalizadas",
                  description:
                    "Organize seus gastos com categorias customizáveis, ícones e cores.",
                  color: "text-purple-500 dark:text-purple-400",
                  bg: "bg-purple-500/10",
                },
                {
                  icon: Target,
                  title: "Metas Financeiras",
                  description:
                    "Defina metas e acompanhe seu progresso em tempo real com barras visuais.",
                  color: "text-amber-500 dark:text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  icon: Shield,
                  title: "Seguro e Privado",
                  description:
                    "Seus dados protegidos com autenticação segura e criptografia de senha.",
                  color: "text-blue-500 dark:text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  icon: Zap,
                  title: "Rápido e Responsivo",
                  description:
                    "Interface moderna que funciona perfeitamente em desktop, tablet e celular.",
                  color: "text-rose-500 dark:text-rose-400",
                  bg: "bg-rose-500/10",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900/80 p-6 transition-all hover:border-gray-300 dark:hover:border-white/10 hover:shadow-md dark:hover:bg-gray-900"
                >
                  <div
                    className={`mb-4 inline-flex rounded-xl ${feature.bg} p-3`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 dark:border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="rounded-2xl border border-gray-200 dark:border-white/5 bg-gradient-to-br from-indigo-600/10 dark:from-indigo-600/20 via-white dark:via-gray-900 to-blue-600/10 dark:to-blue-600/20 p-8 text-center sm:p-16">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Pronto para organizar suas finanças?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
                Crie sua conta gratuitamente e comece a ter controle total sobre
                o seu dinheiro hoje mesmo.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 dark:bg-white px-8 py-4 text-lg font-semibold text-white dark:text-gray-900 transition-all hover:bg-indigo-500 dark:hover:bg-gray-100 hover:scale-[1.02]"
              >
                Criar conta grátis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">FinTrack</span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              &copy; 2026 FinTrack. Feito com Next.js, TypeScript e Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
