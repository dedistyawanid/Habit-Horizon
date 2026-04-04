import { Habit, CheckIn } from "@/types/habit";
import { QuickNote } from "@/types/notes";
import { AppSettings } from "@/types/settings";

export function exportAsJSON(
  habits: Habit[],
  checkIns: CheckIn[],
  notes: QuickNote[],
  settings: AppSettings
) {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "2.0",
    habits,
    checkIns,
    notes,
    settings,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `habit-tracker-backup-${getTodayKey()}.json`);
}

export function exportAsCSV(habits: Habit[], checkIns: CheckIn[]) {
  const rows: string[] = [
    "habit_id,habit_name,category,frequency,date,notes,completed_at",
  ];

  for (const c of checkIns) {
    const habit = habits.find((h) => h.id === c.habitId);
    if (!habit) continue;
    const row = [
      c.habitId,
      `"${habit.name}"`,
      habit.category,
      habit.frequency,
      c.date,
      `"${(c.notes || "").replace(/"/g, '""')}"`,
      c.completedAt,
    ].join(",");
    rows.push(row);
  }

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, `habit-tracker-${getTodayKey()}.csv`);
}

export type ImportResult = {
  success: boolean;
  message: string;
  data?: {
    habits?: Habit[];
    checkIns?: CheckIn[];
    notes?: QuickNote[];
    settings?: AppSettings;
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
        habits: Array.isArray(parsed.habits) ? parsed.habits : undefined,
        checkIns: Array.isArray(parsed.checkIns) ? parsed.checkIns : undefined,
        notes: Array.isArray(parsed.notes) ? parsed.notes : undefined,
        settings: parsed.settings || undefined,
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
