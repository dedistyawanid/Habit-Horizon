import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { TrendingUp, Award, Target, Flame, BarChart2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  Health: "#10b981",
  Work: "#3b82f6",
  Skill: "#8b5cf6",
  Finance: "#f59e0b",
  Social: "#ec4899",
  Personal: "#06b6d4",
  Other: "#6b7280",
};

function getLast30Days() {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getLast12Months() {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en", { month: "short", year: "2-digit" }),
    });
  }
  return months;
}

export default function InsightsPage() {
  const { habitsWithStats, checkIns, habits } = useApp();
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"30d" | "12m">("30d");

  const days30 = useMemo(() => getLast30Days(), []);
  const months12 = useMemo(() => getLast12Months(), []);

  const overallTrendData = useMemo(() => {
    if (chartRange === "30d") {
      return days30.map((date) => {
        const habitsDue = habits.filter((h) => {
          const created = h.createdAt.split("T")[0];
          return created <= date;
        });
        if (habitsDue.length === 0) return { label: date.slice(5), completion: 0 };
        const checked = habitsDue.filter((h) =>
          checkIns.some((c) => c.habitId === h.id && c.date === date)
        ).length;
        return {
          label: date.slice(5),
          completion: Math.round((checked / habitsDue.length) * 100),
        };
      });
    } else {
      return months12.map(({ key, label }) => {
        const [yr, mo] = key.split("-").map(Number);
        const habitsDue = habits.filter((h) => {
          const cd = new Date(h.createdAt);
          return cd.getFullYear() < yr || (cd.getFullYear() === yr && cd.getMonth() + 1 <= mo);
        });
        if (habitsDue.length === 0) return { label, completion: 0 };
        const daysInMonth = new Date(yr, mo, 0).getDate();
        const totalExpected = habitsDue.length * daysInMonth;
        const totalDone = checkIns.filter((c) => {
          const d = new Date(c.date);
          return d.getFullYear() === yr && d.getMonth() + 1 === mo;
        }).length;
        return { label, completion: Math.min(100, Math.round((totalDone / totalExpected) * 100)) };
      });
    }
  }, [chartRange, days30, months12, habits, checkIns]);

  const selectedHabitTrend = useMemo(() => {
    if (!selectedHabit) return [];
    return days30.map((date) => {
      const done = checkIns.some((c) => c.habitId === selectedHabit && c.date === date);
      return { label: date.slice(5), done: done ? 1 : 0 };
    });
  }, [selectedHabit, days30, checkIns]);

  const categoryData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const h of habitsWithStats) {
      if (!map[h.category]) map[h.category] = { total: 0, count: 0 };
      map[h.category].total += h.completionPercentage;
      map[h.category].count += 1;
    }
    return Object.entries(map).map(([cat, { total, count }]) => ({
      category: cat,
      avg: Math.round(total / count),
      color: CATEGORY_COLORS[cat] || "#6b7280",
    }));
  }, [habitsWithStats]);

  const categoryPieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const h of habits) {
      map[h.category] = (map[h.category] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || "#6b7280" }));
  }, [habits]);

  const totalCheckIns = checkIns.length;
  const avgCompletion =
    habitsWithStats.length > 0
      ? Math.round(habitsWithStats.reduce((s, h) => s + h.completionPercentage, 0) / habitsWithStats.length)
      : 0;
  const topStreak = habitsWithStats.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const best = habitsWithStats.reduce<(typeof habitsWithStats)[0] | null>(
    (b, h) => (!b || h.completionPercentage > b.completionPercentage ? h : b),
    null
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Insights & Recap</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deep dive into your habit performance</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, label: "Total Check-ins", value: totalCheckIns, color: "text-emerald-500" },
          { icon: TrendingUp, label: "Avg Completion", value: `${avgCompletion}%`, color: "text-blue-500" },
          { icon: Flame, label: "Best Streak", value: `${topStreak} days`, color: "text-orange-500" },
          { icon: Award, label: "Habits Tracked", value: habits.length, color: "text-violet-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <Icon className={cn("w-5 h-5 mb-2", color)} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Overall completion trend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Overall Completion Rate</h2>
          </div>
          <div className="flex gap-1">
            {(["30d", "12m"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                  chartRange === r
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {r === "30d" ? "30 Days" : "12 Months"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={overallTrendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={chartRange === "30d" ? 4 : 0} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => [`${v}%`, "Completion"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Category Performance</h2>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No habits yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="opacity-30" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v) => [`${v}%`, "Avg Completion"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Habits by Category</h2>
          {categoryPieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No habits yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoryPieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Individual habit trend */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Individual Habit (Last 30 Days)</h2>
          </div>
          <select
            value={selectedHabit ?? ""}
            onChange={(e) => setSelectedHabit(e.target.value || null)}
            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="">Select a habit...</option>
            {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        {selectedHabit ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={selectedHabitTrend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} />
              <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? "✓" : "")} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v) => [v === 1 ? "Completed" : "Missed", ""]}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="done" radius={[3, 3, 0, 0]} fill="hsl(var(--primary))" opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">Select a habit above to see its daily check-in pattern</p>
        )}
      </div>

      {/* Top performers */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Habit Leaderboard (This Month)</h2>
        {habitsWithStats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No habits tracked yet</p>
        ) : (
          <div className="space-y-3">
            {[...habitsWithStats]
              .sort((a, b) => b.completionPercentage - a.completionPercentage)
              .slice(0, 8)
              .map((h, i) => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    i === 0 ? "bg-yellow-100 text-yellow-700" :
                    i === 1 ? "bg-gray-100 text-gray-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-slate-50 text-gray-400 dark:bg-gray-800"
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{h.name}</span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-2">{h.completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${h.completionPercentage}%`,
                          background: CATEGORY_COLORS[h.category] || "hsl(var(--primary))",
                        }}
                      />
                    </div>
                  </div>
                  {h.currentStreak >= 7 && (
                    <span className="shrink-0 text-xs">🔥 {h.currentStreak}</span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
