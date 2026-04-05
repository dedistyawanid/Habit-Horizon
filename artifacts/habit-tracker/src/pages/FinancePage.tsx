import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { getTodayKey } from "@/lib/dateUtils";
import { Transaction } from "@/types/finance";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Target, Plus, Trash2, Edit2, X, Check, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Business", "Gift", "Other"];
const EXPENSE_CATEGORIES = ["Food", "Transport", "Rent", "Health", "Entertainment", "Education", "Shopping", "Utilities", "Other"];
const ACCOUNT_SOURCES = ["Cash", "BCA", "Mandiri", "BRI", "BNI", "GoPay", "OVO", "DANA", "ShopeePay", "Other"];

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatShort(amount: number) {
  const sign = amount < 0 ? "-" : "";
  const abs  = Math.abs(amount);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000)     return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)         return `${sign}${(abs / 1_000).toFixed(0)}K`;
  return amount.toLocaleString("id-ID");
}

/** Display-only: formats raw digits as IDR thousands (e.g. 1500000 → "1.500.000") */
function fmtIDRInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

const EMPTY_FORM = {
  title: "",
  amount: "",
  date: getTodayKey(),
  category: "",
  type: "income" as "income" | "expense",
  accountSource: "",
  notes: "",
};

export default function FinancePage() {
  const { transactions, financeSettings, setFinanceSettings, addTransaction, deleteTransaction, updateTransaction, totalIncome, totalExpenses, currentBalance, currentYearIncome } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setShowForm(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const annualTarget = financeSettings.annualTarget;
  const annualProgress = Math.min(100, (currentYearIncome / annualTarget) * 100);

  const filteredTx = useMemo(() => {
    const list = transactions
      .filter((t) => filterType === "all" || t.type === filterType)
      .filter((t) => filterCategory === "all" || t.category === filterCategory);

    return list.sort((a, b) => {
      if (sortOrder === "newest")  return b.date.localeCompare(a.date);
      if (sortOrder === "oldest")  return a.date.localeCompare(b.date);
      if (sortOrder === "highest") return b.amount - a.amount;
      if (sortOrder === "lowest")  return a.amount - b.amount;
      return 0;
    });
  }, [transactions, filterType, filterCategory, sortOrder]);

  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return ["all", ...Array.from(cats)];
  }, [transactions]);

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
      category: form.category || "Other",
      type: form.type,
      accountSource: form.accountSource || undefined,
      notes: form.notes || undefined,
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
      accountSource: tx.accountSource ?? "",
      notes: tx.notes ?? "",
    });
    setEditId(tx.id);
    setShowForm(true);
  }

  const categories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Finance</h1>
            <p className="text-xs text-gray-400 mt-0.5">Track your 1B IDR target</p>
          </div>
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry
          </button>
        </div>

        {/* Annual target progress */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-[28px] p-5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Annual Revenue Goal</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">{new Date().getFullYear()}</span>
              <button
                onClick={() => { setEditingGoal((v) => !v); setGoalInput(""); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all"
                title="Edit goal"
              >
                {editingGoal ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3 h-3" />}
              </button>
            </span>
          </div>

          {editingGoal ? (
            <div className="flex gap-2 mb-3">
              <input
                type="number"
                placeholder={`Current: ${annualTarget.toLocaleString()}`}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const num = Number(goalInput.trim());
                    if (!isNaN(num) && num > 0) {
                      setFinanceSettings({ ...financeSettings, annualTarget: num });
                      setEditingGoal(false);
                      setGoalInput("");
                    }
                  }
                  if (e.key === "Escape") setEditingGoal(false);
                }}
                className="flex-1 px-3 py-2 rounded-xl border border-primary/30 bg-white/70 dark:bg-gray-800/70 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
                data-testid="input-annual-target"
              />
              <button
                onClick={() => {
                  const num = Number(goalInput.trim());
                  if (!isNaN(num) && num > 0) {
                    setFinanceSettings({ ...financeSettings, annualTarget: num });
                    setEditingGoal(false);
                    setGoalInput("");
                  }
                }}
                className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1"
                data-testid="btn-set-annual-target"
              >
                <Check className="w-3.5 h-3.5" /> Set
              </button>
            </div>
          ) : (
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatShort(currentYearIncome)}</span>
              <span className="text-xs text-gray-500">/ {formatShort(annualTarget)} IDR</span>
            </div>
          )}

          <div className="h-2.5 bg-white/60 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${annualProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">{annualProgress.toFixed(2)}% of {formatShort(annualTarget)} target</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-card rounded-[28px] p-4 border border-[#E5E0D8] dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-gray-500">Balance</span>
            </div>
            <p className={cn("text-lg font-bold", currentBalance >= 0 ? "text-emerald-600" : "text-red-500")}>
              {formatShort(currentBalance)}
            </p>
          </div>
          <div className="bg-white dark:bg-card rounded-[28px] p-4 border border-[#E5E0D8] dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#5c7c6c]" />
              <span className="text-xs text-gray-500">Revenue</span>
            </div>
            <p className="text-lg font-bold text-[#5c7c6c]">{formatShort(totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-card rounded-[28px] p-4 border border-[#E5E0D8] dark:border-white/10">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-gray-500">Expenses</span>
            </div>
            <p className="text-lg font-bold text-red-500">{formatShort(totalExpenses)}</p>
          </div>
        </div>

        {/* Chart */}
        {cumulativeData.length > 1 && (
          <div className="bg-white dark:bg-card rounded-[28px] p-5 border border-[#E5E0D8] dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Growth</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={cumulativeData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={(v) => formatShort(v)} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => [formatIDR(v), "Cumulative"]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transaction list */}
        <div className="bg-white dark:bg-card rounded-[28px] border border-[#E5E0D8] dark:border-white/10 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-y-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">Transactions</h2>
            <div className="flex gap-1">
              {(["all", "income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                    filterType === t ? "bg-primary text-primary-foreground" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {availableCategories.length > 1 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
                ))}
              </select>
            )}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </div>
          {filteredTx.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              <DollarSign className="w-7 h-7 mx-auto mb-2 opacity-40" />
              No transactions yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredTx.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => startEdit(tx)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    tx.type === "income" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"
                  )}>
                    {tx.type === "income"
                      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{tx.title}</p>
                    <p className="text-xs text-gray-400">
                      {tx.category}
                      {tx.accountSource && <> · {tx.accountSource}</>}
                      <> · {tx.date}</>
                    </p>
                  </div>
                  <p className={cn(
                    "text-sm font-semibold shrink-0",
                    tx.type === "income" ? "text-emerald-600" : "text-red-500"
                  )}>
                    {tx.type === "income" ? "+" : "-"}{formatShort(tx.amount)}
                  </p>
                  <div className="flex gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(tx); }}
                      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-gray-400/60 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 active:text-primary transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-gray-400/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-[28px] w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                className="field-dark w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none select-none">
                  Rp
                </span>
                <input
                  placeholder="0"
                  type="text"
                  inputMode="numeric"
                  value={fmtIDRInput(form.amount)}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setForm((f) => ({ ...f, amount: digits }));
                  }}
                  className="field-dark w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="field-dark px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="field-dark px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select
                value={form.accountSource}
                onChange={(e) => setForm((f) => ({ ...f, accountSource: e.target.value }))}
                className="field-dark w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Account / Source (optional)</option>
                {ACCOUNT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="field-dark w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
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
