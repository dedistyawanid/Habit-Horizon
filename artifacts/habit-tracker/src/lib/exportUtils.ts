import { Habit, CheckIn } from "@/types/habit";
import { QuickNote } from "@/types/notes";
import { AppSettings } from "@/types/settings";
import { Transaction, FinanceSettings } from "@/types/finance";
import { WishlistItem } from "@/types/wishlist";
import { WeightEntry } from "@/hooks/useWeightLog";
import { ActivityEntry } from "@/hooks/useActivityLog";
import { NutritionEntry } from "@/hooks/useNutritionLog";
import { SleepEntry } from "@/hooks/useSleepLog";

export function exportAsJSON(
  habits: Habit[],
  checkIns: CheckIn[],
  notes: QuickNote[],
  settings: AppSettings,
  transactions: Transaction[],
  financeSettings: FinanceSettings,
  weightLog: WeightEntry[],
  activityLog: ActivityEntry[],
  nutritionLog: NutritionEntry[],
  sleepLog: SleepEntry[],
  wishlist: WishlistItem[],
) {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "4.0",
    habits,
    checkIns,
    notes,
    settings,
    transactions,
    financeSettings,
    weightLog,
    activityLog,
    nutritionLog,
    sleepLog,
    wishlist,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `horizon-hub-backup-${getTodayKey()}.json`);
}

export function exportAsCSV(
  habits: Habit[],
  checkIns: CheckIn[],
  transactions: Transaction[],
  notes: QuickNote[],
  weightLog: WeightEntry[],
  activityLog: ActivityEntry[],
  nutritionLog: NutritionEntry[],
  sleepLog: SleepEntry[],
  wishlist: WishlistItem[],
) {
  const q = (s: string | undefined | null) =>
    `"${(s ?? "").replace(/"/g, '""')}"`;

  const sections: string[] = [];

  // --- Habits & Check-ins ---
  {
    const rows = ["HABITS & CHECK-INS", "habit_id,habit_name,category,frequency,date,notes,completed_at"];
    for (const c of checkIns) {
      const habit = habits.find((h) => h.id === c.habitId);
      if (!habit) continue;
      rows.push([c.habitId, q(habit.name), habit.category, habit.frequency, c.date, q(c.notes), c.completedAt].join(","));
    }
    sections.push(rows.join("\n"));
  }

  // --- Finance Transactions ---
  if (transactions.length > 0) {
    const rows = ["FINANCE TRANSACTIONS", "id,title,type,amount,category,account_source,date,notes,created_at"];
    for (const t of transactions) {
      rows.push([t.id, q(t.title), t.type, t.amount, q(t.category), q(t.accountSource), t.date, q(t.notes), t.createdAt].join(","));
    }
    sections.push(rows.join("\n"));
  }

  // --- Weight Log ---
  if (weightLog.length > 0) {
    const rows = ["WEIGHT LOG", "id,date,weight_kg,notes"];
    for (const w of weightLog) {
      rows.push([w.id, w.date, w.weight, q(w.notes)].join(","));
    }
    sections.push(rows.join("\n"));
  }

  // --- Activity Log ---
  if (activityLog.length > 0) {
    const rows = ["ACTIVITY LOG", "id,date,type,duration_min,distance_km,elevation_gain_m,run_type,location"];
    for (const a of activityLog) {
      rows.push([a.id, a.date, q(a.type), a.durationMin ?? "", a.distanceKm ?? "", a.elevationGain ?? "", a.runType ?? "", q(a.location)].join(","));
    }
    sections.push(rows.join("\n"));
  }

  // --- Nutrition Log ---
  if (nutritionLog.length > 0) {
    const rows = ["NUTRITION LOG", "id,date,name,calories,protein_g,carbs_g,created_at"];
    for (const n of nutritionLog) {
      rows.push([n.id, n.date, q(n.name), n.calories, n.protein, n.carbs, n.createdAt].join(","));
    }
    sections.push(rows.join("\n"));
  }

  // --- Sleep Log ---
  if (sleepLog.length > 0) {
    const rows = ["SLEEP LOG", "id,date,hours,minutes,quality_1_to_5,created_at"];
    for (const s of sleepLog) {
      rows.push([s.id, s.date, s.hours, s.minutes, s.quality, s.createdAt].join(","));
    }
    sections.push(rows.join("\n"));
  }

  // --- Notes ---
  if (notes.length > 0) {
    const rows = ["NOTES", "id,title,category,content,url,pinned,reminder_date,created_at,updated_at"];
    for (const n of notes) {
      rows.push([n.id, q(n.title), n.category, q(n.content), q(n.url), n.pinned ? "true" : "false", n.reminderDate ?? "", n.createdAt, n.updatedAt].join(","));
    }
    sections.push(rows.join("\n"));
  }

  // --- Wishlist ---
  if (wishlist.length > 0) {
    const rows = ["WISHLIST", "id,title,target_amount,current_amount,created_at"];
    for (const w of wishlist) {
      rows.push([w.id, q(w.title), w.targetAmount, w.currentAmount, w.createdAt].join(","));
    }
    sections.push(rows.join("\n"));
  }

  const csv = sections.join("\n\n");
  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, `horizon-hub-export-${getTodayKey()}.csv`);
}

export type ImportResult = {
  success: boolean;
  message: string;
  data?: {
    habits?: Habit[];
    checkIns?: CheckIn[];
    notes?: QuickNote[];
    settings?: AppSettings;
    transactions?: Transaction[];
    financeSettings?: FinanceSettings;
    weightLog?: WeightEntry[];
    activityLog?: ActivityEntry[];
    nutritionLog?: NutritionEntry[];
    sleepLog?: SleepEntry[];
    wishlist?: WishlistItem[];
  };
};

export function parseImportFile(json: string): ImportResult {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, message: "Invalid file format." };
    }
    return {
      success: true,
      message: "Import successful.",
      data: {
        habits:          Array.isArray(parsed.habits)        ? parsed.habits        : undefined,
        checkIns:        Array.isArray(parsed.checkIns)      ? parsed.checkIns      : undefined,
        notes:           Array.isArray(parsed.notes)         ? parsed.notes         : undefined,
        settings:        parsed.settings                                            || undefined,
        transactions:    Array.isArray(parsed.transactions)  ? parsed.transactions  : undefined,
        financeSettings: parsed.financeSettings                                     || undefined,
        weightLog:       Array.isArray(parsed.weightLog)     ? parsed.weightLog     : undefined,
        activityLog:     Array.isArray(parsed.activityLog)   ? parsed.activityLog   : undefined,
        nutritionLog:    Array.isArray(parsed.nutritionLog)  ? parsed.nutritionLog  : undefined,
        sleepLog:        Array.isArray(parsed.sleepLog)      ? parsed.sleepLog      : undefined,
        wishlist:        Array.isArray(parsed.wishlist)      ? parsed.wishlist       : undefined,
      },
    };
  } catch {
    return { success: false, message: "Failed to parse file. Please use a valid JSON backup." };
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}
