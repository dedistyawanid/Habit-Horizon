import { useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Target, TrendingUp, Calendar } from "lucide-react";
import { HabitWithStats } from "@/types/habit";
import { useApp } from "@/context/AppContext";
import { getDayGrid, getMonthName, getDaysInMonth } from "@/lib/dateUtils";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";

interface MonthlyRecapProps {
  habit: HabitWithStats;
}

function buildWeeklyData(
  year: number,
  month: number,
  checkedDates: Set<string>
) {
  const days = getDaysInMonth(year, month);
  const weeks: { week: string; done: number; total: number }[] = [];

  let w = 1;
  for (let start = 1; start <= days; start += 7) {
    const end = Math.min(start + 6, days);
    let done = 0;
    let total = 0;
    for (let d = start; d <= end; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      total++;
      if (checkedDates.has(key)) done++;
    }
    weeks.push({ week: `W${w}`, done, total });
    w++;
  }
  return weeks;
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-[11px] text-gray-500 leading-none">{label}</span>
      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{value}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-primary">{payload[0].value} day{payload[0].value !== 1 ? "s" : ""} done</p>
      </div>
    );
  }
  return null;
};

export function MonthlyRecap({ habit }: MonthlyRecapProps) {
  const { getMonthCheckIns } = useApp();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<"calendar" | "chart">("calendar");

  const grid = getDayGrid(year, month);
  const checkIns = getMonthCheckIns(habit.id, year, month);
  const checkedDates = new Set(checkIns.map((c) => c.date));
  const catColor = habit.color || "#879A77";

  const daysInMonth = getDaysInMonth(year, month);
  const completedDays = checkIns.length;
  const pct = daysInMonth > 0 ? Math.round((completedDays / daysInMonth) * 100) : 0;

  const weeklyData = buildWeeklyData(year, month, checkedDates);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const td = new Date();
    if (year < td.getFullYear() || (year === td.getFullYear() && month < td.getMonth())) {
      if (month === 11) { setMonth(0); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    }
  }

  const today = now.toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex gap-2">
        <StatPill icon={Flame} label="Streak" value={`${habit.currentStreak}d`} color={catColor} />
        <StatPill icon={TrendingUp} label="Best" value={`${habit.longestStreak}d`} color="#60a5fa" />
        <StatPill icon={Target} label="This Month" value={`${pct}%`} color="#a78bfa" />
        <StatPill icon={Calendar} label="Done" value={`${completedDays}d`} color="#34d399" />
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 text-xs font-medium">
        {(["calendar", "chart"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-1.5 rounded-[10px] capitalize transition-all",
              tab === t
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            {t === "calendar" ? "Calendar" : "Bar Chart"}
          </button>
        ))}
      </div>

      {/* Month nav */}
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

      {tab === "calendar" ? (
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-xs font-medium text-gray-400 py-1">{day}</div>
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
                  isToday && !isChecked && "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-gray-900"
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
      ) : (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barSize={24} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="done" radius={[6, 6, 0, 0]}>
                {weeklyData.map((_, i) => (
                  <Cell key={i} fill={catColor} fillOpacity={0.85 - i * 0.05} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Completion bar */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Completion this month</span>
          <span className="text-xs font-bold" style={{ color: catColor }}>
            {completedDays}/{daysInMonth} days ({pct}%)
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
    </div>
  );
}
