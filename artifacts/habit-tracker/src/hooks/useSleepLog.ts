import { useState, useEffect } from "react";
import { syncSleep, deleteSleep } from "@/lib/sync";

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

  useEffect(() => { localStorage.setItem(LS_KEY,        JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem(LS_TARGET_KEY, String(targetHours));     }, [targetHours]);

  function addEntry(entry: Omit<SleepEntry, "id" | "createdAt">) {
    const newEntry: SleepEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date);
      return [newEntry, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
    });
    syncSleep(newEntry);
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    deleteSleep(id);
  }

  function updateEntry(id: string, updates: Partial<Omit<SleepEntry, "id" | "createdAt">>) {
    setEntries((prev) => {
      const updated = prev.map((e) => e.id === id ? { ...e, ...updates } : e);
      const found = updated.find((e) => e.id === id);
      if (found) syncSleep(found);
      return updated;
    });
  }

  function setTargetHours(h: number) {
    setTargetHoursState(h);
  }

  return { entries, targetHours, addEntry, deleteEntry, updateEntry, setTargetHours };
}
