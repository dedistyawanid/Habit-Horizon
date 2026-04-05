export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  type: TransactionType;
  accountSource?: string;
  notes?: string;
  createdAt: string;
}

export interface FinanceSettings {
  annualTarget: number;
  currency: string;
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  annualTarget: 1_000_000_000,
  currency: "IDR",
};
