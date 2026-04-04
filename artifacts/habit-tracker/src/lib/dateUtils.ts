import { Habit } from "@/types/habit";

export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getExpectedCheckIns(
  habit: Habit,
  year: number,
  month: number
): number {
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month;
  const daysInMonth = getDaysInMonth(year, month);
  const daysToCount = isCurrentMonth ? now.getDate() : daysInMonth;

  switch (habit.frequency) {
    case "Daily":
      return daysToCount;
    case "Weekly":
      return Math.floor(daysToCount / 7) + (daysToCount % 7 > 0 ? 1 : 0);
    case "Monthly":
      return 1;
    default:
      return daysToCount;
  }
}

export function getDayGrid(
  year: number,
  month: number
): Array<{ date: string; day: number; inMonth: boolean }> {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const grid: Array<{ date: string; day: number; inMonth: boolean }> = [];

  for (let i = 0; i < firstDay; i++) {
    const d = new Date(year, month, 1 - (firstDay - i));
    grid.push({
      date: d.toISOString().split("T")[0],
      day: d.getDate(),
      inMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    grid.push({
      date: date.toISOString().split("T")[0],
      day: d,
      inMonth: true,
    });
  }

  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    grid.push({
      date: d.toISOString().split("T")[0],
      day: d.getDate(),
      inMonth: false,
    });
  }

  return grid;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getMotivationQuote(): string {
  const quotes = [
    "Konsistensi adalah kunci kesuksesan. Satu langkah kecil setiap hari.",
    "Hari ini adalah kesempatan untuk menjadi lebih baik dari kemarin.",
    "Kebiasaan baik adalah investasi terbaik untuk masa depanmu.",
    "Jangan tunggu motivasi datang. Mulailah, dan motivasi akan mengikuti.",
    "Setiap kebiasaan kecil membentuk karakter yang besar.",
    "Progress bukan tentang sempurna, tapi tentang tidak menyerah.",
    "Hari terbaik untuk memulai adalah hari ini.",
    "Kamu lebih kuat dari yang kamu pikir. Terus melangkah!",
    "Disiplin adalah jembatan antara tujuan dan pencapaian.",
    "Setiap hari yang kamu jalani dengan baik adalah kemenangan kecil.",
  ];
  const today = new Date();
  const index = today.getDate() % quotes.length;
  return quotes[index];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export function getMonthName(month: number): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return months[month];
}
