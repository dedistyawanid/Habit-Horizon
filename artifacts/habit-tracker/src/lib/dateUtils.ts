import { Habit } from "@/types/habit";
import { DateFormat } from "@/types/settings";

/** Convert a Date to YYYY-MM-DD using the device's LOCAL timezone.
 *  Never use .toISOString() — it returns UTC which shifts WIB (UTC+7) back a day. */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getTodayKey(): string {
  return toLocalDateStr(new Date());
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
    grid.push({ date: toLocalDateStr(d), day: d.getDate(), inMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    grid.push({ date: toLocalDateStr(date), day: d, inMonth: true });
  }

  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    grid.push({ date: toLocalDateStr(d), day: d.getDate(), inMonth: false });
  }

  return grid;
}

export function formatDateWithFormat(dateStr: string, format: DateFormat): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  switch (format) {
    case "MM/DD/YYYY": return `${mm}/${dd}/${yyyy}`;
    case "YYYY-MM-DD": return `${yyyy}-${mm}-${dd}`;
    default: return `${dd}/${mm}/${yyyy}`;
  }
}

export function getMotivationQuote(): string {
  const quotes = [
    "Consistency is the bridge between goals and accomplishment.",
    "Small habits, compounded daily, create extraordinary results.",
    "Today is another chance to get better than yesterday.",
    "Don't wait for motivation. Start, and motivation will follow.",
    "Every habit you build is an investment in your future self.",
    "Progress is not about perfection. It's about not giving up.",
    "The best day to start was yesterday. The next best is today.",
    "You are stronger than you think. Keep moving forward.",
    "Discipline is the bridge between goals and achievement.",
    "Every good day you create is a small victory worth celebrating.",
    "Showing up consistently beats waiting for the perfect moment.",
    "Your habits today determine your results tomorrow.",
  ];
  const today = new Date();
  const index = today.getDate() % quotes.length;
  return quotes[index];
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 15) return "Good Afternoon";
  if (hour < 18) return "Good Evening";
  return "Good Night";
}

export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[month];
}
