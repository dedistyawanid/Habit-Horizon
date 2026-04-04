import { useState } from "react";
import { Plus, LayoutGrid, List, SlidersHorizontal, TrendingUp, AlertCircle, Quote, PenLine, Target } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { HabitCard } from "@/components/HabitCard";
import { HabitForm } from "@/components/HabitForm";
import { MonthlyRecap } from "@/components/MonthlyRecap";
import { QuickNoteModal } from "@/components/QuickNoteModal";
import { Habit, HabitWithStats } from "@/types/habit";
import { getGreeting, getMotivationQuote } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SortOption = "name" | "performance" | "created";
type FilterCategory = "All" | string;

export default function Dashboard() {
  const {
    habitsWithStats, topPerforming, needsAttention,
    addHabit, updateHabit, deleteHabit,
    checkIns, settings,
  } = useApp();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("All");
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [searchQuery, setSearchQuery] = useState("");
  const [recapHabit, setRecapHabit] = useState<HabitWithStats | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const greeting = getGreeting();
  const quote = getMotivationQuote();
  const { profile } = settings;

  const firstName = profile.fullName.split(" ")[0] || profile.fullName;
  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const allCategories: FilterCategory[] = ["All", ...settings.habitCategories];

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

  const totalToday = habitsWithStats.length;

  function handleEdit(habit: HabitWithStats) {
    setEditingHabit(habit);
  }

  function handleUpdate(values: Omit<Habit, "id" | "createdAt">) {
    if (editingHabit) {
      updateHabit(editingHabit.id, values);
      setEditingHabit(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header with profile */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                data-testid="avatar-img"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-lg font-bold text-violet-600 dark:text-violet-400 flex-shrink-0"
                data-testid="avatar-initials"
              >
                {initials}
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {greeting},
              </p>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100" data-testid="greeting-heading">
                {profile.fullName} 👋
              </h1>
            </div>
          </div>
          {(profile.weight || profile.height) && (
            <div className="hidden sm:flex gap-3 text-right flex-shrink-0">
              {profile.weight && (
                <div className="text-xs text-gray-500">
                  <div className="font-bold text-gray-700 dark:text-gray-300 text-sm">{profile.weight} kg</div>
                  <div>Weight</div>
                </div>
              )}
              {profile.height && (
                <div className="text-xs text-gray-500">
                  <div className="font-bold text-gray-700 dark:text-gray-300 text-sm">{profile.height} cm</div>
                  <div>Height</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mission + Quote */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 rounded-2xl p-5 border border-violet-100 dark:border-violet-900/30 space-y-3">
          {profile.mission && (
            <div className="flex gap-2 items-center">
              <Target className="w-4 h-4 text-violet-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300" data-testid="mission-text">
                {profile.mission}
              </p>
            </div>
          )}
          <div className="flex gap-3 items-start">
            <Quote className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic" data-testid="motivation-quote">
              {quote}
            </p>
          </div>
        </div>

        {/* Performance insights */}
        {habitsWithStats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs text-gray-500 mb-1">Today</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100" data-testid="today-stats">
                {todayDone} <span className="text-sm font-normal text-gray-400">/ {totalToday}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">habits completed</p>
              <Progress value={totalToday > 0 ? (todayDone / totalToday) * 100 : 0} className="h-1.5 mt-2" />
            </div>

            {topPerforming && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Top Performing</p>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate" data-testid="top-habit-name">
                  {topPerforming.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{topPerforming.completionPercentage}% this month</p>
                <Progress value={topPerforming.completionPercentage} className="h-1.5 mt-2" />
              </div>
            )}

            {needsAttention && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Needs Attention</p>
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate" data-testid="attention-habit-name">
                  {needsAttention.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{needsAttention.completionPercentage}% this month</p>
                <Progress value={needsAttention.completionPercentage} className="h-1.5 mt-2" />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-900"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
              <SelectTrigger className="w-36 bg-white dark:bg-gray-900" data-testid="filter-category">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-36 bg-white dark:bg-gray-900" data-testid="sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
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

            <Button onClick={() => setShowForm(true)} className="gap-2" data-testid="btn-add-habit">
              <Plus className="w-4 h-4" />
              Add Habit
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {allCategories.map((cat) => {
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
                {cat} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Habits list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            {habitsWithStats.length === 0 ? (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/40 rounded-2xl flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">No habits yet</p>
                <p className="text-sm text-gray-400">Start building your first habit today!</p>
                <Button onClick={() => setShowForm(true)} className="mt-2" data-testid="btn-empty-add">
                  Add Your First Habit
                </Button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No habits match your current filter</p>
            )}
          </div>
        ) : (
          <div className={cn("gap-4", view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col")}>
            {filtered.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                view={view}
                onEdit={handleEdit}
                onDelete={deleteHabit}
                onRecap={setRecapHabit}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB - Quick Note */}
      <button
        onClick={() => setShowNoteModal(true)}
        data-testid="fab-quick-note"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 active:scale-95"
        title="Quick Note"
      >
        <PenLine className="w-6 h-6" />
      </button>

      {/* Modals */}
      <HabitForm open={showForm} onClose={() => setShowForm(false)} onSubmit={addHabit} mode="add" />
      <HabitForm
        open={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSubmit={handleUpdate}
        initialValues={editingHabit || undefined}
        mode="edit"
      />
      <QuickNoteModal open={showNoteModal} onClose={() => setShowNoteModal(false)} />
      <Dialog open={!!recapHabit} onOpenChange={() => setRecapHabit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="truncate">{recapHabit?.name} — Monthly Recap</DialogTitle>
          </DialogHeader>
          {recapHabit && <MonthlyRecap habit={recapHabit} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
