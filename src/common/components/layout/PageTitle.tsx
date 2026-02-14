"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transações",
  "/categories": "Categorias",
  "/cards": "Cartões",
  "/goals": "Metas",
  "/budget": "Orçamento",
};

export function PageTitle() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "";

  if (!title) return null;

  return (
    <span className="text-sm font-medium text-foreground hidden md:inline">
      {title}
    </span>
  );
}
