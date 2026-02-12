import type { TransactionType } from "@/types";

interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Salário", icon: "💰", color: "#22c55e", type: "INCOME" },
  { name: "Freelance", icon: "💻", color: "#3b82f6", type: "INCOME" },
  { name: "Investimentos", icon: "📈", color: "#8b5cf6", type: "INCOME" },
  { name: "Outros", icon: "📦", color: "#6b7280", type: "INCOME" },
  { name: "Alimentação", icon: "🍔", color: "#ef4444", type: "EXPENSE" },
  { name: "Transporte", icon: "🚗", color: "#f59e0b", type: "EXPENSE" },
  { name: "Moradia", icon: "🏠", color: "#6366f1", type: "EXPENSE" },
  { name: "Saúde", icon: "🏥", color: "#ec4899", type: "EXPENSE" },
  { name: "Educação", icon: "📚", color: "#14b8a6", type: "EXPENSE" },
  { name: "Lazer", icon: "🎮", color: "#f97316", type: "EXPENSE" },
  { name: "Roupas", icon: "👕", color: "#a855f7", type: "EXPENSE" },
  { name: "Assinaturas", icon: "📱", color: "#0ea5e9", type: "EXPENSE" },
];
