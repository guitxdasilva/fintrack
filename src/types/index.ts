export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export type TransactionType = "INCOME" | "EXPENSE";

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
}

export interface CreateTransactionDTO {
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  categoryId: string;
}

export type UpdateTransactionDTO = Partial<CreateTransactionDTO>;

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
  recentTransactions: Transaction[];
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
