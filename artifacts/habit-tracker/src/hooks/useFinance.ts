import { useState, useEffect, useCallback } from "react";
import { Transaction, FinanceSettings, DEFAULT_FINANCE_SETTINGS } from "@/types/finance";

const TRANSACTIONS_KEY = "dedi_transactions";
const FINANCE_SETTINGS_KEY = "dedi_finance_settings";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => load(TRANSACTIONS_KEY, []));
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>(() => load(FINANCE_SETTINGS_KEY, DEFAULT_FINANCE_SETTINGS));

  useEffect(() => { save(TRANSACTIONS_KEY, transactions); }, [transactions]);
  useEffect(() => { save(FINANCE_SETTINGS_KEY, financeSettings); }, [financeSettings]);

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "createdAt">) => {
    const newTx: Transaction = {
      ...tx,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => {
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const currentBalance = totalIncome - totalExpenses;

  const currentYearIncome = transactions.filter((t) => {
    const year = new Date(t.date).getFullYear();
    return t.type === "income" && year === new Date().getFullYear();
  }).reduce((s, t) => s + t.amount, 0);

  return {
    transactions,
    financeSettings,
    setFinanceSettings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    totalIncome,
    totalExpenses,
    currentBalance,
    currentYearIncome,
  };
}
