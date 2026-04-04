import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Transaction } from "@/types/finance";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Target, Plus, Trash2, Edit2, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Other"];
const EXPENSE_CATEGORIES = ["Food", "Transport", "Rent", "Health", "Entertainment", "Education", "Shopping", "Utilities", "Other"];

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatShort(amount: number) {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toString();
}

const EMPTY_FORM = {
  title: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  category: "",
  type: "income" as "income" | "expense",
  notes: "",
};

export default function FinancePage() {
  const { transactions, financeSettings, addTransaction, deleteTransaction, updateTransaction, totalIncome, totalExpenses, currentBalance, currentYearIncome } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const annualTarget = financeSettings.annualTarget;
  const annualProgress = Math.min(100, (currentYearIncome / annualTarget) * 100);

  const filteredTx = useMemo(() => {
    return transactions.filter((t) => filterType === "all" || t.type === filterType);
  }, [transactions, filterType]);

  const cumulativeData = useMemo(() => {
    const sorted = [...transactions]
      .filter((t) => t.type === "income")
      .sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return sorted.slice(-30).map((t) => {
      running += t.amount;
      return { date: t.date.slice(5), cumulative: running };
    });
  }, [transactions]);

  function handleSubmit() {
    const amt = parseFloat(form.amount);
    if (!form.title || !form.amount || isNaN(amt) || amt <= 0) return;
    const data = {
      title: form.title,
      amount: amt,
      date: form.date,
      category: form.category || (form.type === "income" ? "Other" : "Other"),
      type: form.type,
      notes: form.notes,
    };
    if (editId) {
      updateTransaction(editId, data);
      setEditId(null);
    } else {
      addTransaction(data);
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function startEdit(tx: Transaction) {
    setForm({
      title: tx.title,
      amount: tx.amount.toString(),
      date: tx.date,
      category: tx.category,
      type: tx.type,
      notes: tx.notes ?? "",
    });
    setEditId(tx.id);
    setShowForm(true);
  }

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your path to 1,000,000,000 IDR</p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      {/* Annual target progress */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">Annual Revenue Goal</span>
          <span className="ml-auto text-xs text-gray-500">{new Date().getFullYear()}</span>
        </div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatShort(currentYearIncome)}</span>
          <span className="text-sm text-gray-500">/ {formatShort(annualTarget)} IDR</span>
        </div>
        <div className="h-3 bg-white/60 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${annualProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">{annualProgress.toFixed(2)}% of 1 Billion IDR target reached</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500">Current Balance</span>
          </div>
          <p className={cn("text-2xl font-bold", currentBalance >= 0 ? "text-emerald-600" : "text-red-500")}>
            {formatShort(currentBalance)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatIDR(currentBalance)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatShort(totalIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatIDR(totalIncome)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-500">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{formatShort(totalExpenses)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatIDR(totalExpenses)}</p>
        </div>
      </div>

      {/* Cumulative revenue chart */}
      {cumulativeData.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Growth (Last 30 entries)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={cumulativeData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => formatShort(v)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [formatIDR(v), "Cumulative"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">Transactions</h2>
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                filterType === t ? "bg-primary text-primary-foreground" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {filteredTx.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No transactions yet. Add your first entry!
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filteredTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  tx.type === "income" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"
                )}>
                  {tx.type === "income"
                    ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{tx.title}</p>
                  <p className="text-xs text-gray-400">{tx.category} · {tx.date}</p>
                </div>
                <p className={cn(
                  "text-sm font-semibold",
                  tx.type === "income" ? "text-emerald-600" : "text-red-500"
                )}>
                  {tx.type === "income" ? "+" : "-"}{formatShort(tx.amount)}
                </p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(tx)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteTransaction(tx.id)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {editId ? "Edit Transaction" : "New Transaction"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4">
              {(["income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium capitalize transition-all",
                    form.type === t
                      ? t === "income" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                placeholder="Amount (IDR)"
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editId ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
