import { useState, useMemo } from "react";
import {
  Scale, Dumbbell, Activity, Trash2, Check, Plus, MapPin, Timer,
  Wind, Heart, Zap, TrendingUp, Mountain, Navigation2, Utensils,
  Flame, Pencil, X, Beef,
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
import { useNutritionLog } from "@/hooks/useNutritionLog";

/* ─── Constants ──────────────────────────────────────── */
const PRIMARY_TYPES = [
  { id: "Running",   label: "Running",   icon: Wind,     color: "#556B2F" },
  { id: "Badminton", label: "Badminton", icon: Activity,  color: "#B8860B" },
  { id: "Workout",   label: "Workout",   icon: Dumbbell,  color: "#4A4A4A" },
];
const OTHER_TYPE = { id: "Other", label: "Other", icon: Zap, color: "#9C8B7A" };
const ALL_TYPES = [...PRIMARY_TYPES, OTHER_TYPE];

const EXERCISE_KEYWORDS = [
  "exercise", "workout", "sport", "gym", "run", "running",
  "fitness", "badminton", "olahraga", "lari", "training", "activity",
];

type SubTab = "activity" | "nutrition" | "body";
type Period = "day" | "week" | "month";

function getTypeInfo(type: string) {
  return ALL_TYPES.find((t) => t.id === type) ?? OTHER_TYPE;
}

/* ─── Period helpers ─────────────────────────────────── */
function getPeriodRange(period: Period): { start: string; end: string } {
  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];
  if (period === "day") return { start: todayKey, end: todayKey };

  if (period === "week") {
    const day = today.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split("T")[0],
      end: sunday.toISOString().split("T")[0],
    };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function filterByPeriod<T extends { date: string }>(entries: T[], period: Period): T[] {
  const { start, end } = getPeriodRange(period);
  return entries.filter((e) => e.date >= start && e.date <= end);
}

/* ─── Main Component ─────────────────────────────────── */
export default function HealthPage() {
  const {
    weightLog, addWeightEntry, deleteWeightEntry, latestWeight,
    activityLog, addActivityEntry, deleteActivityEntry,
    habitsWithStats, isCheckedInToday, toggleCheckIn,
  } = useApp();
  const { entries: nutritionLog, targets, addEntry: addMeal, deleteEntry: deleteMeal, updateTargets } = useNutritionLog();
  const { toast } = useToast();

  const [subTab, setSubTab] = useState<SubTab>("activity");
  const [period, setPeriod] = useState<Period>("week");

  /* Activity state */
  const [activityType, setActivityType] = useState("Running");
  const [durationMin, setDurationMin]   = useState("");
  const [distanceKm, setDistanceKm]     = useState("");
  const [elevationGain, setElevationGain] = useState("");
  const [runType, setRunType]           = useState<"Trail" | "Road">("Road");

  /* Weight state */
  const [weightInput, setWeightInput]   = useState("");

  /* Nutrition state */
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealName, setMealName]         = useState("");
  const [mealCal, setMealCal]           = useState("");
  const [mealProt, setMealProt]         = useState("");
  const [editingTargets, setEditingTargets] = useState(false);
  const [calTarget, setCalTarget]       = useState(targets.calories.toString());
  const [protTarget, setProtTarget]     = useState(targets.protein.toString());

  const todayKey = new Date().toISOString().split("T")[0];

  /* ── Period-filtered activity log ── */
  const filteredActivity = useMemo(() => filterByPeriod(activityLog, period), [activityLog, period]);

  /* ── Activity stats (period-filtered) ── */
  const stats = useMemo(() => {
    const totalActivities = filteredActivity.length;
    const totalDistance = filteredActivity.reduce((s, e) => s + (e.distanceKm ?? 0), 0);
    const totalMinutes = filteredActivity.reduce((s, e) => s + (e.durationMin ?? 0), 0);
    const longestRun = filteredActivity
      .filter((e) => e.type === "Running" && e.distanceKm != null)
      .reduce((max, e) => Math.max(max, e.distanceKm!), 0);
    return { totalActivities, totalDistance, totalMinutes, longestRun };
  }, [filteredActivity]);

  /* ── Donut chart (period-filtered) ── */
  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredActivity.forEach((e) => { counts[e.type] = (counts[e.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({
      type, count, color: getTypeInfo(type).color,
    }));
  }, [filteredActivity]);

  /* ── Today's nutrition ── */
  const todayMeals = useMemo(() => nutritionLog.filter((e) => e.date === todayKey), [nutritionLog, todayKey]);
  const todayCal  = todayMeals.reduce((s, e) => s + e.calories, 0);
  const todayProt = todayMeals.reduce((s, e) => s + e.protein, 0);
  const calPct    = Math.min(100, Math.round((todayCal / targets.calories) * 100));
  const protPct   = Math.min(100, Math.round((todayProt / targets.protein) * 100));

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
        ? `${activityType} saved. ${autoChecked} habit${autoChecked > 1 ? "s" : ""} auto-checked ✓`
        : `${activityType} logged successfully.`,
    });
  }

  function handleLogMeal() {
    const cal  = parseFloat(mealCal);
    const prot = parseFloat(mealProt);
    if (!mealName.trim()) {
      toast({ title: "Name required", description: "Enter a meal name.", variant: "destructive" });
      return;
    }
    if (isNaN(cal) || cal < 0) {
      toast({ title: "Invalid calories", description: "Enter a valid calorie count.", variant: "destructive" });
      return;
    }
    addMeal({ date: todayKey, name: mealName.trim(), calories: cal, protein: isNaN(prot) ? 0 : prot });
    setMealName(""); setMealCal(""); setMealProt("");
    setShowMealModal(false);
    toast({ title: "Meal logged!", description: `${mealName.trim()} — ${cal} kcal added.` });
  }

  function handleSaveTargets() {
    const cal  = parseFloat(calTarget);
    const prot = parseFloat(protTarget);
    if (isNaN(cal) || cal <= 0 || isNaN(prot) || prot <= 0) {
      toast({ title: "Invalid targets", description: "Enter positive numbers for both targets.", variant: "destructive" });
      return;
    }
    updateTargets({ calories: cal, protein: prot });
    setEditingTargets(false);
    toast({ title: "Targets updated" });
  }

  const weightChartData = [...weightLog].slice(-10);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-3xl font-black text-foreground leading-tight">Health</h1>
            <p className="text-xs text-muted-foreground mt-1">Activity · Nutrition · Body</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* ─── SUB-TAB PILLS ─── */}
        <div
          className="sticky top-16 z-20 py-2 -mx-4 px-4"
          style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "rgba(250,249,246,0.88)" }}
        >
          <div className="flex gap-2">
            {([
              { id: "activity",  label: "Activity",  icon: Activity },
              { id: "nutrition", label: "Nutrition",  icon: Utensils },
              { id: "body",      label: "Body",       icon: Scale },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSubTab(id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold transition-all border",
                  subTab === id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent text-accent-foreground border-accent hover:text-primary"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ACTIVITY TAB
        ══════════════════════════════════════════ */}
        {subTab === "activity" && (
          <div className="space-y-4">
            {/* Period selector */}
            <div className="flex gap-2">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize",
                    period === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-accent text-accent-foreground border-accent hover:text-primary"
                  )}
                >
                  {p === "day" ? "Today" : p === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>

            {/* Stats grid */}
            {filteredActivity.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCard icon={TrendingUp} label="Activities" value={stats.totalActivities.toString()} unit="sessions" />
                  <StatCard icon={MapPin} label="Total Distance" value={stats.totalDistance.toFixed(1)} unit="km running" />
                  <StatCard
                    icon={Timer} label="Active Time"
                    value={stats.totalMinutes >= 60 ? (stats.totalMinutes / 60).toFixed(1) : stats.totalMinutes.toString()}
                    unit={stats.totalMinutes >= 60 ? "hours" : "minutes"}
                  />
                  <StatCard
                    icon={Navigation2} label="Longest Run"
                    value={stats.longestRun > 0 ? stats.longestRun.toFixed(1) : "—"}
                    unit={stats.longestRun > 0 ? "km PR" : "no runs yet"}
                  />
                </div>

                {/* Donut */}
                <div className="bg-white dark:bg-card p-4 flex items-center gap-5" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
                  <div className="relative shrink-0 w-[90px] h-[90px]">
                    <PieChart width={90} height={90}>
                      <Pie data={donutData} dataKey="count" cx={41} cy={41} innerRadius={28} outerRadius={41} strokeWidth={0} startAngle={90} endAngle={-270}>
                        {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-black text-foreground">{filteredActivity.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground mb-2">Activity Split</p>
                    {donutData.map((d) => {
                      const pct = Math.round((d.count / filteredActivity.length) * 100);
                      return (
                        <div key={d.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="text-xs text-muted-foreground">{d.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-accent rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground w-7 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No activities logged {period === "day" ? "today" : period === "week" ? "this week" : "this month"} yet
              </div>
            )}

            {/* ─── LOG ACTIVITY FORM ─── */}
            <div className="bg-white dark:bg-card p-4 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Log Activity</p>
              </div>

              <div className="flex gap-2">
                {PRIMARY_TYPES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setActivityType(id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border-2",
                      activityType === id
                        ? "border-transparent text-white"
                        : "border-transparent text-muted-foreground bg-accent"
                    )}
                    style={activityType === id ? { backgroundColor: color } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActivityType("Other")}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border",
                  activityType === "Other"
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-accent text-muted-foreground hover:text-primary bg-accent"
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                Other activity
              </button>

              {activityType === "Running" && (
                <div className="flex gap-2">
                  {(["Road", "Trail"] as const).map((rt) => (
                    <button
                      key={rt}
                      onClick={() => setRunType(rt)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all",
                        runType === rt
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-accent text-muted-foreground bg-accent"
                      )}
                    >
                      {rt === "Trail" ? <Mountain className="w-3.5 h-3.5" /> : <Navigation2 className="w-3.5 h-3.5" />}
                      {rt}
                    </button>
                  ))}
                </div>
              )}

              <div className={cn("grid gap-2", activityType === "Running" ? "grid-cols-2" : "grid-cols-1")}>
                {activityType === "Running" && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input type="number" placeholder="Distance (km)" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} className="pl-9 text-sm" step="0.1" min="0" />
                  </div>
                )}
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder="Duration (min)" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className="pl-9 text-sm" min="1" />
                </div>
              </div>

              {activityType === "Running" && (
                <div className="relative">
                  <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder="Elevation gain (m) — optional" value={elevationGain} onChange={(e) => setElevationGain(e.target.value)} className="pl-9 text-sm" min="0" />
                </div>
              )}

              <Button onClick={handleLogActivity} className="w-full gap-1.5">
                <Plus className="w-4 h-4" />
                Log {activityType}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center -mt-1">
                Logging auto-checks exercise habits for today
              </p>
            </div>

            {/* ─── ACTIVITY HISTORY ─── */}
            {activityLog.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">All Activity</p>
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
                      entry.runType ? entry.runType : null,
                      entry.elevationGain ? `↑${entry.elevationGain}m` : null,
                    ].filter(Boolean).join(" · ");

                    return (
                      <div key={entry.id} className="group flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground">{metricPrimary}</p>
                            {entry.runType && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-accent text-primary">{entry.runType}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {entry.type}{metricSecondary ? ` · ${metricSecondary}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          <button onClick={() => deleteActivityEntry(entry.id)} className="p-1 rounded text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
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
        )}

        {/* ══════════════════════════════════════════
            NUTRITION TAB
        ══════════════════════════════════════════ */}
        {subTab === "nutrition" && (
          <div className="space-y-4">
            {/* Progress bars card */}
            <div className="bg-white dark:bg-card p-5 space-y-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Today's Nutrition</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => { setEditingTargets((v) => !v); setCalTarget(targets.calories.toString()); setProtTarget(targets.protein.toString()); }}
                  className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {editingTargets ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Edit targets inline */}
              {editingTargets && (
                <div className="bg-accent rounded-2xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary">Daily Targets</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Calories (kcal)</label>
                      <Input type="number" value={calTarget} onChange={(e) => setCalTarget(e.target.value)} className="mt-1 text-sm" min="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein (g)</label>
                      <Input type="number" value={protTarget} onChange={(e) => setProtTarget(e.target.value)} className="mt-1 text-sm" min="0" />
                    </div>
                  </div>
                  <Button onClick={handleSaveTargets} size="sm" className="w-full">Save Targets</Button>
                </div>
              )}

              {/* Calories bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-accent flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Calories</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-foreground">{todayCal}</span>
                    <span className="text-xs text-muted-foreground"> / {targets.calories} kcal</span>
                  </div>
                </div>
                <div className="h-3 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${calPct}%`, background: "hsl(var(--primary))" }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">{calPct}% of daily target</p>
              </div>

              {/* Protein bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#B8860B22" }}>
                      <Beef className="w-3.5 h-3.5" style={{ color: "#B8860B" }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Protein</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-foreground">{todayProt}g</span>
                    <span className="text-xs text-muted-foreground"> / {targets.protein}g</span>
                  </div>
                </div>
                <div className="h-3 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${protPct}%`, background: "#B8860B" }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">{protPct}% of daily target</p>
              </div>
            </div>

            {/* Log Meal button */}
            <Button onClick={() => setShowMealModal(true)} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Log Meal
            </Button>

            {/* Today's food history */}
            {todayMeals.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Today's Meals</p>
                <div className="space-y-2">
                  {todayMeals.map((meal) => (
                    <div key={meal.id} className="group flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                      <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                        <Utensils className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{meal.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-medium text-primary">{meal.calories} kcal</span>
                          {meal.protein > 0 && (
                            <span className="text-xs text-muted-foreground">{meal.protein}g protein</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteMeal(meal.id)}
                        className="p-1 rounded text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-3xl bg-accent mx-auto flex items-center justify-center mb-3">
                  <Utensils className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">No meals logged today</p>
                <p className="text-xs text-muted-foreground mt-1">Tap "Log Meal" to track your nutrition</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            BODY TAB
        ══════════════════════════════════════════ */}
        {subTab === "body" && (
          <div className="space-y-4">
            {/* Current weight hero */}
            {latestWeight !== null && (
              <div className="bg-white dark:bg-card p-5 flex items-center gap-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
                <div className="w-14 h-14 rounded-3xl bg-accent flex items-center justify-center shrink-0">
                  <Scale className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Weight</p>
                  <p className="text-4xl font-black text-foreground leading-none tracking-tight mt-0.5">{latestWeight}</p>
                  <p className="text-sm text-muted-foreground">kg</p>
                </div>
              </div>
            )}

            {/* Weight chart */}
            {weightChartData.length >= 2 && (
              <div className="bg-white dark:bg-card p-4 space-y-2" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Weight Trend</p>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightChartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="hwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => { const dt = new Date(d); return `${dt.getMonth() + 1}/${dt.getDate()}`; }}
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
                        stroke="var(--color-primary)" strokeWidth={2}
                        fill="url(#hwGrad)" dot={false}
                        activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Log weight */}
            <div className="bg-white dark:bg-card p-4 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Log Weight</p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number" placeholder="Enter weight (kg)"
                  value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogWeight(); }}
                  className="text-sm flex-1" step="0.1" min="0"
                />
                <Button onClick={handleLogWeight} size="sm" className="shrink-0 gap-1">
                  <Check className="w-3.5 h-3.5" /> Log
                </Button>
              </div>
            </div>

            {/* Weight history */}
            {weightLog.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Weight History</p>
                <div className="space-y-1.5">
                  {[...weightLog].reverse().slice(0, 10).map((entry) => (
                    <div key={entry.id} className="group flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                          <Scale className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">{entry.weight} kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <button onClick={() => deleteWeightEntry(entry.id)} className="p-1 rounded text-muted-foreground/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {weightLog.length === 0 && (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-3xl bg-accent mx-auto flex items-center justify-center mb-3">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">No weight logged yet</p>
                <p className="text-xs text-muted-foreground mt-1">Log your first weight above to start tracking</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════
          LOG MEAL MODAL
      ══════════════════════════════════════════ */}
      {showMealModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMealModal(false); }}
        >
          <div
            className="bg-white dark:bg-card w-full max-w-md p-6 space-y-4 mb-0"
            style={{ borderRadius: "28px 28px 0 0", border: "1px solid #E5E0D8" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-foreground">Log Meal</p>
                <p className="text-xs text-muted-foreground">Track calories & protein</p>
              </div>
              <button onClick={() => setShowMealModal(false)} className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Meal Name *</label>
                <Input
                  placeholder="e.g. Chicken rice, Oatmeal…"
                  value={mealName} onChange={(e) => setMealName(e.target.value)}
                  className="mt-1 text-sm"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Calories (kcal) *</label>
                  <div className="relative mt-1">
                    <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number" placeholder="0"
                      value={mealCal} onChange={(e) => setMealCal(e.target.value)}
                      className="pl-9 text-sm" min="0"
                      onKeyDown={(e) => { if (e.key === "Enter") handleLogMeal(); }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein (g)</label>
                  <div className="relative mt-1">
                    <Beef className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number" placeholder="0"
                      value={mealProt} onChange={(e) => setMealProt(e.target.value)}
                      className="pl-9 text-sm" min="0"
                      onKeyDown={(e) => { if (e.key === "Enter") handleLogMeal(); }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowMealModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleLogMeal} className="flex-1 gap-1.5">
                <Plus className="w-4 h-4" />
                Add Meal
              </Button>
            </div>

            <div className="h-safe-bottom" style={{ height: "env(safe-area-inset-bottom, 0)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── StatCard ──────────────────────────────────────── */
function StatCard({
  icon: Icon, label, value, unit,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="bg-white dark:bg-card p-4 flex flex-col gap-2.5" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
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
