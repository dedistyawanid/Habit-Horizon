import { useState, useMemo } from "react";
import {
  Scale, Dumbbell, Activity, Trash2, Check, Plus, MapPin, Timer,
  Wind, Heart, Zap, TrendingUp, Mountain, Navigation2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PRIMARY_TYPES = [
  { id: "Running",  label: "Running",  icon: Wind,     color: "#10b981" },
  { id: "Badminton",label: "Badminton",icon: Activity,  color: "#3b82f6" },
  { id: "Workout",  label: "Workout",  icon: Dumbbell,  color: "#f59e0b" },
];
const OTHER_TYPE = { id: "Other", label: "Other", icon: Zap, color: "#8b5cf6" };
const ALL_TYPES = [...PRIMARY_TYPES, OTHER_TYPE];

const EXERCISE_KEYWORDS = [
  "exercise", "workout", "sport", "gym", "run", "running",
  "fitness", "badminton", "olahraga", "lari", "training", "activity",
];

function getTypeInfo(type: string) {
  return ALL_TYPES.find((t) => t.id === type) ?? OTHER_TYPE;
}

export default function HealthPage() {
  const {
    weightLog, addWeightEntry, deleteWeightEntry, latestWeight,
    activityLog, addActivityEntry, deleteActivityEntry,
    habitsWithStats, isCheckedInToday, toggleCheckIn,
  } = useApp();
  const { toast } = useToast();

  const [weightInput, setWeightInput] = useState("");
  const [activityType, setActivityType] = useState("Running");
  const [durationMin, setDurationMin]   = useState("");
  const [distanceKm, setDistanceKm]     = useState("");
  const [elevationGain, setElevationGain] = useState("");
  const [runType, setRunType]           = useState<"Trail" | "Road">("Road");
  const todayKey = new Date().toISOString().split("T")[0];

  /* ── Summary stats ── */
  const stats = useMemo(() => {
    const totalActivities = activityLog.length;
    const totalDistance = activityLog.reduce((sum, e) => sum + (e.distanceKm ?? 0), 0);
    const totalMinutes = activityLog.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);
    const longestRun = activityLog
      .filter((e) => e.type === "Running" && e.distanceKm != null)
      .reduce((max, e) => Math.max(max, e.distanceKm!), 0);
    return { totalActivities, totalDistance, totalMinutes, longestRun };
  }, [activityLog]);

  /* ── Donut chart data ── */
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    activityLog.forEach((e) => {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      color: getTypeInfo(type).color,
    }));
  }, [activityLog]);

  /* ── Handlers ── */
  function handleLogWeight() {
    const val = parseFloat(weightInput.trim());
    if (isNaN(val) || val <= 0 || val > 500) {
      toast({ title: "Invalid weight", description: "Enter a weight in kg (e.g. 72.5).", variant: "destructive" });
      return;
    }
    addWeightEntry(val);
    setWeightInput("");
    toast({ title: "Weight logged", description: `${val} kg recorded for today.` });
  }

  function handleLogActivity() {
    const dur = parseFloat(durationMin);
    if (!durationMin || isNaN(dur) || dur <= 0) {
      toast({ title: "Duration required", description: "Enter how many minutes the activity took.", variant: "destructive" });
      return;
    }
    if (activityType === "Running") {
      const dist = parseFloat(distanceKm);
      if (!distanceKm || isNaN(dist) || dist <= 0) {
        toast({ title: "Distance required", description: "Enter the distance in km for running.", variant: "destructive" });
        return;
      }
    }

    addActivityEntry({
      date: todayKey,
      type: activityType,
      durationMin: dur,
      distanceKm:    activityType === "Running" ? parseFloat(distanceKm) : undefined,
      elevationGain: activityType === "Running" && elevationGain ? parseFloat(elevationGain) : undefined,
      runType:       activityType === "Running" ? runType : undefined,
    });

    const exerciseHabits = habitsWithStats.filter((h) =>
      EXERCISE_KEYWORDS.some((kw) => h.name.toLowerCase().includes(kw))
    );
    let autoChecked = 0;
    exerciseHabits.forEach((h) => {
      if (!isCheckedInToday(h.id)) { toggleCheckIn(h.id); autoChecked++; }
    });

    setDurationMin(""); setDistanceKm(""); setElevationGain("");
    toast({
      title: "Activity logged!",
      description: autoChecked > 0
        ? `${activityType} saved. ${autoChecked} exercise habit${autoChecked > 1 ? "s" : ""} auto-checked ✓`
        : `${activityType} logged successfully.`,
    });
  }

  const weightChartData = [...weightLog].slice(-7);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-4">

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Health</h1>
            <p className="text-xs text-gray-400 mt-1">Track weight & activity</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* ─── ACTIVITY INSIGHTS ─── */}
        {activityLog.length > 0 && (
          <div className="space-y-3">
            {/* 4 stat mini-cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <StatCard
                icon={TrendingUp}
                label="Total Activities"
                value={stats.totalActivities.toString()}
                unit="sessions"
                color="#10b981"
              />
              <StatCard
                icon={MapPin}
                label="Total Distance"
                value={stats.totalDistance.toFixed(1)}
                unit="km running"
                color="#3b82f6"
              />
              <StatCard
                icon={Timer}
                label="Active Time"
                value={stats.totalMinutes >= 60 ? `${(stats.totalMinutes / 60).toFixed(1)}` : `${stats.totalMinutes}`}
                unit={stats.totalMinutes >= 60 ? "hours total" : "minutes total"}
                color="#f59e0b"
              />
              <StatCard
                icon={Navigation2}
                label="Longest Run"
                value={stats.longestRun > 0 ? stats.longestRun.toFixed(1) : "—"}
                unit={stats.longestRun > 0 ? "km personal best" : "no runs yet"}
                color="#8b5cf6"
              />
            </div>

            {/* Donut — Activity Split */}
            <div className="bg-white dark:bg-card p-4 flex items-center gap-5" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              {/* Donut */}
              <div className="relative shrink-0 w-[88px] h-[88px]">
                <PieChart width={88} height={88}>
                  <Pie
                    data={donutData}
                    dataKey="count"
                    cx={40}
                    cy={40}
                    innerRadius={28}
                    outerRadius={40}
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-black text-gray-800 dark:text-gray-100">{activityLog.length}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">Activity Split</p>
                {donutData.map((d) => {
                  const pct = Math.round((d.count / activityLog.length) * 100);
                  return (
                    <div key={d.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{d.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── WEIGHT HUB ─── */}
        <div className="bg-white dark:bg-card p-4 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Weight Log</p>
            </div>
            {latestWeight !== null && (
              <span className="text-sm font-bold text-primary">{latestWeight} kg</span>
            )}
          </div>

          {weightChartData.length >= 2 && (
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; }}
                    tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                  />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, padding: "6px 10px", borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
                    formatter={(v: number) => [`${v} kg`, "Weight"]}
                    labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <Area
                    type="monotone" dataKey="weight"
                    stroke="var(--color-primary)" strokeWidth={1.5}
                    fill="url(#hwGrad)" dot={false}
                    activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="number" placeholder="Enter weight (kg)"
              value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogWeight(); }}
              className="text-sm flex-1" step="0.1" min="0"
            />
            <Button onClick={handleLogWeight} size="sm" className="shrink-0">
              <Check className="w-3.5 h-3.5 mr-1" /> Log
            </Button>
          </div>

          {weightLog.length > 0 && (
            <div className="space-y-1">
              {[...weightLog].reverse().slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl group">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{entry.weight} kg</span>
                    {entry.notes && <span className="text-xs text-gray-400 truncate max-w-[100px]">{entry.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <button onClick={() => deleteWeightEntry(entry.id)} className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {weightLog.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-1">No entries yet. Log your first weight above.</p>
          )}
        </div>

        {/* ─── LOG ACTIVITY ─── */}
        <div className="bg-white dark:bg-card p-4 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Log Activity</p>
          </div>

          {/* 3 primary type buttons */}
          <div className="flex gap-2">
            {PRIMARY_TYPES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActivityType(id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border-2",
                  activityType === id
                    ? "border-transparent text-white shadow-sm"
                    : "border-gray-100 dark:border-gray-800 text-gray-500 bg-gray-50 dark:bg-gray-800/60"
                )}
                style={activityType === id ? { backgroundColor: color } : {}}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* "Other" secondary pill */}
          <button
            onClick={() => setActivityType("Other")}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border",
              activityType === "Other"
                ? "bg-violet-500 border-violet-500 text-white"
                : "border-gray-100 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            Other activity
          </button>

          {/* Running: Trail / Road toggle */}
          {activityType === "Running" && (
            <div className="flex gap-2">
              {(["Road", "Trail"] as const).map((rt) => (
                <button
                  key={rt}
                  onClick={() => setRunType(rt)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all",
                    runType === rt
                      ? rt === "Trail"
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-sky-500 border-sky-500 text-white"
                      : "border-gray-100 dark:border-gray-800 text-gray-400 bg-gray-50 dark:bg-gray-800/60"
                  )}
                >
                  {rt === "Trail" ? <Mountain className="w-3.5 h-3.5" /> : <Navigation2 className="w-3.5 h-3.5" />}
                  {rt}
                </button>
              ))}
            </div>
          )}

          {/* Input fields */}
          <div className={cn("grid gap-2", activityType === "Running" ? "grid-cols-2" : "grid-cols-1")}>
            {activityType === "Running" && (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="number" placeholder="Distance (km)"
                  value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)}
                  className="pl-9 text-sm" step="0.1" min="0"
                />
              </div>
            )}
            <div className="relative">
              <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                type="number" placeholder="Duration (min)"
                value={durationMin} onChange={(e) => setDurationMin(e.target.value)}
                className="pl-9 text-sm" min="1"
              />
            </div>
          </div>

          {/* Running only: Elevation gain */}
          {activityType === "Running" && (
            <div className="relative">
              <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                type="number" placeholder="Elevation gain (m) — optional"
                value={elevationGain} onChange={(e) => setElevationGain(e.target.value)}
                className="pl-9 text-sm" min="0"
              />
            </div>
          )}

          <Button onClick={handleLogActivity} className="w-full gap-1.5">
            <Plus className="w-4 h-4" />
            Log {activityType}
          </Button>

          <p className="text-[10px] text-gray-400 text-center -mt-1">
            Logging auto-checks any exercise habits for today
          </p>
        </div>

        {/* ─── ACTIVITY HISTORY ─── */}
        {activityLog.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Recent Activity
            </p>
            <div className="space-y-2">
              {activityLog.slice(0, 20).map((entry) => {
                const info = getTypeInfo(entry.type);
                const Icon = info.icon;
                const color = info.color;

                const metricPrimary = entry.type === "Running" && entry.distanceKm != null
                  ? `${entry.distanceKm} km`
                  : `${entry.durationMin ?? "—"} min`;
                const metricSecondary = [
                  entry.type === "Running" && entry.durationMin ? `${entry.durationMin} min` : null,
                  entry.runType ? `${entry.runType}` : null,
                  entry.elevationGain ? `↑${entry.elevationGain}m` : null,
                ].filter(Boolean).join(" · ");

                return (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3 border border-gray-100 dark:border-gray-800/40"
                    style={{ borderRadius: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{metricPrimary}</p>
                        {entry.runType && (
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                            entry.runType === "Trail" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-sky-50 text-sky-600 dark:bg-sky-900/20"
                          )}>
                            {entry.runType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {entry.type}
                        {metricSecondary ? ` · ${metricSecondary}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">
                        {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <button
                        onClick={() => deleteActivityEntry(entry.id)}
                        className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ── Reusable StatCard ── */
function StatCard({
  icon: Icon, label, value, unit, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div
      className="bg-white dark:bg-card p-4 flex flex-col gap-2.5"
      style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}
    >
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center bg-accent">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-3xl font-black text-foreground leading-none tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-1">{unit}</p>
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
