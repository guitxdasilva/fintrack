export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export type TransactionType = "INCOME" | "EXPENSE";

export type PaymentType = "CASH" | "PIX" | "CARD" | "TRANSFER" | "BANK_SLIP";

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CASH: "Dinheiro",
  PIX: "PIX",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  BANK_SLIP: "Boleto",
};

export const PAYMENT_TYPE_ICONS: Record<PaymentType, string> = {
  CASH: "💵",
  PIX: "⚡",
  CARD: "💳",
  TRANSFER: "🏦",
  BANK_SLIP: "📄",
};

export const PAYMENT_TYPES: PaymentType[] = ["CASH", "PIX", "CARD", "TRANSFER", "BANK_SLIP"];

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  categoryId: string;
  category: Category;
  paymentType?: string | null;
  cardId?: string | null;
  card?: Card | null;
  cardType?: string | null;
  installments?: number | null;
  currentInstallment?: number | null;
  installmentGroupId?: string | null;
  paid?: boolean;
  paidAt?: string | null;
  isFixed?: boolean;
}

export interface CreateTransactionDTO {
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  categoryId: string;
  paymentType?: string;
  cardId?: string;
  cardType?: string;
  installments?: number;
  isFixed?: boolean;
}

export type UpdateTransactionDTO = Partial<CreateTransactionDTO>;

export type ClosingDayType = "FIXED" | "BEFORE_END";

export const CLOSING_DAY_TYPE_LABELS: Record<ClosingDayType, string> = {
  FIXED: "Dia fixo do mês",
  BEFORE_END: "Dias antes do fim do mês",
};

export interface Card {
  id: string;
  name: string;
  icon?: string;
  closingDayType?: string | null;
  closingDayValue?: number | null;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color: string;
  type: TransactionType;
  userId: string;
}

export interface CreateCategoryDTO {
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateGoalDTO {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
}

export type UpdateGoalDTO = Partial<CreateGoalDTO>;

export interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  totalPaid: number;
  totalPending: number;
  transactions: Transaction[];
  expensesByCategory: CategorySummary[];
  monthlyData: MonthlyData[];
}

export interface CategorySummary {
  category: string;
  color: string;
  total: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
