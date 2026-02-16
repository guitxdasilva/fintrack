import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "@/modules/auth/components/RegisterForm";
import { ThemeToggle } from "@/common/components/ThemeToggle";

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gray-950 p-10 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative">
          <Image src="/finplanix_name_icon.png" alt="Finplanix" width={240} height={56} className="h-14 w-auto" />
        </div>

        <div className="space-y-4 relative">
          <span className="text-6xl font-serif text-indigo-500/30 leading-none">&ldquo;</span>
          <blockquote className="text-2xl font-semibold leading-relaxed -mt-6">
            O melhor momento para começar a controlar suas finanças é agora.
          </blockquote>
          <p className="text-gray-400">
            Crie sua conta e tenha acesso a um dashboard completo e intuitivo.
          </p>
        </div>

        <p className="text-sm text-gray-500 relative">
          &copy; 2026 Finplanix
        </p>
      </div>

      <div className="flex items-center justify-center bg-background px-4 py-12 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle className="size-9" />
        </div>
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-2 lg:hidden justify-center mb-4">
            <Link href="/">
              <Image src="/finplanix_name_icon.png" alt="Finplanix" width={200} height={48} className="h-12 w-auto" />
            </Link>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
