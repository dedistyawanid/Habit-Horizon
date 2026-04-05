import { useState, useRef, useEffect } from "react";
import { CheckCircle2, Circle, MoreVertical, StickyNote, CalendarDays, Pencil, Trash2, Trophy } from "lucide-react";
import { HabitWithStats } from "@/types/habit";
import { useApp } from "@/context/AppContext";
import { getTodayKey } from "@/lib/dateUtils";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: HabitWithStats;
  view: "grid" | "list";
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (id: string) => void;
  onRecap: (habit: HabitWithStats) => void;
  onNotes: (habit: HabitWithStats) => void;
}

function getMilestone(streak: number, blockSize: number): string | null {
  if (streak > 0 && streak % (blockSize * 4) === 0) return `${streak / blockSize} Streak Blocks!`;
  if (streak > 0 && streak % blockSize === 0) return `🔥 ${streak / blockSize} Block${streak / blockSize > 1 ? "s" : ""}!`;
  return null;
}

export function HabitCard({ habit, view, onEdit, onDelete, onRecap, onNotes }: HabitCardProps) {
  const { isCheckedInToday, toggleCheckIn } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const checkedToday = isCheckedInToday(habit.id);
  const catColor = habit.color || "#879A77";
  const blockSize = habit.weeklyStreakTarget ?? 7;

  const targetFraction = habit.monthlyTarget
    ? `${habit.completionThisMonth}/${habit.monthlyTarget}`
    : null;

  const streakBlockDisplay = habit.streakBlocks > 0
    ? `🔥 ${habit.streakBlocks}`
    : habit.currentStreak > 0
    ? `🔥 ${habit.currentStreak}d`
    : null;

  function handleCheckIn() {
    if (checkedToday) {
      toggleCheckIn(habit.id);
    } else {
      toggleCheckIn(habit.id);
      const nextStreak = habit.currentStreak + 1;
      const m = getMilestone(nextStreak, blockSize);
      if (m) {
        setMilestone(m);
        setShowConfetti(true);
      }
    }
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(habit.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
    setMenuOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const MenuDropdown = () => (
    <div
      ref={menuRef}
      className={cn(
        "absolute right-0 top-full mt-1 z-30 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 min-w-[140px]",
        view === "list" ? "right-0" : "right-0"
      )}
    >
      {[
        { icon: StickyNote, label: "Notes", action: () => { onNotes(habit); setMenuOpen(false); }, className: "text-gray-700 dark:text-gray-300" },
        { icon: CalendarDays, label: "History", action: () => { onRecap(habit); setMenuOpen(false); }, className: "text-gray-700 dark:text-gray-300" },
        { icon: Pencil, label: "Edit", action: () => { onEdit(habit); setMenuOpen(false); }, className: "text-gray-700 dark:text-gray-300" },
        { icon: Trash2, label: confirmDelete ? "Confirm?" : "Delete", action: handleDeleteClick, className: confirmDelete ? "text-red-500" : "text-gray-700 dark:text-gray-300" },
      ].map(({ icon: Icon, label, action, className }) => (
        <button
          key={label}
          onClick={action}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
            className
          )}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );

  if (view === "list") {
    return (
      <>
        <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
        {showConfetti && milestone && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm shadow-2xl animate-bounce flex items-center gap-2">
            <Trophy className="w-4 h-4" /> {milestone}
          </div>
        )}
        <div
          data-testid={`habit-card-${habit.id}`}
          className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3 transition-all duration-200"
          style={{ borderRadius: 20, boxShadow: "0 2px 14px rgba(0,0,0,0.06)" }}
        >
          <button
            data-testid={`checkin-btn-${habit.id}`}
            onClick={handleCheckIn}
            className="flex-shrink-0 transition-transform duration-150 hover:scale-110 active:scale-90"
          >
            {checkedToday
              ? <CheckCircle2 className="w-6 h-6 text-primary" />
              : <Circle className="w-6 h-6 text-gray-200 dark:text-gray-700" />
            }
          </button>

          <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: catColor }} />

          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium text-gray-800 dark:text-gray-200 truncate", checkedToday && "line-through text-gray-400")}>
              {habit.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${habit.completionPercentage}%`, backgroundColor: catColor }}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {targetFraction && (
                  <span className="text-xs text-gray-400 font-medium">🎯 {targetFraction}</span>
                )}
                {streakBlockDisplay && (
                  <span className="text-xs text-orange-500 font-medium">{streakBlockDisplay}</span>
                )}
              </div>
            </div>
          </div>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && <MenuDropdown />}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {showConfetti && milestone && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-bold text-sm shadow-2xl animate-bounce flex items-center gap-2">
          <Trophy className="w-4 h-4" /> {milestone}
        </div>
      )}
      <div
        data-testid={`habit-card-${habit.id}`}
        className="bg-white dark:bg-gray-900 p-4 transition-all duration-200"
        style={{ borderRadius: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: catColor }} />
            <p className={cn("text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug truncate", checkedToday && "line-through text-gray-400")}>
              {habit.name}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              data-testid={`checkin-btn-${habit.id}`}
              onClick={handleCheckIn}
              className="transition-transform duration-150 hover:scale-110 active:scale-90"
            >
              {checkedToday
                ? <CheckCircle2 className="w-7 h-7 text-primary" />
                : <Circle className="w-7 h-7 text-gray-200 dark:text-gray-700" />
              }
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && <MenuDropdown />}
            </div>
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${habit.completionPercentage}%`, backgroundColor: catColor }}
          />
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{habit.category}</span>
          <div className="flex items-center gap-2">
            {targetFraction && (
              <span className="text-xs text-gray-500 font-medium">🎯 {targetFraction}</span>
            )}
            {streakBlockDisplay && (
              <span className="text-xs text-orange-500 font-semibold">{streakBlockDisplay}</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
