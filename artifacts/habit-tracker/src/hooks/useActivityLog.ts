import { useState, useEffect, useCallback } from "react";
import { syncActivity, deleteActivity } from "@/lib/sync";

export interface ActivityEntry {
  id: string;
  date: string;
  type: string;
  durationMin?: number;
  distanceKm?: number;
  elevationGain?: number;
  runType?: "Trail" | "Road";
  notes?: string;
  createdAt: string;
}

const ACTIVITY_LOG_KEY = "dedi_activity_log";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function useActivityLog() {
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => load(ACTIVITY_LOG_KEY, []));

  useEffect(() => {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(activityLog));
  }, [activityLog]);

  const addActivityEntry = useCallback((entry: Omit<ActivityEntry, "id" | "createdAt">) => {
    const newEntry: ActivityEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setActivityLog((prev) => [newEntry, ...prev]);
    syncActivity(newEntry);
    return newEntry;
  }, []);

  const deleteActivityEntry = useCallback((id: string) => {
    setActivityLog((prev) => prev.filter((e) => e.id !== id));
    deleteActivity(id);
  }, []);

  return { activityLog, addActivityEntry, deleteActivityEntry };
}
