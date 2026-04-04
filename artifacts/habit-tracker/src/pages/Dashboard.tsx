import { useState } from "react";
import { Plus, Download, LayoutGrid, List, SlidersHorizontal, TrendingUp, AlertCircle, Quote } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { HabitCard } from "@/components/HabitCard";
import { HabitForm } from "@/components/HabitForm";
import { MonthlyRecap } from "@/components/MonthlyRecap";
import { Habit, HabitWithStats, HabitCategory, HabitFrequency } from "@/types/habit";
import { getGreeting, getMotivationQuote } from "@/lib/dateUtils";
import { exportAsCSV, exportAsJSON } from "@/lib/exportUtils";
import { getCategoryColor } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SortOption = "name" | "performance" | "created";
type FilterCategory = "All" | HabitCategory;

export default function Dashboard() {
  const {
    habitsWithStats,
    topPerforming,
    needsAttention,
    addHabit,
    updateHabit,
    deleteHabit,
    exportData,
    habits,
    checkIns,
  } = useHabits();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("All");
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [searchQuery, setSearchQuery] = useState("");
  const [recapHabit, setRecapHabit] = useState<HabitWithStats | null>(null);

  const greeting = getGreeting();
  const quote = getMotivationQuote();

  const categories: FilterCategory[] = ["All", "Health", "Work", "Skill", "Finance", "Social", "Personal", "Other"];
  const categoryLabels: Record<FilterCategory, string> = {
    All: "Semua",
    Health: "Kesehatan",
    Work: "Pekerjaan",
    Skill: "Keterampilan",
    Finance: "Keuangan",
    Social: "Sosial",
    Personal: "Pribadi",
    Other: "Lainnya",
  };

  const filtered = habitsWithStats
    .filter((h) => filterCategory === "All" || h.category === filterCategory)
    .filter((h) => !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "performance") return b.completionPercentage - a.completionPercentage;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const todayDone = habitsWithStats.filter((h) => {
    const today = new Date().toISOString().split("T")[0];
    return checkIns.some((c) => c.habitId === h.id && c.date === today);
  }).length;

  const totalToday = habitsWithStats.filter((h) => h.frequency === "Daily" || h.frequency === "Weekly" || h.frequency === "Monthly").length;
  const overallPct = habitsWithStats.length > 0
    ? Math.round(habitsWithStats.reduce((sum, h) => sum + h.completionPercentage, 0) / habitsWithStats.length)
    : 0;

  function handleEdit(habit: HabitWithStats) {
    setEditingHabit(habit);
  }

  function handleUpdate(values: Omit<Habit, "id" | "createdAt">) {
    if (editingHabit) {
      updateHabit(editingHabit.id, values);
      setEditingHabit(null);
    }
  }

  function handleExportCSV() {
    exportAsCSV(habits, checkIns);
  }

  function handleExportJSON() {
    exportAsJSON(habits, checkIns);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{greeting},</p>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100" data-testid="greeting-heading">
            Dedi Styawan 👋
          </h1>
        </div>

        {/* Daily motivation */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 rounded-2xl p-5 border border-violet-100 dark:border-violet-900/30">
          <div className="flex gap-3 items-start">
            <Quote className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic" data-testid="motivation-quote">
              {quote}
            </p>
          </div>
        </div>

        {/* Performance insight */}
        {habitsWithStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 col-span-1">
              <p className="text-xs text-gray-500 mb-1">Hari ini</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100" data-testid="today-stats">
                {todayDone} <span className="text-sm font-normal text-gray-400">/ {totalToday}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">kebiasaan selesai</p>
              <Progress value={totalToday > 0 ? (todayDone / totalToday) * 100 : 0} className="h-1.5 mt-2" />
            </div>

            {topPerforming && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Top Performing</p>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate" data-testid="top-habit-name">{topPerforming.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{topPerforming.completionPercentage}% bulan ini</p>
                <Progress value={topPerforming.completionPercentage} className="h-1.5 mt-2" />
              </div>
            )}

            {needsAttention && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Perlu Perhatian</p>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate" data-testid="attention-habit-name">{needsAttention.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{needsAttention.completionPercentage}% bulan ini</p>
                <Progress value={needsAttention.completionPercentage} className="h-1.5 mt-2" />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari kebiasaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-900"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as FilterCategory)}>
              <SelectTrigger className="w-36 bg-white dark:bg-gray-900" data-testid="filter-category">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-36 bg-white dark:bg-gray-900" data-testid="sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Terbaru</SelectItem>
                <SelectItem value="name">Nama</SelectItem>
                <SelectItem value="performance">Performa</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => setView("grid")}
                className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600" : "text-gray-400 hover:text-gray-600")}
                data-testid="btn-grid-view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600" : "text-gray-400 hover:text-gray-600")}
                data-testid="btn-list-view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="bg-white dark:bg-gray-900" data-testid="btn-export">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV} data-testid="export-csv">
                  Ekspor sebagai CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON} data-testid="export-json">
                  Ekspor sebagai JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => setShowForm(true)} className="gap-2" data-testid="btn-add-habit">
              <Plus className="w-4 h-4" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => {
            const count = cat === "All"
              ? habitsWithStats.length
              : habitsWithStats.filter((h) => h.category === cat).length;
            if (cat !== "All" && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                data-testid={`filter-pill-${cat}`}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                  filterCategory === cat
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-300"
                )}
              >
                {categoryLabels[cat]} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Habits */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            {habitsWithStats.length === 0 ? (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/40 rounded-2xl flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Belum ada kebiasaan</p>
                <p className="text-sm text-gray-400">Mulai tambahkan kebiasaan pertamamu!</p>
                <Button onClick={() => setShowForm(true)} className="mt-2" data-testid="btn-empty-add">
                  Tambah Kebiasaan
                </Button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Tidak ada kebiasaan yang cocok dengan filter</p>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "gap-4",
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col"
            )}
          >
            {filtered.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                view={view}
                onEdit={handleEdit}
                onDelete={deleteHabit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add habit form */}
      <HabitForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={addHabit}
        mode="add"
      />

      {/* Edit habit form */}
      <HabitForm
        open={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSubmit={handleUpdate}
        initialValues={editingHabit || undefined}
        mode="edit"
      />

      {/* Monthly recap dialog */}
      <Dialog open={!!recapHabit} onOpenChange={() => setRecapHabit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="truncate">{recapHabit?.name} — Rekap Bulanan</DialogTitle>
          </DialogHeader>
          {recapHabit && <MonthlyRecap habit={recapHabit} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
