import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FinTrack - Dashboard Financeiro Pessoal",
  description:
    "Controle suas finanças pessoais com gráficos interativos, categorias e metas financeiras.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full overflow-y-scroll">
      <body className={`${inter.variable} font-sans antialiased bg-slate-100 dark:bg-background`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
