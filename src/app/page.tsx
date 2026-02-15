"use client";

import Link from "next/link";
import {
  TrendingUp,
  ArrowRight,
  BarChart3,
  Target,
  Wallet,
  PieChart,
  Zap,
  CreditCard,
  PiggyBank,
  FileDown,
  CheckCircle2,
  Pin,
  Receipt,
  ArrowUpDown,
  ChevronRight,
  SlidersHorizontal,
  KeyRound,
  GraduationCap,
  UserCog,
} from "lucide-react";
import { ThemeToggle } from "@/common/components/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FinTrack</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle className="size-9" />
            <Link
              href="/login"
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-white"
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
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-indigo-500/8 blur-3xl" />
            <div className="absolute right-0 top-1/2 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-36">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-300">
              <Zap className="h-3.5 w-3.5" />
              Controle financeiro completo
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Suas finanças no{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
                controle total
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 dark:text-gray-400 sm:text-xl leading-relaxed">
              Dashboard interativo, cartões de crédito, orçamento por categoria,
              metas financeiras e muito mais. Tudo em um só lugar.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 hover:scale-[1.02]"
              >
                Começar grátis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-8 py-4 text-lg font-medium text-gray-600 dark:text-gray-300 transition-all hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Já tenho conta
              </Link>
            </div>

            {/* Mini stats */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-sm text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>100% gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Sem anúncios</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Dados seguros</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section className="border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Tudo que você precisa para{" "}
                <span className="text-indigo-500 dark:text-indigo-400">organizar suas finanças</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
                Funcionalidades completas pensadas para simplificar o controle do seu dinheiro
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: BarChart3,
                  title: "Dashboard Interativo",
                  description:
                    "Saldo, receitas vs despesas, gráfico de categorias com detalhamento por clique e visão mensal completa.",
                  color: "text-indigo-500 dark:text-indigo-400",
                  bg: "bg-indigo-500/10",
                  border: "group-hover:border-indigo-500/20",
                },
                {
                  icon: Wallet,
                  title: "Transações Completas",
                  description:
                    "Receitas e despesas com filtros avançados (status, cartão, forma de pagamento, fixa/variável), exportação CSV e ações em massa.",
                  color: "text-emerald-500 dark:text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "group-hover:border-emerald-500/20",
                },
                {
                  icon: CreditCard,
                  title: "Cartões de Crédito e Débito",
                  description:
                    "Gerencie seus cartões com limite, bandeira, dia de fechamento e acompanhe faturas mensais.",
                  color: "text-violet-500 dark:text-violet-400",
                  bg: "bg-violet-500/10",
                  border: "group-hover:border-violet-500/20",
                },
                {
                  icon: PiggyBank,
                  title: "Orçamento por Categoria",
                  description:
                    "Defina limites de gasto por categoria e acompanhe o progresso com barras visuais e alertas.",
                  color: "text-amber-500 dark:text-amber-400",
                  bg: "bg-amber-500/10",
                  border: "group-hover:border-amber-500/20",
                },
                {
                  icon: PieChart,
                  title: "Categorias Personalizáveis",
                  description:
                    "Organize gastos com categorias customizáveis, ícones e cores. Clique para ver detalhes.",
                  color: "text-purple-500 dark:text-purple-400",
                  bg: "bg-purple-500/10",
                  border: "group-hover:border-purple-500/20",
                },
                {
                  icon: Target,
                  title: "Metas Financeiras",
                  description:
                    "Defina objetivos de economia e acompanhe seu progresso em tempo real com barras visuais.",
                  color: "text-blue-500 dark:text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "group-hover:border-blue-500/20",
                },
                {
                  icon: KeyRound,
                  title: "Segurança & Recuperação",
                  description:
                    "Recuperação de senha via email, edição de perfil e exclusão de conta segura.",
                  color: "text-rose-500 dark:text-rose-400",
                  bg: "bg-rose-500/10",
                  border: "group-hover:border-rose-500/20",
                },
                {
                  icon: GraduationCap,
                  title: "Tour Guiado",
                  description:
                    "Onboarding interativo no primeiro acesso que apresenta todas as funcionalidades do app.",
                  color: "text-cyan-500 dark:text-cyan-400",
                  bg: "bg-cyan-500/10",
                  border: "group-hover:border-cyan-500/20",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900/80 p-6 transition-all duration-200 hover:border-gray-300 dark:hover:border-white/10 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none dark:hover:bg-gray-900"
                >
                  <div
                    className={`mb-4 inline-flex rounded-xl ${feature.bg} p-3 transition-transform duration-200 group-hover:scale-110`}
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

        {/* ── Highlights / Capabilities ── */}
        <section className="border-t border-gray-200 dark:border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Recursos que fazem a{" "}
                <span className="text-indigo-500 dark:text-indigo-400">diferença</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-500 dark:text-gray-400">
                Detalhes pensados para tornar sua experiência mais completa
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Pin,
                  label: "Despesas fixas",
                  detail: "Marque gastos recorrentes",
                },
                {
                  icon: Receipt,
                  label: "Parcelas",
                  detail: "Acompanhe compras parceladas",
                },
                {
                  icon: ArrowUpDown,
                  label: "Ações em massa",
                  detail: "Selecione e edite várias de uma vez",
                },
                {
                  icon: FileDown,
                  label: "Exportar CSV",
                  detail: "Baixe suas transações",
                },
                {
                  icon: CheckCircle2,
                  label: "Pago / Pendente",
                  detail: "Controle o status de cada gasto",
                },
                {
                  icon: SlidersHorizontal,
                  label: "Filtros avançados",
                  detail: "Cartão, status, pagamento e tipo",
                },
                {
                  icon: CreditCard,
                  label: "Faturas de cartão",
                  detail: "Agrupadas por dia de fechamento",
                },
                {
                  icon: UserCog,
                  label: "Perfil & configurações",
                  detail: "Edite seu nome, email e senha",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-gray-900/50 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                    <item.icon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="mb-14 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Comece em{" "}
                <span className="text-indigo-500 dark:text-indigo-400">3 passos</span>
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Crie sua conta",
                  description:
                    "Cadastro rápido e gratuito. Sem cartão de crédito necessário.",
                },
                {
                  step: "02",
                  title: "Configure suas categorias",
                  description:
                    "Personalize categorias, defina orçamentos e cadastre seus cartões.",
                },
                {
                  step: "03",
                  title: "Acompanhe tudo",
                  description:
                    "Registre transações e veja seu dashboard com gráficos em tempo real.",
                },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/25">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                  {i < 2 && (
                    <ChevronRight className="absolute right-0 top-5 hidden h-6 w-6 text-gray-300 dark:text-gray-700 sm:block -translate-x-1/2 lg:translate-x-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="border-t border-gray-200 dark:border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/5 bg-gradient-to-br from-indigo-600/10 dark:from-indigo-600/20 via-white dark:via-gray-900 to-blue-600/10 dark:to-blue-600/20 p-8 text-center sm:p-16">
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Pronto para organizar suas finanças?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
                  Crie sua conta gratuitamente e comece a ter controle total sobre
                  o seu dinheiro hoje mesmo.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 dark:bg-white px-8 py-4 text-lg font-semibold text-white dark:text-gray-900 transition-all hover:bg-indigo-500 dark:hover:bg-gray-100 hover:scale-[1.02]"
                  >
                    Criar conta grátis
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
                  >
                    Já tenho uma conta &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 dark:border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600">
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
