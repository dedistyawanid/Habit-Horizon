import { useState, useMemo } from "react";
import {
  Scale, Dumbbell, Activity, Trash2, Check, Plus, MapPin, Timer,
  Wind, Heart, Zap, TrendingUp, Mountain, Navigation2, Utensils,
  Flame, X, Beef, Wheat, Target,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNutritionLog } from "@/hooks/useNutritionLog";

/* ─── Constants ──────────────────────────────────────── */
const PRIMARY_TYPES = [
  { id: "Running",   label: "Running",   icon: Wind,    color: "#556B2F" },
  { id: "Badminton", label: "Badminton", icon: Activity, color: "#B8860B" },
  { id: "Workout",   label: "Workout",   icon: Dumbbell, color: "#4A4A4A" },
];
const OTHER_TYPE = { id: "Other", label: "Other", icon: Zap, color: "#9C8B7A" };
const ALL_TYPES  = [...PRIMARY_TYPES, OTHER_TYPE];

const EXERCISE_KEYWORDS = [
  "exercise","workout","sport","gym","run","running",
  "fitness","badminton","olahraga","lari","training","activity",
];

type SubTab = "activity" | "nutrition" | "body";
type Period  = "day" | "week" | "month";

function getTypeInfo(type: string) { return ALL_TYPES.find((t) => t.id === type) ?? OTHER_TYPE; }

/* ─── Period helpers ─────────────────────────────────── */
function getPeriodRange(period: Period) {
  const today  = new Date();
  const todayK = today.toISOString().split("T")[0];
  if (period === "day") return { start: todayK, end: todayK };
  if (period === "week") {
    const day = today.getDay();
    const mon = new Date(today); mon.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
    const sun = new Date(mon);   sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().split("T")[0], end: sun.toISOString().split("T")[0] };
  }
  const s = new Date(today.getFullYear(), today.getMonth(), 1);
  const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: s.toISOString().split("T")[0], end: e.toISOString().split("T")[0] };
}
function filterByPeriod<T extends { date: string }>(items: T[], period: Period) {
  const { start, end } = getPeriodRange(period);
  return items.filter((e) => e.date >= start && e.date <= end);
}
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

/* ─── Main Component ─────────────────────────────────── */
export default function HealthPage() {
  const {
    weightLog, addWeightEntry, deleteWeightEntry, latestWeight,
    activityLog, addActivityEntry, deleteActivityEntry,
    habitsWithStats, isCheckedInToday, toggleCheckIn,
  } = useApp();
  const { entries: nutritionLog, targets, addEntry: addMeal, deleteEntry: deleteMeal } = useNutritionLog();
  const { toast } = useToast();

  /* UI state */
  const [subTab, setSubTab]       = useState<SubTab>("activity");
  const [period, setPeriod]       = useState<Period>("week");
  const [fabOpen, setFabOpen]     = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showMeal, setShowMeal]   = useState(false);
  const [showWeight, setShowWeight] = useState(false);

  /* Activity form */
  const [actType, setActType]     = useState("Running");
  const [duration, setDuration]   = useState("");
  const [distance, setDistance]   = useState("");
  const [elevation, setElevation] = useState("");
  const [runType, setRunType]     = useState<"Trail"|"Road">("Road");

  /* Meal form */
  const [mealName, setMealName]   = useState("");
  const [mealCal, setMealCal]     = useState("");
  const [mealProt, setMealProt]   = useState("");
  const [mealCarbs, setMealCarbs] = useState("");

  /* Weight form */
  const [weightInput, setWeightInput] = useState("");

  const todayKey   = new Date().toISOString().split("T")[0];
  const GOAL_WEIGHT = 60;

  /* ── Derived: Activity ── */
  const filteredAct = useMemo(() => filterByPeriod(activityLog, period), [activityLog, period]);

  const stats = useMemo(() => ({
    sessions:     filteredAct.length,
    distance:     filteredAct.reduce((s, e) => s + (e.distanceKm ?? 0), 0),
    minutes:      filteredAct.reduce((s, e) => s + (e.durationMin ?? 0), 0),
    longestRun:   filteredAct.filter((e) => e.type === "Running" && e.distanceKm != null).reduce((m, e) => Math.max(m, e.distanceKm!), 0),
  }), [filteredAct]);

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAct.forEach((e) => { counts[e.type] = (counts[e.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count, color: getTypeInfo(type).color }));
  }, [filteredAct]);

  const actChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAct.filter((e) => e.type === "Running" && e.distanceKm).forEach((e) => {
      map[e.date] = (map[e.date] ?? 0) + e.distanceKm!;
    });
    return Object.entries(map).sort().map(([date, km]) => ({ date, km: +km.toFixed(2) }));
  }, [filteredAct]);

  /* ── Derived: Nutrition ── */
  const filteredNutr  = useMemo(() => filterByPeriod(nutritionLog, period), [nutritionLog, period]);
  const todayMeals    = useMemo(() => nutritionLog.filter((e) => e.date === todayKey), [nutritionLog, todayKey]);
  const todayCal      = todayMeals.reduce((s, e) => s + e.calories, 0);
  const todayProt     = todayMeals.reduce((s, e) => s + e.protein, 0);
  const todayCarbs    = todayMeals.reduce((s, e) => s + (e.carbs ?? 0), 0);
  const calPct        = Math.min(100, Math.round((todayCal  / targets.calories) * 100));
  const protPct       = Math.min(100, Math.round((todayProt / targets.protein)  * 100));
  const carbsPct      = Math.min(100, Math.round((todayCarbs/ targets.carbs)    * 100));

  const nutrChartData = useMemo(() => {
    const map: Record<string, { calories: number; protein: number }> = {};
    filteredNutr.forEach((e) => {
      if (!map[e.date]) map[e.date] = { calories: 0, protein: 0 };
      map[e.date].calories += e.calories;
      map[e.date].protein  += e.protein;
    });
    return Object.entries(map).sort().map(([date, v]) => ({
      date,
      protein:      v.protein,
      caloriesNorm: +(v.calories / 100).toFixed(1),
      calories:     v.calories,
    }));
  }, [filteredNutr]);

  /* ── Derived: Body ── */
  const bodyChartData = useMemo(() =>
    [...weightLog].slice(-20).map((e) => ({ date: e.date, weight: e.weight, goal: GOAL_WEIGHT })),
    [weightLog]
  );
  const firstWeight = weightLog.length > 0 ? weightLog[0].weight : null;
  const goalProgress = useMemo(() => {
    if (latestWeight === null || firstWeight === null || firstWeight === GOAL_WEIGHT) return 0;
    const total = Math.abs(firstWeight - GOAL_WEIGHT);
    const done  = Math.abs(firstWeight - latestWeight);
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
  }, [latestWeight, firstWeight]);

  /* ─── Handlers ─── */
  function handleLogActivity() {
    const dur = parseFloat(duration);
    if (!duration || isNaN(dur) || dur <= 0) {
      toast({ title: "Duration required", variant: "destructive" }); return;
    }
    if (actType === "Running") {
      const dist = parseFloat(distance);
      if (!distance || isNaN(dist) || dist <= 0) {
        toast({ title: "Distance required", variant: "destructive" }); return;
      }
    }
    addActivityEntry({
      date: todayKey, type: actType, durationMin: dur,
      distanceKm:    actType === "Running" ? parseFloat(distance)  : undefined,
      elevationGain: actType === "Running" && elevation ? parseFloat(elevation) : undefined,
      runType:       actType === "Running" ? runType : undefined,
    });
    const hits = habitsWithStats.filter((h) => EXERCISE_KEYWORDS.some((kw) => h.name.toLowerCase().includes(kw)));
    let auto = 0;
    hits.forEach((h) => { if (!isCheckedInToday(h.id)) { toggleCheckIn(h.id); auto++; } });
    setDuration(""); setDistance(""); setElevation("");
    setShowActivity(false);
    toast({ title: "Activity logged!", description: auto > 0 ? `${auto} habit${auto > 1 ? "s" : ""} auto-checked ✓` : `${actType} saved.` });
  }

  function handleLogMeal() {
    const cal  = parseFloat(mealCal);
    const prot = parseFloat(mealProt);
    const carbs = parseFloat(mealCarbs);
    if (!mealName.trim()) { toast({ title: "Meal name required", variant: "destructive" }); return; }
    if (isNaN(cal) || cal < 0) { toast({ title: "Invalid calories", variant: "destructive" }); return; }
    addMeal({ date: todayKey, name: mealName.trim(), calories: cal, protein: isNaN(prot) ? 0 : prot, carbs: isNaN(carbs) ? 0 : carbs });
    setMealName(""); setMealCal(""); setMealProt(""); setMealCarbs("");
    setShowMeal(false);
    toast({ title: "Meal logged!", description: `${mealName.trim()} — ${cal} kcal` });
  }

  function handleLogWeight() {
    const val = parseFloat(weightInput.trim());
    if (isNaN(val) || val <= 0 || val > 500) {
      toast({ title: "Invalid weight", variant: "destructive" }); return;
    }
    addWeightEntry(val);
    setWeightInput("");
    setShowWeight(false);
    toast({ title: "Weight logged", description: `${val} kg recorded for today.` });
  }

  function openFabAction(action: "activity" | "meal" | "weight") {
    setFabOpen(false);
    setTimeout(() => {
      if (action === "activity") { setSubTab("activity"); setShowActivity(true); }
      if (action === "meal")     { setSubTab("nutrition"); setShowMeal(true); }
      if (action === "weight")   { setSubTab("body"); setShowWeight(true); }
    }, 150);
  }

  /* ─── Shared chart axis style ─── */
  const axisTick = { fontSize: 9, fill: "#9C8B7A" };
  const tooltipStyle = { fontSize: 11, borderRadius: 12, border: "1px solid #E5E0D8", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" };

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

        {/* ─── SUB-TAB PILLS (sticky) ─── */}
        <div
          className="sticky top-16 z-20 py-2 -mx-4 px-4"
          style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "rgba(250,249,246,0.90)" }}
        >
          <div className="flex gap-2">
            {([
              { id: "activity",  label: "Activity",  icon: Activity  },
              { id: "nutrition", label: "Nutrition",  icon: Utensils  },
              { id: "body",      label: "Body",       icon: Scale     },
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

          {/* Period filter — small, below sub-tabs */}
          <div className="flex gap-1.5 mt-2">
            {(["day", "week", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "flex-1 py-1 rounded-lg text-[11px] font-medium border transition-all",
                  period === p
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "text-muted-foreground border-accent bg-transparent hover:text-primary"
                )}
              >
                {p === "day" ? "Today" : p === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════ ACTIVITY TAB ══════════════ */}
        {subTab === "activity" && (
          <div className="space-y-4">

            {/* Running KM trend chart */}
            <div className="bg-white dark:bg-card p-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Running KM Trend</p>
              {actChartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={130}>
                  <AreaChart data={actChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#556B2F" stopOpacity={0.20} />
                        <stop offset="95%" stopColor="#556B2F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} km`, "Distance"]} labelFormatter={fmtDate} />
                    <Area type="monotone" dataKey="km" stroke="#556B2F" strokeWidth={2} fill="url(#actGrad)" dot={false} activeDot={{ r: 4, fill: "#556B2F", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[130px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">
                    {actChartData.length === 0 ? "Log runs to see your distance trend" : "Log at least 2 runs to see a chart"}
                  </p>
                </div>
              )}
            </div>

            {/* Stat cards */}
            {filteredAct.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCard icon={TrendingUp}  label="Sessions"     value={stats.sessions.toString()}            unit="activities" />
                  <StatCard icon={MapPin}       label="Distance"     value={stats.distance.toFixed(1)}            unit="km running" />
                  <StatCard
                    icon={Timer} label="Active Time"
                    value={stats.minutes >= 60 ? (stats.minutes / 60).toFixed(1) : stats.minutes.toString()}
                    unit={stats.minutes >= 60 ? "hours" : "minutes"}
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
                        {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-black text-foreground">{filteredAct.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground mb-2">Activity Split</p>
                    {donutData.map((d) => {
                      const pct = Math.round((d.count / filteredAct.length) * 100);
                      return (
                        <div key={d.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                            <span className="text-xs text-muted-foreground">{d.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1 bg-accent rounded-full overflow-hidden">
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
            )}

            {filteredAct.length === 0 && actChartData.length === 0 && (
              <EmptyState icon={Wind} title={`No activities ${period === "day" ? "today" : period === "week" ? "this week" : "this month"}`} sub="Use the form below to log your first activity" />
            )}

            {/* ─── Inline Log Activity Form ─── */}
            <div className="bg-white dark:bg-card p-5 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Log Activity</p>
              </div>

              {/* Type selector */}
              <div className="flex gap-2">
                {PRIMARY_TYPES.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => setActType(id)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border-2",
                      actType === id ? "border-transparent text-white" : "border-transparent text-muted-foreground bg-accent"
                    )}
                    style={actType === id ? { backgroundColor: color } : {}}
                  >
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActType("Other")}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border",
                  actType === "Other" ? "bg-primary border-primary text-primary-foreground" : "border-accent text-muted-foreground bg-accent hover:text-primary"
                )}
              >
                <Zap className="w-3.5 h-3.5" /> Other activity
              </button>

              {/* Trail / Road toggle */}
              {actType === "Running" && (
                <div className="flex gap-2">
                  {(["Road", "Trail"] as const).map((rt) => (
                    <button
                      key={rt}
                      onClick={() => setRunType(rt)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all",
                        runType === rt ? "bg-primary border-primary text-primary-foreground" : "border-accent text-muted-foreground bg-accent"
                      )}
                    >
                      {rt === "Trail" ? <Mountain className="w-3.5 h-3.5" /> : <Navigation2 className="w-3.5 h-3.5" />} {rt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input fields */}
              <div className={cn("grid gap-2", actType === "Running" ? "grid-cols-2" : "grid-cols-1")}>
                {actType === "Running" && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input type="number" placeholder="Distance (km)" value={distance} onChange={(e) => setDistance(e.target.value)} className="pl-9 text-sm" step="0.1" min="0" />
                  </div>
                )}
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} className="pl-9 text-sm" min="1" />
                </div>
              </div>
              {actType === "Running" && (
                <div className="relative">
                  <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder="Elevation gain (m) — optional" value={elevation} onChange={(e) => setElevation(e.target.value)} className="pl-9 text-sm" min="0" />
                </div>
              )}

              <Button onClick={handleLogActivity} className="w-full gap-1.5">
                <Plus className="w-4 h-4" /> Log {actType}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center -mt-1">Logging auto-checks exercise habits for today</p>
            </div>

            {/* Activity history */}
            {activityLog.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">All Activity</p>
                <div className="space-y-2">
                  {activityLog.slice(0, 15).map((entry) => {
                    const info = getTypeInfo(entry.type);
                    const Icon = info.icon;
                    const metricPrimary   = entry.type === "Running" && entry.distanceKm != null ? `${entry.distanceKm} km` : `${entry.durationMin ?? "—"} min`;
                    const metricSecondary = [
                      entry.type === "Running" && entry.durationMin ? `${entry.durationMin} min` : null,
                      entry.runType, entry.elevationGain ? `↑${entry.elevationGain}m` : null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div key={entry.id} className="group flex items-center gap-3 bg-white px-4 py-3" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${info.color}1A` }}>
                          <Icon className="w-4 h-4" style={{ color: info.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground">{metricPrimary}</p>
                            {entry.runType && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-accent text-primary">{entry.runType}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{entry.type}{metricSecondary ? ` · ${metricSecondary}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          <button onClick={() => deleteActivityEntry(entry.id)} className="p-1 rounded text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
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

        {/* ══════════════ NUTRITION TAB ══════════════ */}
        {subTab === "nutrition" && (
          <div className="space-y-4">

            {/* ─── Inline Log Meal Form ─── */}
            <div className="bg-white dark:bg-card p-5 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Log Meal</p>
              </div>
              <div>
                <Input
                  placeholder="Meal name (e.g. Chicken rice, Oatmeal…)"
                  value={mealName} onChange={(e) => setMealName(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <Flame className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder="kcal" value={mealCal} onChange={(e) => setMealCal(e.target.value)} className="pl-8 text-sm" min="0" />
                </div>
                <div className="relative">
                  <Beef className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder="protein g" value={mealProt} onChange={(e) => setMealProt(e.target.value)} className="pl-8 text-sm" min="0" />
                </div>
                <div className="relative">
                  <Wheat className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder="carbs g" value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} className="pl-8 text-sm" min="0" />
                </div>
              </div>
              <div className="flex gap-1 text-[10px] text-muted-foreground">
                <span className="flex-1 text-center">Calories (kcal)</span>
                <span className="flex-1 text-center">Protein (g)</span>
                <span className="flex-1 text-center">Carbs (g)</span>
              </div>
              <Button onClick={handleLogMeal} className="w-full gap-1.5">
                <Plus className="w-4 h-4" /> Add Meal
              </Button>
            </div>

            {/* 3 Progress Rings */}
            <div className="bg-white dark:bg-card p-5" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">Today's Targets</p>
              <div className="flex justify-around items-start">
                <ProgressRing pct={calPct}   color="#556B2F" label="Calories" value={todayCal.toString()}   unit="kcal" size={96} />
                <ProgressRing pct={protPct}  color="#B8860B" label="Protein"  value={`${todayProt}g`}       unit={`/ ${targets.protein}g`} size={96} />
                <ProgressRing pct={carbsPct} color="#9C8B7A" label="Carbs"    value={`${todayCarbs}g`}      unit={`/ ${targets.carbs}g`}   size={96} />
              </div>
              <div className="mt-3 flex justify-end">
                <span className="text-[10px] text-muted-foreground">{calPct}% of {targets.calories} kcal target</span>
              </div>
            </div>

            {/* Nutrition trend chart */}
            <div className="bg-white dark:bg-card p-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nutrition Trend</p>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Calories /100</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "#B8860B" }} />Protein g</span>
                </div>
              </div>
              {nutrChartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={130}>
                  <ComposedChart data={nutrChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#556B2F" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#556B2F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === "caloriesNorm" ? [`${Math.round(v * 100)} kcal`, "Calories"] : [`${v}g`, "Protein"]} labelFormatter={fmtDate} />
                    <Area type="monotone" dataKey="caloriesNorm" stroke="#556B2F" strokeWidth={1.5} fill="url(#calGrad)" dot={false}
                      activeDot={{ r: 3, fill: "#556B2F", strokeWidth: 0 }}
                    />
                    <Line type="monotone" dataKey="protein" stroke="#B8860B" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "#B8860B", strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[130px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Log meals across multiple days to see trends</p>
                </div>
              )}
            </div>

            {/* Today's meals */}
            {todayMeals.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Today's Meals</p>
                {todayMeals.map((meal) => (
                  <div key={meal.id} className="group flex items-center gap-3 bg-white px-4 py-3" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Utensils className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{meal.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-primary">{meal.calories} kcal</span>
                        {meal.protein > 0  && <span className="text-xs text-muted-foreground">{meal.protein}g protein</span>}
                        {meal.carbs   > 0  && <span className="text-xs text-muted-foreground">{meal.carbs}g carbs</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteMeal(meal.id)} className="p-1 rounded text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Utensils} title="No meals logged today" sub="Tap the + button to log a meal" />
            )}
          </div>
        )}

        {/* ══════════════ BODY TAB ══════════════ */}
        {subTab === "body" && (
          <div className="space-y-4">

            {/* ─── Inline Weight Log Form ─── */}
            <div className="bg-white dark:bg-card p-5 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  <p className="text-sm font-bold text-foreground">Log Weight</p>
                </div>
                <span className="text-xs text-muted-foreground">Target: {GOAL_WEIGHT} kg</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="number" placeholder="Current weight (kg)"
                    value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleLogWeight(); }}
                    className="pl-9 text-sm" step="0.1" min="0"
                  />
                </div>
                <Button onClick={handleLogWeight} size="sm" className="shrink-0 gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Log
                </Button>
              </div>
              {latestWeight !== null && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Current: <span className="font-semibold text-primary">{latestWeight} kg</span>
                  {" · "}
                  {latestWeight === GOAL_WEIGHT ? "🎯 Goal reached!" : `${Math.abs(latestWeight - GOAL_WEIGHT).toFixed(1)} kg ${latestWeight > GOAL_WEIGHT ? "to lose" : "to gain"}`}
                </p>
              )}
            </div>

            {/* Weight chart with goal line */}
            <div className="bg-white dark:bg-card p-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Weight Progress</p>
                {latestWeight !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-foreground">{latestWeight}</span>
                    <span className="text-xs text-muted-foreground">kg</span>
                  </div>
                )}
              </div>
              {bodyChartData.length >= 1 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <ComposedChart data={bodyChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#556B2F" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#556B2F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === "weight" ? [`${v} kg`, "Weight"] : [`${v} kg`, "Goal"]} labelFormatter={fmtDate} />
                    <ReferenceLine y={GOAL_WEIGHT} stroke="#E2725B" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: `${GOAL_WEIGHT}kg goal`, position: "insideTopRight", fontSize: 9, fill: "#E2725B" }} />
                    <Area type="monotone" dataKey="weight" stroke="#556B2F" strokeWidth={2} fill="url(#bodyGrad)" dot={false} activeDot={{ r: 4, fill: "#556B2F", strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[140px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Log your weight to see your progress chart</p>
                </div>
              )}
            </div>

            {/* 60kg goal progress bar */}
            {latestWeight !== null && firstWeight !== null && (
              <div className="bg-white dark:bg-card p-4 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">Goal: {GOAL_WEIGHT} kg</p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{goalProgress}%</span>
                </div>
                <div className="h-2.5 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${goalProgress}%`, background: "hsl(var(--primary))" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Start: {firstWeight} kg</span>
                  <span>
                    {latestWeight === GOAL_WEIGHT ? "🎯 Goal reached!" :
                      `${Math.abs(latestWeight - GOAL_WEIGHT).toFixed(1)} kg ${latestWeight > GOAL_WEIGHT ? "to lose" : "to gain"}`}
                  </span>
                </div>
              </div>
            )}

            {/* Weight history */}
            {weightLog.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Weight History</p>
                {[...weightLog].reverse().slice(0, 10).map((entry) => (
                  <div key={entry.id} className="group flex items-center justify-between px-4 py-3 bg-white" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                        <Scale className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{entry.weight} kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <button onClick={() => deleteWeightEntry(entry.id)} className="p-1 rounded text-muted-foreground/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Scale} title="No weight logged yet" sub="Tap the + button to log your weight" />
            )}
          </div>
        )}

      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* Activity modal */}
      <BottomModal open={showActivity} onClose={() => setShowActivity(false)} title="Log Activity" sub="Track your workout">
        <div className="space-y-3">
          <div className="flex gap-2">
            {PRIMARY_TYPES.map(({ id, label, icon: Icon, color }) => (
              <button key={id} onClick={() => setActType(id)}
                className={cn("flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all border-2",
                  actType === id ? "border-transparent text-white" : "border-transparent text-muted-foreground bg-accent")}
                style={actType === id ? { backgroundColor: color } : {}}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
          <button onClick={() => setActType("Other")}
            className={cn("w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all border",
              actType === "Other" ? "bg-primary border-primary text-primary-foreground" : "border-accent text-muted-foreground bg-accent hover:text-primary")}
          >
            <Zap className="w-3.5 h-3.5" /> Other activity
          </button>
          {actType === "Running" && (
            <div className="flex gap-2">
              {(["Road","Trail"] as const).map((rt) => (
                <button key={rt} onClick={() => setRunType(rt)}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all",
                    runType === rt ? "bg-primary border-primary text-primary-foreground" : "border-accent text-muted-foreground bg-accent")}
                >
                  {rt === "Trail" ? <Mountain className="w-3.5 h-3.5" /> : <Navigation2 className="w-3.5 h-3.5" />} {rt}
                </button>
              ))}
            </div>
          )}
          <div className={cn("grid gap-2", actType === "Running" ? "grid-cols-2" : "grid-cols-1")}>
            {actType === "Running" && (
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="number" placeholder="Distance (km)" value={distance} onChange={(e) => setDistance(e.target.value)} className="pl-9 text-sm" step="0.1" min="0" />
              </div>
            )}
            <div className="relative">
              <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input type="number" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} className="pl-9 text-sm" min="1" />
            </div>
          </div>
          {actType === "Running" && (
            <div className="relative">
              <Mountain className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input type="number" placeholder="Elevation gain (m) — optional" value={elevation} onChange={(e) => setElevation(e.target.value)} className="pl-9 text-sm" min="0" />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center">Logging auto-checks exercise habits for today</p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={() => setShowActivity(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleLogActivity} className="flex-1 gap-1.5"><Plus className="w-4 h-4" />Log {actType}</Button>
        </div>
      </BottomModal>

      {/* Meal modal */}
      <BottomModal open={showMeal} onClose={() => setShowMeal(false)} title="Log Meal" sub="Track calories & macros">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Meal Name *</label>
            <Input placeholder="e.g. Chicken rice, Oatmeal…" value={mealName} onChange={(e) => setMealName(e.target.value)} className="mt-1 text-sm" autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Calories *</label>
              <div className="relative mt-1">
                <Flame className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="number" placeholder="0" value={mealCal} onChange={(e) => setMealCal(e.target.value)} className="pl-8 text-sm" min="0" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein (g)</label>
              <div className="relative mt-1">
                <Beef className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="number" placeholder="0" value={mealProt} onChange={(e) => setMealProt(e.target.value)} className="pl-8 text-sm" min="0" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Carbs (g)</label>
              <div className="relative mt-1">
                <Wheat className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="number" placeholder="0" value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} className="pl-8 text-sm" min="0" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={() => setShowMeal(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleLogMeal} className="flex-1 gap-1.5"><Plus className="w-4 h-4" />Add Meal</Button>
        </div>
      </BottomModal>

      {/* Weight modal */}
      <BottomModal open={showWeight} onClose={() => setShowWeight(false)} title="Log Weight" sub="Track your body weight">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Weight (kg) *</label>
            <div className="relative mt-1">
              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="number" placeholder="e.g. 72.5"
                value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleLogWeight(); }}
                className="pl-9 text-sm" step="0.1" min="0" autoFocus
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={() => setShowWeight(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleLogWeight} className="flex-1 gap-1.5"><Check className="w-4 h-4" />Log Weight</Button>
        </div>
      </BottomModal>

      {/* ══════════════ HEALTH FAB ══════════════ */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
        {/* Sub-actions */}
        {([
          { icon: Wind,     label: "Log Activity", action: "activity" as const },
          { icon: Utensils, label: "Log Meal",     action: "meal"     as const },
          { icon: Scale,    label: "Log Weight",   action: "weight"   as const },
        ]).map(({ icon: Icon, label, action }, i) => (
          <div
            key={action}
            className={cn("flex items-center gap-2 transition-all duration-200", fabOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}
            style={{ transitionDelay: fabOpen ? `${i * 40}ms` : "0ms" }}
          >
            <span className="bg-white text-xs font-medium text-foreground px-3 py-1.5 rounded-full whitespace-nowrap" style={{ border: "1px solid #E5E0D8", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              {label}
            </span>
            <button
              onClick={() => openFabAction(action)}
              className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all active:scale-90 bg-primary hover:opacity-90"
            >
              <Icon className="w-4.5 h-4.5" />
            </button>
          </div>
        ))}

        {/* Main FAB */}
        <button
          onClick={() => setFabOpen((v) => !v)}
          className={cn(
            "w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95",
            fabOpen && "rotate-45"
          )}
          aria-label="Health actions"
        >
          {fabOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>

        {fabOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setFabOpen(false)} />}
      </div>
    </div>
  );
}

/* ─── BottomModal ─────────────────────────────────────── */
function BottomModal({ open, onClose, title, sub, children }: {
  open: boolean; onClose: () => void; title: string; sub: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-card w-full max-w-md p-6 space-y-4" style={{ borderRadius: "28px 28px 0 0", border: "1px solid #E5E0D8" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
        <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
      </div>
    </div>
  );
}

/* ─── ProgressRing ───────────────────────────────────── */
function ProgressRing({ pct, color, label, value, unit, size = 88 }: {
  pct: number; color: string; label: string; value: string; unit: string; size?: number;
}) {
  const r    = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - Math.min(1, pct / 100));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0EDE7" strokeWidth={7}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: "hsl(var(--foreground))", lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 8.5, color: "#9C8B7A", lineHeight: 1 }}>{unit}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ─── StatCard ───────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, unit }: { icon: React.ElementType; label: string; value: string; unit: string }) {
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

/* ─── EmptyState ─────────────────────────────────────── */
function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="text-center py-10">
      <div className="w-14 h-14 rounded-3xl bg-accent mx-auto flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
