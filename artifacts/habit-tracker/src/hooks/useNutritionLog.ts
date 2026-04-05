import { useState, useEffect } from "react";
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

const LS_KEY      = "dedi_nutrition_log";
const LS_TARGETS  = "dedi_nutrition_targets";

const DEFAULT_TARGETS: NutritionTargets = { calories: 2500, protein: 150, carbs: 300 };

export function useNutritionLog() {
  const [entries, setEntries] = useState<NutritionEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
  });

  const [targets, setTargetsState] = useState<NutritionTargets>(() => {
    try {
      const raw = localStorage.getItem(LS_TARGETS);
      if (!raw) return DEFAULT_TARGETS;
      return { ...DEFAULT_TARGETS, ...JSON.parse(raw) };
    } catch { return DEFAULT_TARGETS; }
  });

  useEffect(() => { localStorage.setItem(LS_KEY,     JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem(LS_TARGETS, JSON.stringify(targets)); }, [targets]);

  function addEntry(entry: Omit<NutritionEntry, "id" | "createdAt">) {
    const newEntry: NutritionEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    syncMeal(newEntry);
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    deleteMeal(id);
  }

  function updateTargets(t: NutritionTargets) {
    setTargetsState(t);
  }

  return { entries, targets, addEntry, deleteEntry, updateTargets };
}
