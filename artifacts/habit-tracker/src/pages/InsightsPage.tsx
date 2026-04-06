import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { TrendingUp, Award, Flame, BarChart2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  Health: "#556B2F",
  Work: "#B8860B",
  Skill: "#4A4A4A",
  Finance: "#E2725B",
  Social: "#2D3A2D",
  Personal: "#7B8B6F",
  Other: "#9C8B7A",
};

type ChartRange = "3d" | "7d" | "30d" | "12m";

function getDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
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

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: "3d", label: "3 Days" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "12m", label: "12 Months" },
];

export default function InsightsPage() {
  const { habitsWithStats, checkIns, habits } = useApp();
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("30d");

  const months12 = useMemo(() => getLast12Months(), []);

  const daysForRange = useMemo(() => {
    if (chartRange === "3d") return getDays(3);
    if (chartRange === "7d") return getDays(7);
    if (chartRange === "30d") return getDays(30);
    return [];
  }, [chartRange]);

  const overallTrendData = useMemo(() => {
    if (chartRange !== "12m") {
      return daysForRange.map((date) => {
        const habitsDue = habits.filter((h) => h.createdAt.split("T")[0] <= date);
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
          const [cYr, cMo] = c.date.split("T")[0].split("-").map(Number);
          return cYr === yr && cMo === mo;
        }).length;
        return { label, completion: Math.min(100, Math.round((totalDone / totalExpected) * 100)) };
      });
    }
  }, [chartRange, daysForRange, months12, habits, checkIns]);

  const days30 = useMemo(() => getDays(30), []);
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
    for (const h of habits) map[h.category] = (map[h.category] || 0) + 1;
    return Object.entries(map).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || "#6b7280" }));
  }, [habits]);

  const totalCheckIns = checkIns.length;
  const avgCompletion = habitsWithStats.length > 0
    ? Math.round(habitsWithStats.reduce((s, h) => s + h.completionPercentage, 0) / habitsWithStats.length)
    : 0;
  const topStreak = habitsWithStats.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Insights</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Deep dive into your habit performance</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: CheckCircle2, label: "Check-ins", value: totalCheckIns, color: "text-emerald-500" },
            { icon: TrendingUp, label: "Avg Rate", value: `${avgCompletion}%`, color: "text-blue-500" },
            { icon: Flame, label: "Best Streak", value: `${topStreak}d`, color: "text-orange-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white dark:bg-card rounded-[28px] p-4 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
              <Icon className={cn("w-4 h-4 mb-1.5", color)} />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Overall completion trend */}
        <div className="bg-white dark:bg-card rounded-[28px] p-5 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Completion Rate</h2>
            </div>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setChartRange(value)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-xs font-medium transition-all",
                    chartRange === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={overallTrendData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={chartRange === "30d" ? 4 : 0} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v) => [`${v}%`, "Completion"]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-card rounded-[28px] p-5 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
            <h2 className="text-sm font-semibold text-foreground mb-4">Category Performance</h2>
            {categoryData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No habits yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="opacity-30" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={50} />
                  <Tooltip formatter={(v) => [`${v}%`, "Avg"]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-card rounded-[28px] p-5 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
            <h2 className="text-sm font-semibold text-foreground mb-4">Habits by Category</h2>
            {categoryPieData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No habits yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {categoryPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Individual habit trend */}
        <div className="bg-white dark:bg-card rounded-[28px] p-5 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Individual Habit (Last 30 Days)</h2>
            <select
              value={selectedHabit ?? ""}
              onChange={(e) => setSelectedHabit(e.target.value || null)}
              className="text-xs border border-[hsl(var(--border))] rounded-lg px-2 py-1 bg-card text-foreground focus:outline-none"
            >
              <option value="">Select a habit...</option>
              {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          {selectedHabit ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={selectedHabitTrend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={4} />
                <YAxis domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => (v === 1 ? "✓" : "")} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v === 1 ? "Completed" : "Missed", ""]} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="done" radius={[3, 3, 0, 0]} fill="hsl(var(--primary))" opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Select a habit to see its check-in pattern</p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-card rounded-[28px] p-5 border border-[#E5E0D8] dark:border-[hsl(var(--border))]">
          <h2 className="text-sm font-semibold text-foreground mb-4">Leaderboard (This Month)</h2>
          {habitsWithStats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No habits tracked yet</p>
          ) : (
            <div className="space-y-3">
              {[...habitsWithStats]
                .sort((a, b) => b.completionPercentage - a.completionPercentage)
                .slice(0, 8)
                .map((h, i) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0 ? "bg-yellow-100 text-yellow-700" :
                      i === 1 ? "bg-accent text-muted-foreground" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-accent text-muted-foreground"
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate">{h.name}</span>
                        <span className="text-xs font-semibold text-muted-foreground ml-2">{h.completionPercentage}%</span>
                      </div>
                      <div className="h-1 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${h.completionPercentage}%`,
                            background: CATEGORY_COLORS[h.category] || "hsl(var(--primary))",
                          }}
                        />
                      </div>
                    </div>
                    {h.streakBlocks > 0 && (
                      <span className="shrink-0 text-xs">🔥 {h.streakBlocks}</span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
