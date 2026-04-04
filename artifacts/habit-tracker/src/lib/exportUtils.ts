import { Habit, CheckIn } from "@/types/habit";

export function exportAsJSON(habits: Habit[], checkIns: CheckIn[]) {
  const data = {
    exportedAt: new Date().toISOString(),
    owner: "Dedi Styawan",
    habits,
    checkIns,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, `habit-tracker-${getTodayKey()}.json`);
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
