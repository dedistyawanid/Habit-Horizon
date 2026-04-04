import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HabitWithStats } from "@/types/habit";
import { useHabits } from "@/hooks/useHabits";
import { getDayGrid, getMonthName } from "@/lib/dateUtils";
import { getCategoryColor } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MonthlyRecapProps {
  habit: HabitWithStats;
}

export function MonthlyRecap({ habit }: MonthlyRecapProps) {
  const { getMonthCheckIns } = useHabits();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const grid = getDayGrid(year, month);
  const checkIns = getMonthCheckIns(habit.id, year, month);
  const checkedDates = new Set(checkIns.map((c) => c.date));
  const catColor = getCategoryColor(habit.category);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const completedDays = checkIns.length;
  const pct = Math.round((completedDays / daysInMonth) * 100);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    const today = new Date();
    if (year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth())) {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {getMonthName(month)} {year}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
          <div key={day} className="text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
        {grid.map((cell) => {
          const isChecked = checkedDates.has(cell.date);
          const isToday = cell.date === today;
          return (
            <div
              key={cell.date}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                !cell.inMonth && "opacity-20",
                isChecked && cell.inMonth && "text-white font-bold",
                !isChecked && cell.inMonth && "text-gray-500 dark:text-gray-400",
                isToday && !isChecked && "ring-2 ring-offset-1",
              )}
              style={{
                backgroundColor: isChecked ? catColor : undefined,
                ringColor: isToday && !isChecked ? catColor : undefined,
              }}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Penyelesaian bulan ini</span>
          <span className="text-xs font-bold" style={{ color: catColor }}>
            {completedDays}/{daysInMonth} hari ({pct}%)
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
    </div>
  );
}
