import { useState, useEffect } from "react";

export interface SleepEntry {
  id: string;
  date: string;
  hours: number;
  minutes: number;
  quality: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

const LS_KEY         = "dedi_sleep_log";
const LS_TARGET_KEY  = "dedi_sleep_target_hours";
const DEFAULT_TARGET = 8;

export function useSleepLog() {
  const [entries, setEntries] = useState<SleepEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
  });

  const [targetHours, setTargetHoursState] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem(LS_TARGET_KEY));
      return v > 0 ? v : DEFAULT_TARGET;
    } catch { return DEFAULT_TARGET; }
  });

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem(LS_TARGET_KEY, String(targetHours)); }, [targetHours]);

  function addEntry(entry: Omit<SleepEntry, "id" | "createdAt">) {
    const newEntry: SleepEntry = {
      ...entry,
      id: `slp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date);
      return [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function setTargetHours(h: number) {
    setTargetHoursState(h);
  }

  return { entries, targetHours, addEntry, deleteEntry, setTargetHours };
}
