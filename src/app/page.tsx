import Link from "next/link";
import { LuTrendingUp, LuShield, LuChartBar, LuArrowRight } from "react-icons/lu";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuTrendingUp className="w-8 h-8 text-indigo-500" />
            <span className="text-xl font-bold text-white">FinTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Suas finanças no{" "}
          <span className="text-indigo-500">controle total</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Dashboard financeiro pessoal com gráficos interativos, categorias
          inteligentes e metas que te ajudam a alcançar seus objetivos.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Começar agora <LuArrowRight className="w-5 h-5" />
        </Link>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <LuChartBar className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Dashboard Inteligente
            </h3>
            <p className="text-gray-400">
              Visualize receitas, despesas e saldo em gráficos interativos e
              fáceis de entender.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <LuTrendingUp className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Metas Financeiras
            </h3>
            <p className="text-gray-400">
              Defina metas e acompanhe seu progresso em tempo real para
              alcançar seus objetivos.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <LuShield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Seguro e Privado
            </h3>
            <p className="text-gray-400">
              Seus dados financeiros protegidos com autenticação segura e
              criptografia.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-24">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
          <p>&copy; 2026 FinTrack. Feito com Next.js, TypeScript e Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}
