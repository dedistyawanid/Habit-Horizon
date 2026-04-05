import { useState, useEffect, useCallback } from "react";
import { syncMeal, deleteMeal } from "@/lib/sync";

export interface NutritionEntry {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  createdAt: string;
}

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
}

const LS_KEY     = "dedi_nutrition_log";
const LS_TARGETS = "dedi_nutrition_targets";

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, carbs: 300 };

function readEntries(): NutritionEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function readTargets(): NutritionTargets {
  try {
    const raw = localStorage.getItem(LS_TARGETS);
    if (!raw) return DEFAULT_TARGETS;
    return { ...DEFAULT_TARGETS, ...JSON.parse(raw) };
  } catch { return DEFAULT_TARGETS; }
}

export function useNutritionLog() {
  const [entries,      setEntries]      = useState<NutritionEntry[]>(readEntries);
  const [targets,      setTargetsState] = useState<NutritionTargets>(readTargets);
  /* Track whether the current entries came from an in-memory update (local add/delete)
     vs. a cloud-sync write so we don't clobber localStorage with stale state. */
  const [localDirty, setLocalDirty] = useState(false);

  /* Persist local mutations only — never overwrite on cloud-sync reads */
  useEffect(() => {
    if (localDirty) {
      localStorage.setItem(LS_KEY, JSON.stringify(entries));
      setLocalDirty(false);
    }
  }, [entries, localDirty]);

  useEffect(() => { localStorage.setItem(LS_TARGETS, JSON.stringify(targets)); }, [targets]);

  /* Listen for localStorage changes written by background cloud sync */
  const handleStorage = useCallback((e: StorageEvent) => {
    if (e.key === LS_KEY && e.newValue !== null) {
      try {
        const fresh = JSON.parse(e.newValue) as NutritionEntry[];
        setEntries(fresh);
        /* localDirty stays false — this came from cloud, not local mutation */
      } catch { /* ignore malformed */ }
    }
    if (e.key === LS_TARGETS && e.newValue !== null) {
      try { setTargetsState({ ...DEFAULT_TARGETS, ...JSON.parse(e.newValue) }); }
      catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [handleStorage]);

  function addEntry(entry: Omit<NutritionEntry, "id" | "createdAt">) {
    const newEntry: NutritionEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    setLocalDirty(true);
    syncMeal(newEntry);
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setLocalDirty(true);
    deleteMeal(id);
  }

  function updateTargets(t: NutritionTargets) {
    setTargetsState(t);
  }

  return { entries, targets, addEntry, deleteEntry, updateTargets };
}
