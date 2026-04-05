import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, LayoutGrid, List, TrendingUp, AlertCircle, Quote, Target, Bell, Tag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { HabitCard } from "@/components/HabitCard";
import { HabitForm } from "@/components/HabitForm";
import { MonthlyRecap } from "@/components/MonthlyRecap";
import { CategoryManager } from "@/components/CategoryManager";
import { Habit, HabitWithStats } from "@/types/habit";
import { getGreeting, getMotivationQuote } from "@/lib/dateUtils";
import { toHijri, formatHijri } from "@/lib/hijriDate";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SortOption = "name" | "performance" | "created";
type FilterCategory = "All" | string;

interface DashboardProps {
  onNewHabit?: () => void;
}

export default function Dashboard({ onNewHabit }: DashboardProps) {
  const {
    habitsWithStats, topPerforming, needsAttention,
    addHabit, updateHabit, deleteHabit,
    checkIns, settings, notes,
    addHabitCategory, renameHabitCategory, deleteHabitCategory,
  } = useApp();

  const [view, setView] = useState<"grid" | "list">("list");
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("All");
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [searchQuery, setSearchQuery] = useState("");
  const [recapHabit, setRecapHabit] = useState<HabitWithStats | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [, setLocation] = useLocation();

  const greeting = getGreeting();
  const quote = getMotivationQuote();
  const { profile } = settings;

  const firstName = profile.fullName.split(" ")[0] || profile.fullName;
  const initials = profile.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Hijri date
  const today = new Date();
  const hijri = toHijri(today);
  const hijriStr = formatHijri(hijri);
  const gregorianStr = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Today's reminders from notes
  const todayKey = today.toISOString().split("T")[0];
  const todayReminders = notes.filter(
    (n) => n.reminderEnabled && n.reminderDate === todayKey
  );

  const allCategories: FilterCategory[] = ["All", ...settings.habitCategories];

  const filtered = habitsWithStats
    .filter((h) => filterCategory === "All" || h.category === filterCategory)
    .filter((h) => !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "performance") return b.completionPercentage - a.completionPercentage;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const todayDone = habitsWithStats.filter((h) =>
    checkIns.some((c) => c.habitId === h.id && c.date === todayKey)
  ).length;
  const totalToday = habitsWithStats.length;

  function handleEdit(habit: HabitWithStats) { setEditingHabit(habit); }

  function handleUpdate(values: Omit<Habit, "id" | "createdAt">) {
    if (editingHabit) {
      updateHabit(editingHabit.id, values);
      setEditingHabit(null);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-5">

        {/* Greeting header — compact single line */}
        <div className="flex items-start justify-between pt-1">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {gregorianStr}
              <span className="mx-1.5 text-gray-300">·</span>
              <span className="text-primary/70 font-medium">{hijriStr}</span>
            </p>
          </div>
          <div className="shrink-0 mt-1">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="w-12 h-12 rounded-full object-cover shadow-md"
                data-testid="avatar-img"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-sm font-bold text-white dark:text-gray-900 shadow-md"
                data-testid="avatar-initials"
              >
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Mission + Quote */}
        <div className="bg-white dark:bg-card p-4 space-y-2" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
          {profile.mission && (
            <div className="flex gap-2 items-center">
              <Target className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-xs font-semibold text-primary" data-testid="mission-text">
                {profile.mission}
              </p>
            </div>
          )}
          <div className="flex gap-2 items-start">
            <Quote className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed italic" data-testid="motivation-quote">
              {quote}
            </p>
          </div>
        </div>

        {/* Today's progress bar */}
        {totalToday > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Today's Progress</span>
              <span className="font-semibold text-primary">{Math.round((todayDone / totalToday) * 100)}%</span>
            </div>
            <div className="habit-progress-track">
              <div
                className="habit-progress-fill"
                style={{ width: `${totalToday > 0 ? (todayDone / totalToday) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Today's Reminders */}
        {todayReminders.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Today's Reminders
              </p>
            </div>
            <div className="space-y-2">
              {todayReminders.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setLocation(`/notes?open=${note.id}`)}
                  className="w-full text-left bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 hover:shadow-sm transition-all"
                >
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 truncate">{note.title}</p>
                  {note.content && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-1">{note.content}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Performance insights */}
        {habitsWithStats.length > 0 && (topPerforming || needsAttention) && (
          <div className="grid grid-cols-2 gap-3">
            {topPerforming && (
              <div className="bg-white dark:bg-card p-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Top Habit</p>
                </div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate" data-testid="top-habit-name">
                  {topPerforming.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{topPerforming.completionPercentage}% this month</p>
              </div>
            )}
            {needsAttention && needsAttention.id !== topPerforming?.id && (
              <div className="bg-white dark:bg-card p-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Needs Work</p>
                </div>
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate" data-testid="attention-habit-name">
                  {needsAttention.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{needsAttention.completionPercentage}% this month</p>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-900 text-sm h-9"
              data-testid="input-search"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-28 bg-white dark:bg-gray-900 h-9 text-xs" data-testid="sort-by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="performance">Best</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 h-9">
            <button
              onClick={() => setView("grid")}
              className={cn("px-2 rounded-md transition-colors", view === "grid" ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600")}
              data-testid="btn-grid-view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("px-2 rounded-md transition-colors", view === "list" ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600")}
              data-testid="btn-list-view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category pills + manage button */}
        <div className="flex gap-1.5 flex-wrap items-center">
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
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                  filterCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent text-accent-foreground border-accent hover:bg-accent/70 hover:text-primary"
                )}
              >
                {cat} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
          <button
            onClick={() => setShowCategoryManager(true)}
            title="Manage categories"
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary hover:border-primary/40 transition-all"
          >
            <Tag className="w-3 h-3" />
          </button>
          <Button
            size="sm"
            className="h-7 px-3 text-xs rounded-full ml-auto gap-1"
            onClick={() => setShowForm(true)}
            data-testid="btn-add-habit"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        {/* Habits list */}
        {filtered.length === 0 ? (
          <div className="text-center py-14">
            {habitsWithStats.length === 0 ? (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Plus className="w-7 h-7 text-primary" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">No habits yet</p>
                <p className="text-xs text-gray-400">Start building your first habit today!</p>
                <Button onClick={() => setShowForm(true)} size="sm" className="mt-2" data-testid="btn-empty-add">
                  Add First Habit
                </Button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No habits match your filter</p>
            )}
          </div>
        ) : (
          <div className={cn("gap-3", view === "grid" ? "grid grid-cols-2" : "flex flex-col")}>
            {filtered.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                view={view}
                onEdit={handleEdit}
                onDelete={deleteHabit}
                onRecap={setRecapHabit}
                onNotes={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryManager
        open={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        title="Habit Categories"
        categories={settings.habitCategories}
        onAdd={addHabitCategory}
        onRename={renameHabitCategory}
        onDelete={deleteHabitCategory}
      />
      <HabitForm open={showForm} onClose={() => setShowForm(false)} onSubmit={addHabit} mode="add" />
      <HabitForm
        open={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSubmit={handleUpdate}
        initialValues={editingHabit || undefined}
        mode="edit"
      />
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
