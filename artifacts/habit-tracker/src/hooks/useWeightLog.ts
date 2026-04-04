import { useState, useEffect, useCallback } from "react";

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  notes?: string;
}

const WEIGHT_LOG_KEY = "dedi_weight_log";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function useWeightLog() {
  const [weightLog, setWeightLog] = useState<WeightEntry[]>(() => load(WEIGHT_LOG_KEY, []));

  useEffect(() => {
    localStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(weightLog));
  }, [weightLog]);

  const addWeightEntry = useCallback((weight: number, notes?: string, date?: string) => {
    const entry: WeightEntry = {
      id: crypto.randomUUID(),
      date: date ?? new Date().toISOString().split("T")[0],
      weight,
      notes,
    };
    setWeightLog((prev) => {
      const filtered = prev.filter((e) => e.date !== entry.date);
      return [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
  }, []);

  const deleteWeightEntry = useCallback((id: string) => {
    setWeightLog((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const latestWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weight : null;

  return { weightLog, addWeightEntry, deleteWeightEntry, latestWeight };
}
