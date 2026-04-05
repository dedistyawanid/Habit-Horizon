import { useState, useEffect, useCallback } from "react";
import { Habit, CheckIn, HabitWithStats } from "@/types/habit";
import { getExpectedCheckIns, getTodayKey } from "@/lib/dateUtils";
import {
  syncHabit,
  deleteHabit as dbDeleteHabit,
  syncCheckIn,
  deleteCheckIn as dbDeleteCheckIn,
} from "@/lib/sync";

const HABITS_KEY   = "dedi_habits";
const CHECKINS_KEY = "dedi_checkins";

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadCheckIns(): CheckIn[] {
  try {
    const raw = localStorage.getItem(CHECKINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function computeStats(habit: Habit, checkIns: CheckIn[]): HabitWithStats {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();

  const habitCheckIns = checkIns.filter((c) => c.habitId === habit.id);

  const thisMonthCheckIns = habitCheckIns.filter((c) => {
    const d = new Date(c.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const totalDaysThisMonth    = getExpectedCheckIns(habit, year, month);
  const completionThisMonth   = thisMonthCheckIns.length;
  const completionPercentage  =
    totalDaysThisMonth > 0
      ? Math.min(100, Math.round((completionThisMonth / totalDaysThisMonth) * 100))
      : 0;

  let currentStreak = 0;
  if (habit.frequency === "Daily") {
    const today = new Date();
    for (let i = 0; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().split("T")[0];
      const found = habitCheckIns.some((c) => c.date === key);
      if (found)      currentStreak++;
      else if (i > 0) break;
    }
  } else {
    currentStreak = Math.min(habitCheckIns.length, 12);
  }

  const blockSize   = habit.weeklyStreakTarget ?? 7;
  const streakBlocks = Math.floor(currentStreak / blockSize);

  return {
    ...habit,
    currentStreak,
    streakBlocks,
    completionThisMonth,
    totalCompletions: habitCheckIns.length,
    totalDaysThisMonth,
    completionPercentage,
  };
}

export function useHabits() {
  const [habits,   setHabits]   = useState<Habit[]>(loadHabits);
  const [checkIns, setCheckIns] = useState<CheckIn[]>(loadCheckIns);

  useEffect(() => { localStorage.setItem(HABITS_KEY,   JSON.stringify(habits));   }, [habits]);
  useEffect(() => { localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkIns)); }, [checkIns]);

  const addHabit = useCallback((habit: Omit<Habit, "id" | "createdAt">) => {
    const newHabit: Habit = { ...habit, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setHabits((prev) => [...prev, newHabit]);
    syncHabit(newHabit);
  }, []);

  const updateHabit = useCallback((id: string, updates: Partial<Omit<Habit, "id" | "createdAt">>) => {
    setHabits((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, ...updates } : h));
      const found   = updated.find((h) => h.id === id);
      if (found) syncHabit(found);
      return updated;
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev)   => prev.filter((h) => h.id !== id));
    setCheckIns((prev) => {
      const removed = prev.filter((c) => c.habitId === id);
      removed.forEach((c) => dbDeleteCheckIn(c.id));
      return prev.filter((c) => c.habitId !== id);
    });
    dbDeleteHabit(id);
  }, []);

  const isCheckedInToday = useCallback((habitId: string): boolean => {
    const today = getTodayKey();
    return checkIns.some((c) => c.habitId === habitId && c.date === today);
  }, [checkIns]);

  const getCheckInForDate = useCallback((habitId: string, date: string): CheckIn | undefined => {
    return checkIns.find((c) => c.habitId === habitId && c.date === date);
  }, [checkIns]);

  const toggleCheckIn = useCallback((habitId: string, notes: string = "") => {
    const today    = getTodayKey();
    const existing = checkIns.find((c) => c.habitId === habitId && c.date === today);
    if (existing) {
      setCheckIns((prev) => prev.filter((c) => c.id !== existing.id));
      dbDeleteCheckIn(existing.id);
    } else {
      const newCheckIn: CheckIn = {
        id: crypto.randomUUID(),
        habitId,
        date: today,
        notes,
        completedAt: new Date().toISOString(),
      };
      setCheckIns((prev) => [...prev, newCheckIn]);
      syncCheckIn(newCheckIn);
    }
  }, [checkIns]);

  const updateCheckInNotes = useCallback((checkInId: string, notes: string) => {
    setCheckIns((prev) => {
      const updated = prev.map((c) => (c.id === checkInId ? { ...c, notes } : c));
      const found   = updated.find((c) => c.id === checkInId);
      if (found) syncCheckIn(found);
      return updated;
    });
  }, []);

  const getMonthCheckIns = useCallback((habitId: string, year: number, month: number): CheckIn[] => {
    return checkIns.filter((c) => {
      const d = new Date(c.date);
      return c.habitId === habitId && d.getFullYear() === year && d.getMonth() === month;
    });
  }, [checkIns]);

  const habitsWithStats: HabitWithStats[] = habits.map((h) => computeStats(h, checkIns));

  const topPerforming = habitsWithStats.reduce<HabitWithStats | null>(
    (best, h) => (!best || h.completionPercentage > best.completionPercentage ? h : best),
    null
  );

  const needsAttention = habitsWithStats.reduce<HabitWithStats | null>(
    (worst, h) => (!worst || h.completionPercentage < worst.completionPercentage ? h : worst),
    null
  );

  const exportData = useCallback(() => {
    return { habits, checkIns, exportedAt: new Date().toISOString() };
  }, [habits, checkIns]);

  return {
    habits,
    checkIns,
    habitsWithStats,
    topPerforming,
    needsAttention,
    addHabit,
    updateHabit,
    deleteHabit,
    isCheckedInToday,
    getCheckInForDate,
    toggleCheckIn,
    updateCheckInNotes,
    getMonthCheckIns,
    exportData,
  };
}
