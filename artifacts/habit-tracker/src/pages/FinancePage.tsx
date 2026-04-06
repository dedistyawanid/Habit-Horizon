import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { getTodayKey } from "@/lib/dateUtils";
import { Transaction } from "@/types/finance";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, TrendingDown, Target, Plus, Trash2, Edit2, X, Check, Pencil, Settings2,
  Star, ImageOff, PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryManager } from "@/components/CategoryManager";

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

/** Format a YYYY-MM-DD (or ISO) date string as "05 Apr 2026", or "Today" if it matches today. */
function fmtTxDate(dateStr: string): string {
  const ymd = dateStr.split("T")[0];
  const [y, m, d] = ymd.split("-").map(Number);
  const now = new Date();
  if (now.getFullYear() === y && now.getMonth() + 1 === m && now.getDate() === d) return "Today";
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
  const { transactions, financeSettings, setFinanceSettings, addTransaction, deleteTransaction, updateTransaction, totalIncome, totalExpenses, currentBalance, currentYearIncome,
          wishlist, addWishlistItem, updateWishlistItem, deleteWishlistItem, addWishlistSavings } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [manageOpen, setManageOpen] = useState<"picker" | "income" | "expense" | "source" | null>(null);

  const EMPTY_WISH = { title: "", targetAmount: "", imageUrl: "" };
  const [showWishForm, setShowWishForm]       = useState(false);
  const [editWishId,   setEditWishId]         = useState<string | null>(null);
  const [wishForm,     setWishForm]           = useState(EMPTY_WISH);
  const [savingsInput, setSavingsInput]       = useState<Record<string, string>>({});
  const [showSavings,  setShowSavings]        = useState<string | null>(null);
  const [confirmDelWish, setConfirmDelWish]   = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      setShowForm(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  /* Notify App shell to hide FAB while the manage picker is open */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("finance-manage-open", {
      detail: { active: manageOpen === "picker" },
    }));
  }, [manageOpen]);

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
      return { date: t.date.split("T")[0].slice(5), cumulative: running };
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

  const incomeCategories  = financeSettings.incomeCategories?.length  ? financeSettings.incomeCategories  : ["Salary", "Freelance", "Investment", "Business", "Gift", "Other"];
  const expenseCategories = financeSettings.expenseCategories?.length ? financeSettings.expenseCategories : ["Food", "Transport", "Rent", "Health", "Entertainment", "Education", "Shopping", "Utilities", "Other"];
  const accountSources    = financeSettings.accountSources?.length    ? financeSettings.accountSources    : ["Cash", "BCA", "Mandiri", "BRI", "BNI", "GoPay", "OVO", "DANA", "ShopeePay", "Other"];
  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-40 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Finance</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setManageOpen("picker")}
              className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-accent/80 transition-all"
              title="Manage categories & sources"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Entry
            </button>
          </div>
        </div>

        {/* ── Manage picker (centered glassmorphism modal) ── */}
        {manageOpen === "picker" && (
          <div
            className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setManageOpen(null)}
          >
            <div
              className="glass-modal-card w-full max-w-sm p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-base font-bold text-foreground">Manage Finance Lists</p>
                <button
                  onClick={() => setManageOpen(null)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/30 dark:hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {([
                  { key: "income",  label: "Income Categories",  sub: `${incomeCategories.length} items`  },
                  { key: "expense", label: "Expense Categories", sub: `${expenseCategories.length} items` },
                  { key: "source",  label: "Account Sources",    sub: `${accountSources.length} items`    },
                ] as const).map(({ key, label, sub }) => (
                  <button
                    key={key}
                    onClick={() => setManageOpen(key)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground">{sub} →</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Category & Source Managers ── */}
        <CategoryManager
          open={manageOpen === "income"}
          onClose={() => setManageOpen(null)}
          title="Income Categories"
          categories={incomeCategories}
          onAdd={(name) => setFinanceSettings({ ...financeSettings, incomeCategories: [...incomeCategories, name] })}
          onRename={(old, next) => setFinanceSettings({ ...financeSettings, incomeCategories: incomeCategories.map((c) => c === old ? next : c) })}
          onDelete={(name) => setFinanceSettings({ ...financeSettings, incomeCategories: incomeCategories.filter((c) => c !== name) })}
        />
        <CategoryManager
          open={manageOpen === "expense"}
          onClose={() => setManageOpen(null)}
          title="Expense Categories"
          categories={expenseCategories}
          onAdd={(name) => setFinanceSettings({ ...financeSettings, expenseCategories: [...expenseCategories, name] })}
          onRename={(old, next) => setFinanceSettings({ ...financeSettings, expenseCategories: expenseCategories.map((c) => c === old ? next : c) })}
          onDelete={(name) => setFinanceSettings({ ...financeSettings, expenseCategories: expenseCategories.filter((c) => c !== name) })}
        />
        <CategoryManager
          open={manageOpen === "source"}
          onClose={() => setManageOpen(null)}
          title="Account Sources"
          categories={accountSources}
          onAdd={(name) => setFinanceSettings({ ...financeSettings, accountSources: [...accountSources, name] })}
          onRename={(old, next) => setFinanceSettings({ ...financeSettings, accountSources: accountSources.map((s) => s === old ? next : s) })}
          onDelete={(name) => setFinanceSettings({ ...financeSettings, accountSources: accountSources.filter((s) => s !== name) })}
        />

        {/* Annual target progress */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-[28px] p-5 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Annual Revenue Goal</span>
            <span className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{new Date().getFullYear()}</span>
              <button
                onClick={() => { setEditingGoal((v) => !v); setGoalInput(""); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-white/60 dark:hover:bg-accent transition-all"
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
                className="flex-1 px-3 py-2 rounded-xl border border-primary/30 bg-white/70 dark:bg-accent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              <span className="text-2xl font-bold text-foreground">{formatShort(currentYearIncome)}</span>
              <span className="text-xs text-muted-foreground">/ {formatShort(annualTarget)} IDR</span>
            </div>
          )}

          <div className="h-2.5 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${annualProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{annualProgress.toFixed(2)}% of {formatShort(annualTarget)} target</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-card rounded-[28px] p-4 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Balance</span>
            </div>
            <p className={cn("text-lg font-bold", currentBalance >= 0 ? "text-emerald-600" : "text-red-500")}>
              {formatShort(currentBalance)}
            </p>
          </div>
          <div className="bg-white dark:bg-card rounded-[28px] p-4 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#5c7c6c]" />
              <span className="text-xs text-muted-foreground">Revenue</span>
            </div>
            <p className="text-lg font-bold text-[#5c7c6c]">{formatShort(totalIncome)}</p>
          </div>
          <div className="bg-white dark:bg-card rounded-[28px] p-4 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-muted-foreground">Expenses</span>
            </div>
            <p className="text-lg font-bold text-red-500">{formatShort(totalExpenses)}</p>
          </div>
        </div>

        {/* Chart */}
        {cumulativeData.length > 1 && (
          <div className="bg-white dark:bg-card rounded-[28px] p-5 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
            <h2 className="text-sm font-semibold text-foreground mb-4">Revenue Growth</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={cumulativeData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" tickFormatter={(d) => d.replace("-", "/")} />
                <YAxis tickFormatter={(v) => formatShort(v)} tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => [formatIDR(v), "Cumulative"]} labelFormatter={(d) => String(d).replace("-", "/")} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Line type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transaction list */}
        <div className="bg-white dark:bg-card rounded-[28px] border border-[#E5E0D8] dark:border-[hsl(var(--border))] overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-[hsl(var(--border))] flex-wrap gap-y-2">
            <h2 className="text-sm font-semibold text-foreground flex-1">Transactions</h2>
            <div className="flex gap-1">
              {(["all", "income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                    filterType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
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
                className="text-xs border border-[hsl(var(--border))] rounded-lg px-2 py-1 bg-card text-foreground focus:outline-none"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
                ))}
              </select>
            )}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="text-xs border border-[hsl(var(--border))] rounded-lg px-2 py-1 bg-card text-foreground focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </div>
          {filteredTx.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              <DollarSign className="w-7 h-7 mx-auto mb-2 opacity-40" />
              No transactions yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredTx.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => startEdit(tx)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-all active:scale-[0.98] cursor-pointer"
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
                    <p className="text-sm font-medium text-foreground truncate">{tx.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category}
                      {tx.accountSource && <> · {tx.accountSource}</>}
                      <> · {fmtTxDate(tx.date)}</>
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
                      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-primary hover:bg-accent dark:hover:bg-accent active:text-primary transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Wishlist & Goals ─────────────────────────────── */}
        <div className="bg-card rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Wishlist & Goals</span>
              {wishlist.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{wishlist.length}</span>
              )}
            </div>
            <button
              onClick={() => { setWishForm(EMPTY_WISH); setEditWishId(null); setShowWishForm(true); }}
              className="p-1.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              <PiggyBank className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No wishlist items yet. Add your first goal!
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 gap-3 lg:grid-cols-2 items-start">
              {wishlist.map((item) => {
                const pct = item.targetAmount > 0 ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100)) : 0;
                const done = pct >= 100;
                return (
                  <div key={item.id} className="bg-white dark:bg-accent rounded-2xl overflow-hidden border border-[hsl(var(--border))]">
                    {item.imageUrl ? (
                      <div className="w-full h-36 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-sm text-foreground leading-tight">{item.title}</p>
                          {done && (
                            <span className="inline-block text-[10px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                              Goal reached!
                            </span>
                          )}
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <button
                            onClick={() => { setWishForm({ title: item.title, targetAmount: String(item.targetAmount), imageUrl: item.imageUrl || "" }); setEditWishId(item.id); setShowWishForm(true); }}
                            className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-primary hover:bg-primary/10 active:text-primary transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setConfirmDelWish(item.id)}
                            className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {formatShort(item.currentAmount)} / {formatShort(item.targetAmount)}
                          </span>
                          <span className={cn("text-xs font-bold", done ? "text-emerald-600 dark:text-emerald-400" : "text-primary")}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", done ? "bg-emerald-500" : "bg-primary")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {item.targetAmount > item.currentAmount
                            ? `${formatShort(item.targetAmount - item.currentAmount)} to go`
                            : "Target achieved!"}
                        </p>
                      </div>

                      {showSavings === item.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={savingsInput[item.id] ? fmtIDRInput(savingsInput[item.id]) : ""}
                            onChange={(e) => setSavingsInput((s) => ({ ...s, [item.id]: e.target.value.replace(/\D/g, "") }))}
                            placeholder="Add amount…"
                            className="flex-1 text-xs px-2.5 py-1.5 rounded-xl border border-[hsl(var(--border))] bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <button
                            onClick={() => {
                              const amt = Number(savingsInput[item.id] || 0);
                              if (amt > 0) {
                                addWishlistSavings(item.id, amt);
                                addTransaction({
                                  type: "expense",
                                  title: `Savings for ${item.title}`,
                                  amount: amt,
                                  category: "Savings",
                                  date: getTodayKey(),
                                  accountSource: "",
                                  notes: "",
                                });
                                setSavingsInput((s) => ({ ...s, [item.id]: "" }));
                              }
                              setShowSavings(null);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setShowSavings(null); setSavingsInput((s) => ({ ...s, [item.id]: "" })); }}
                            className="px-2.5 py-1.5 rounded-xl border border-[hsl(var(--border))] text-xs text-muted-foreground hover:bg-card active:scale-95 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        !done && (
                          <button
                            onClick={() => setShowSavings(item.id)}
                            className="w-full py-2 rounded-xl border border-primary/25 text-primary text-xs font-medium hover:bg-primary/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <PiggyBank className="w-3 h-3" />
                            Add Savings
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Wishlist Add/Edit Modal */}
      {showWishForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowWishForm(false)}>
          <div className="pointer-events-auto w-full max-w-sm bg-card rounded-[24px] p-5 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">{editWishId ? "Edit Wishlist Item" : "New Wishlist Item"}</h3>
              <button onClick={() => setShowWishForm(false)} className="p-1.5 rounded-xl bg-accent text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title (e.g. New Car)"
                value={wishForm.title}
                onChange={(e) => setWishForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Target Amount"
                  value={wishForm.targetAmount ? fmtIDRInput(wishForm.targetAmount) : ""}
                  onChange={(e) => setWishForm((f) => ({ ...f, targetAmount: e.target.value.replace(/\D/g, "") }))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <input
                type="url"
                placeholder="Image URL (optional)"
                value={wishForm.imageUrl}
                onChange={(e) => setWishForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {wishForm.imageUrl && (
                <div className="w-full h-28 rounded-xl overflow-hidden bg-muted">
                  <img src={wishForm.imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowWishForm(false)} className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm text-muted-foreground hover:bg-accent transition-colors">Cancel</button>
              <button
                onClick={() => {
                  const title = wishForm.title.trim();
                  const target = Number(wishForm.targetAmount);
                  if (!title || !target) return;
                  if (editWishId) {
                    updateWishlistItem(editWishId, { title, targetAmount: target, imageUrl: wishForm.imageUrl || undefined });
                  } else {
                    addWishlistItem({ title, targetAmount: target, currentAmount: 0, imageUrl: wishForm.imageUrl || undefined });
                  }
                  setShowWishForm(false);
                  setEditWishId(null);
                  setWishForm(EMPTY_WISH);
                }}
                className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editWishId ? "Update" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Delete Confirm */}
      {confirmDelWish && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelWish(null)}>
          <div className="pointer-events-auto w-full max-w-xs bg-card rounded-[24px] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-foreground font-semibold text-center mb-1">Delete this item?</p>
            <p className="text-muted-foreground text-xs text-center mb-4">All saved progress will be lost.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelWish(null)} className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm text-muted-foreground hover:bg-accent transition-colors">Cancel</button>
              <button
                onClick={() => { deleteWishlistItem(confirmDelWish); setConfirmDelWish(null); }}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-card rounded-[28px] w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {editId ? "Edit Transaction" : "New Transaction"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-1 rounded-lg text-muted-foreground hover:text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[hsl(var(--border))] mb-4">
              {(["income", "expense"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t, category: "" }))}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium capitalize transition-all",
                    form.type === t
                      ? t === "income" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      : "text-muted-foreground hover:bg-accent"
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
                className="field-dark w-full px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none select-none">
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
                  className="field-dark w-full pl-8 pr-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="field-dark px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="field-dark px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <select
                value={form.accountSource}
                onChange={(e) => setForm((f) => ({ ...f, accountSource: e.target.value }))}
                className="field-dark w-full px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Account / Source (optional)</option>
                {accountSources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="field-dark w-full px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-accent text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
                className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
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
