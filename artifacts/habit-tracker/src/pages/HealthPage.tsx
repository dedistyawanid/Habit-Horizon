import { useState, useMemo, useEffect } from "react";
import {
  Scale, Dumbbell, Activity, Trash2, Check, Plus, MapPin, Timer,
  Wind, Heart, Zap, TrendingUp, Mountain, Navigation2, Utensils,
  Flame, X, Beef, Wheat, Target, Pencil, Settings2, Moon, Star,
  AlarmClock, BedDouble, TrendingDown, Calendar,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, ReferenceLine,
  BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNutritionLog } from "@/hooks/useNutritionLog";
import { useSleepLog } from "@/hooks/useSleepLog";

/* ─── Constants ──────────────────────────────────────── */
const PRIMARY_TYPES = [
  { id: "Running",   label: "Running",   icon: Wind,    color: "#5c7c6c" },
  { id: "Badminton", label: "Badminton", icon: Activity, color: "#B8860B" },
  { id: "Workout",   label: "Workout",   icon: Dumbbell, color: "#4A4A4A" },
];
const OTHER_TYPE = { id: "Other", label: "Other", icon: Zap, color: "#9C8B7A" };
const ALL_TYPES  = [...PRIMARY_TYPES, OTHER_TYPE];

const EXERCISE_KEYWORDS = [
  "exercise","workout","sport","gym","run","running",
  "fitness","badminton","olahraga","lari","training","activity",
];

type SubTab = "activity" | "nutrition" | "body" | "sleep";
type Period  = "day" | "week" | "month";
type ActRange = "7d" | "30d" | "month" | "custom";

const SLEEP_KEYWORDS = [
  "sleep","tidur","rest","istirahat","malam","night","bed",
];

function getTypeInfo(type: string) { return ALL_TYPES.find((t) => t.id === type) ?? OTHER_TYPE; }

/** Returns current date as YYYY-MM-DD in the device's LOCAL timezone.
 *  Never use .toISOString() which returns UTC and shifts the date for UTC+7 users. */
function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ─── Period helpers ─────────────────────────────────── */
function localStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getPeriodRange(period: Period) {
  const today  = new Date();
  const todayK = localStr(today);
  if (period === "day") return { start: todayK, end: todayK };
  if (period === "week") {
    const day = today.getDay();
    const mon = new Date(today); mon.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
    const sun = new Date(mon);   sun.setDate(mon.getDate() + 6);
    return { start: localStr(mon), end: localStr(sun) };
  }
  const s = new Date(today.getFullYear(), today.getMonth(), 1);
  const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: localStr(s), end: localStr(e) };
}
function filterByPeriod<T extends { date: string }>(items: T[], period: Period) {
  const { start, end } = getPeriodRange(period);
  return items.filter((e) => e.date >= start && e.date <= end);
}

function getActivityRange(range: ActRange, customStart: string, customEnd: string): { start: string; end: string } {
  const today = new Date();
  const todayK = localStr(today);
  if (range === "7d") {
    const s = new Date(today); s.setDate(today.getDate() - 6);
    return { start: localStr(s), end: todayK };
  }
  if (range === "30d") {
    const s = new Date(today); s.setDate(today.getDate() - 29);
    return { start: localStr(s), end: todayK };
  }
  if (range === "month") {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: localStr(s), end: localStr(e) };
  }
  return { start: customStart || todayK, end: customEnd || todayK };
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
  const { entries: nutritionLog, targets, addEntry: addMeal, deleteEntry: deleteMeal, updateTargets } = useNutritionLog();
  const { entries: sleepLog, targetHours: sleepTarget, addEntry: addSleep, deleteEntry: deleteSleep, setTargetHours: setSleepTarget } = useSleepLog();
  const { toast } = useToast();

  /* UI state */
  const [subTab, setSubTab]       = useState<SubTab>("activity");
  const [period, setPeriod]       = useState<Period>("month");
  const [actRange, setActRange]   = useState<ActRange>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd,   setCustomEnd]   = useState("");
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
  const [actLocation, setActLocation] = useState("");
  const [actDate,     setActDate]     = useState(() => localToday());

  /* Meal form */
  const [mealName,  setMealName]  = useState("");
  const [mealCal,   setMealCal]   = useState("");
  const [mealProt,  setMealProt]  = useState("");
  const [mealCarbs, setMealCarbs] = useState("");
  const [mealDate,  setMealDate]  = useState(() => localToday());

  /* Weight form */
  const [weightInput, setWeightInput] = useState("");
  const [weightDate,  setWeightDate]  = useState(() => localToday());

  /* Sleep form */
  const [sleepHoursInput, setSleepHoursInput]   = useState("");
  const [sleepDate,       setSleepDate]         = useState(() => localToday());
  const [sleepMinsInput,  setSleepMinsInput]    = useState("");
  const [sleepQuality, setSleepQuality]         = useState<1|2|3|4|5>(3);
  const [showSleepTarget, setShowSleepTarget]   = useState(false);
  const [sleepTargetInput, setSleepTargetInput] = useState("");

  /* Sleep chart range */
  const [sleepRange, setSleepRange]           = useState<ActRange>("30d");
  const [sleepCustomStart, setSleepCustomStart] = useState("");
  const [sleepCustomEnd,   setSleepCustomEnd]   = useState("");

  /* Goal weight — localStorage-persisted */
  const [goalWeight, setGoalWeight] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("dedi_goal_weight")); return v > 0 ? v : 60; }
    catch { return 60; }
  });
  useEffect(() => { localStorage.setItem("dedi_goal_weight", String(goalWeight)); }, [goalWeight]);

  /* Goal weight modal */
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput]         = useState("");

  /* Nutrition targets modal */
  const [showNutrTargets, setShowNutrTargets]   = useState(false);
  const [nutrCalGoal,  setNutrCalGoal]          = useState("");
  const [nutrProtGoal, setNutrProtGoal]         = useState("");
  const [nutrCarbsGoal, setNutrCarbsGoal]       = useState("");

  const todayKey = localToday();

  /* ── Derived: Activity ── */
  const filteredAct = useMemo(() => {
    const { start, end } = getActivityRange(actRange, customStart, customEnd);
    return activityLog.filter((e) => e.date >= start && e.date <= end);
  }, [activityLog, actRange, customStart, customEnd]);

  const stats = useMemo(() => ({
    sessions:     filteredAct.length,
    distance:     filteredAct.reduce((s, e) => s + (e.distanceKm ?? 0), 0),
    minutes:      filteredAct.reduce((s, e) => s + (e.durationMin ?? 0), 0),
    elevation:    filteredAct.reduce((s, e) => s + (e.elevationGain ?? 0), 0),
    longestRun:   filteredAct.filter((e) => e.type === "Running" && e.distanceKm != null).reduce((m, e) => Math.max(m, e.distanceKm!), 0),
  }), [filteredAct]);

  const donutData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAct.forEach((e) => { counts[e.type] = (counts[e.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count, color: getTypeInfo(type).color }));
  }, [filteredAct]);

  const actChartData = useMemo(() => {
    /* Running distance chart — falls back to duration when distanceKm is unavailable */
    const runEntries = filteredAct.filter((e) => e.type === "Running");
    const hasDistance = runEntries.some((e) => (e.distanceKm ?? 0) > 0);
    const map: Record<string, { km: number; min: number }> = {};
    runEntries.forEach((e) => {
      if (!map[e.date]) map[e.date] = { km: 0, min: 0 };
      map[e.date].km  += e.distanceKm  ?? 0;
      map[e.date].min += e.durationMin ?? 0;
    });
    return Object.entries(map).sort().map(([date, v]) => ({
      date,
      km:  +v.km.toFixed(2),
      min: v.min,
      hasDistance,
    }));
  }, [filteredAct]);

  /* Any-activity chart (sessions per day — shown when no running data) */
  const sessionChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAct.forEach((e) => { map[e.date] = (map[e.date] ?? 0) + 1; });
    return Object.entries(map).sort().map(([date, count]) => ({ date, count }));
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
    [...weightLog].slice(-20).map((e) => ({ date: e.date, weight: e.weight, goal: goalWeight })),
    [weightLog, goalWeight]
  );
  const firstWeight = weightLog.length > 0 ? weightLog[0].weight : null;
  const goalProgress = useMemo(() => {
    if (latestWeight === null || firstWeight === null || firstWeight === goalWeight) return 0;
    const total = Math.abs(firstWeight - goalWeight);
    const done  = Math.abs(firstWeight - latestWeight);
    return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
  }, [latestWeight, firstWeight, goalWeight]);

  /* ── Derived: Sleep ── */
  const filteredSleep = useMemo(() => {
    const { start, end } = getActivityRange(sleepRange, sleepCustomStart, sleepCustomEnd);
    return sleepLog.filter((e) => e.date >= start && e.date <= end);
  }, [sleepLog, sleepRange, sleepCustomStart, sleepCustomEnd]);

  const sleepChartData = useMemo(() => {
    const map: Record<string, { hours: number; quality: number; count: number }> = {};
    filteredSleep.forEach((e) => {
      const h = e.hours + e.minutes / 60;
      if (!map[e.date]) map[e.date] = { hours: 0, quality: 0, count: 0 };
      map[e.date].hours   += h;
      map[e.date].quality += e.quality;
      map[e.date].count   += 1;
    });
    return Object.entries(map).sort().map(([date, v]) => ({
      date,
      hours:   +v.hours.toFixed(2),
      quality: +(v.quality / v.count).toFixed(1),
    }));
  }, [filteredSleep]);

  const todaySleep   = useMemo(() => sleepLog.find((e) => e.date === todayKey) ?? null, [sleepLog, todayKey]);
  const weekSleepAvg = useMemo(() => {
    const weekRange = getPeriodRange("week");
    const weekEntries = sleepLog.filter((e) => e.date >= weekRange.start && e.date <= weekRange.end);
    if (weekEntries.length === 0) return null;
    const total = weekEntries.reduce((s, e) => s + e.hours + e.minutes / 60, 0);
    return +(total / weekEntries.length).toFixed(2);
  }, [sleepLog]);

  /* ─── Handlers ─── */
  function handleLogSleep() {
    const h = parseInt(sleepHoursInput) || 0;
    const m = parseInt(sleepMinsInput)  || 0;
    if (h === 0 && m === 0) {
      toast({ title: "Duration required", variant: "destructive" }); return;
    }
    addSleep({ date: sleepDate, hours: h, minutes: m, quality: sleepQuality });
    const hits = habitsWithStats.filter((hab) => SLEEP_KEYWORDS.some((kw) => hab.name.toLowerCase().includes(kw)));
    let auto = 0;
    hits.forEach((hab) => { if (!isCheckedInToday(hab.id)) { toggleCheckIn(hab.id); auto++; } });
    setSleepHoursInput(""); setSleepMinsInput(""); setSleepQuality(3);
    toast({ title: "Sleep logged!", description: auto > 0 ? `${auto} habit${auto > 1 ? "s" : ""} auto-checked ✓` : `${h}h ${m > 0 ? m + "m" : ""} recorded.` });
  }

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
      date: actDate, type: actType, durationMin: dur,
      distanceKm:    actType === "Running" ? parseFloat(distance)  : undefined,
      elevationGain: actType === "Running" && elevation ? parseFloat(elevation) : undefined,
      runType:       actType === "Running" ? runType : undefined,
      location:      actLocation.trim() || undefined,
    });
    const hits = habitsWithStats.filter((h) => EXERCISE_KEYWORDS.some((kw) => h.name.toLowerCase().includes(kw)));
    let auto = 0;
    hits.forEach((h) => { if (!isCheckedInToday(h.id)) { toggleCheckIn(h.id); auto++; } });
    setDuration(""); setDistance(""); setElevation(""); setActLocation("");
    setShowActivity(false);
    toast({ title: "Activity logged!", description: auto > 0 ? `${auto} habit${auto > 1 ? "s" : ""} auto-checked ✓` : `${actType} saved.` });
  }

  function handleLogMeal() {
    const cal  = parseFloat(mealCal);
    const prot = parseFloat(mealProt);
    const carbs = parseFloat(mealCarbs);
    if (!mealName.trim()) { toast({ title: "Meal name required", variant: "destructive" }); return; }
    if (isNaN(cal) || cal < 0) { toast({ title: "Invalid calories", variant: "destructive" }); return; }
    addMeal({ date: mealDate, name: mealName.trim(), calories: cal, protein: isNaN(prot) ? 0 : prot, carbs: isNaN(carbs) ? 0 : carbs });
    setMealName(""); setMealCal(""); setMealProt(""); setMealCarbs("");
    setMealDate(todayKey);
    setShowMeal(false);
    toast({ title: "Meal logged!", description: `${mealName.trim()} — ${cal} kcal` });
  }

  function handleLogWeight() {
    const val = parseFloat(weightInput.trim());
    if (isNaN(val) || val <= 0 || val > 500) {
      toast({ title: "Invalid weight", variant: "destructive" }); return;
    }
    addWeightEntry(val, undefined, weightDate);
    setWeightInput("");
    setShowWeight(false);
    const isToday = weightDate === localToday();
    toast({ title: "Weight logged", description: `${val} kg recorded for ${isToday ? "today" : weightDate}.` });
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
            <p className="text-xs text-muted-foreground mt-1">Activity · Nutrition · Body · Sleep</p>
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
          <div className="flex gap-1.5">
            {([
              { id: "activity",  label: "Activity",  icon: Activity  },
              { id: "nutrition", label: "Nutrition",  icon: Utensils  },
              { id: "body",      label: "Body",       icon: Scale     },
              { id: "sleep",     label: "Sleep",      icon: Moon      },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSubTab(id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
                  subTab === id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent text-accent-foreground border-accent hover:text-primary"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Period filter — actRange for Activity tab, shared period for others */}
          <div style={{ marginTop: 20 }}>
            {subTab === "activity" ? (
              <>
                <div className="flex justify-end">
                  <div
                    className="period-toggle-wrap"
                    style={{ borderRadius: 28, padding: 3, height: 32, width: 252 }}
                  >
                    <div
                      className="period-toggle-thumb"
                      style={{
                        top: 3, bottom: 3, left: 3,
                        width: "calc(25% - 1.5px)",
                        transform: `translateX(calc(${["7d","30d","month","custom"].indexOf(actRange)} * 100%))`,
                        transition: "transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)",
                      }}
                    />
                    {(["7d","30d","month","custom"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setActRange(r)}
                        className={cn("period-toggle-btn", actRange === r && "is-active")}
                        style={{ fontSize: 11 }}
                      >
                        {r === "7d" ? "7D" : r === "30d" ? "30D" : r === "month" ? "Month" : "Custom"}
                      </button>
                    ))}
                  </div>
                </div>
                {actRange === "custom" && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 date-range-input"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">→</span>
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 date-range-input"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-end">
                <div
                  className="period-toggle-wrap"
                  style={{ borderRadius: 28, padding: 3, height: 32, width: 192 }}
                >
                  <div
                    className="period-toggle-thumb"
                    style={{
                      top: 3, bottom: 3, left: 3,
                      width: "calc(33.333% - 2px)",
                      transform: `translateX(calc(${["day","week","month"].indexOf(period)} * 100%))`,
                      transition: "transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)",
                    }}
                  />
                  {(["day", "week", "month"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={cn("period-toggle-btn", period === p && "is-active")}
                      style={{ fontSize: 12 }}
                    >
                      {p === "day" ? "Today" : p === "week" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ ACTIVITY TAB ══════════════ */}
        {subTab === "activity" && (
          <div className="space-y-4">

            {/* Summary stats row — shown in 30D / Month view */}
            {(actRange === "30d" || actRange === "month") && filteredAct.length > 0 && (
              <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <p className="text-xs font-black text-foreground">{stats.distance.toFixed(1)} km</p>
                    <p className="text-[9px] text-muted-foreground">Total distance</p>
                  </div>
                </div>
                {stats.elevation > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-primary" />
                    <div>
                      <p className="text-xs font-black text-foreground">{Math.round(stats.elevation)} m</p>
                      <p className="text-[9px] text-muted-foreground">Elevation gain</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                  <div>
                    <p className="text-xs font-black text-foreground">
                      {stats.minutes >= 60 ? `${(stats.minutes / 60).toFixed(1)}h` : `${stats.minutes}m`}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Active time</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity trend chart */}
            <div className="bg-white dark:bg-card p-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              {actChartData.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                    {actChartData[0]?.hasDistance ? "Running Distance (km)" : "Running Duration (min)"}
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={actChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#5c7c6c" stopOpacity={0.20} />
                          <stop offset="95%" stopColor="#5c7c6c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickFormatter={fmtDate}
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.max(0, Math.ceil(actChartData.length / 6) - 1)}
                      />
                      <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: number, name: string) =>
                          name === "km"
                            ? [`${v} km`, "Distance"]
                            : [`${v} min`, "Duration"]
                        }
                        labelFormatter={fmtDate}
                      />
                      <Area
                        type="monotone"
                        dataKey={actChartData[0]?.hasDistance ? "km" : "min"}
                        stroke="#5c7c6c" strokeWidth={2}
                        fill="url(#actGrad)"
                        dot={{ r: actChartData.length > 15 ? 2 : 3, fill: "#5c7c6c", strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: "#5c7c6c", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ) : sessionChartData.length > 0 ? (
                <>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Activity Sessions</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={sessionChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, "Sessions"]} labelFormatter={fmtDate} />
                      <Bar dataKey="count" fill="#5c7c6c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-[130px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Log activities to see your trend</p>
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

              {/* Date selector */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[hsl(34_8%_16%)] rounded-xl px-3 py-2 border border-gray-100 dark:border-[hsl(34_8%_22%)]">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={actDate}
                  max={todayKey}
                  onChange={(e) => setActDate(e.target.value)}
                  className="flex-1 text-xs bg-transparent border-none outline-none text-foreground"
                />
                {actDate !== todayKey && (
                  <button
                    onClick={() => setActDate(todayKey)}
                    className="text-[10px] font-medium text-primary hover:underline shrink-0"
                  >
                    Today
                  </button>
                )}
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

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Location (e.g. Jakarta, Sentul) — optional"
                  value={actLocation}
                  onChange={(e) => setActLocation(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

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
                  {[...activityLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15).map((entry) => {
                    const info = getTypeInfo(entry.type);
                    const Icon = info.icon;
                    const metricPrimary   = entry.type === "Running" && entry.distanceKm != null ? `${entry.distanceKm} km` : `${entry.durationMin ?? "—"} min`;
                    const metricSecondary = [
                      entry.type === "Running" && entry.durationMin ? `${entry.durationMin} min` : null,
                      entry.runType,
                      entry.elevationGain ? `↑${entry.elevationGain}m` : null,
                      entry.location || null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div key={entry.id} className="flex items-center gap-3 bg-white dark:bg-card px-4 py-3 transition-transform active:scale-[0.98]" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
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
                          <button onClick={() => deleteActivityEntry(entry.id)} className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 active:text-red-500 transition-colors">
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
              {/* Date selector */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[hsl(34_8%_16%)] rounded-xl px-3 py-2 border border-gray-100 dark:border-[hsl(34_8%_22%)]">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={mealDate}
                  max={todayKey}
                  onChange={(e) => setMealDate(e.target.value)}
                  className="flex-1 text-xs bg-transparent border-none outline-none text-foreground"
                />
                {mealDate !== todayKey && (
                  <button
                    onClick={() => setMealDate(todayKey)}
                    className="text-[10px] font-medium text-primary hover:underline shrink-0"
                  >
                    Today
                  </button>
                )}
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Today's Targets</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                </div>
                <button
                  onClick={() => { setNutrCalGoal(String(targets.calories)); setNutrProtGoal(String(targets.protein)); setNutrCarbsGoal(String(targets.carbs)); setShowNutrTargets(true); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-all"
                >
                  <Settings2 className="w-3 h-3" /> Edit targets
                </button>
              </div>
              <div className="flex justify-around items-start">
                <ProgressRing pct={calPct}   color="hsl(var(--primary))" label="Calories" value={todayCal.toString()}   unit="kcal" size={96} />
                <ProgressRing pct={protPct}  color="#c49a3c"              label="Protein"  value={`${todayProt}g`}       unit={`/ ${targets.protein}g`} size={96} />
                <ProgressRing pct={carbsPct} color="#7a9e8e"              label="Carbs"    value={`${todayCarbs}g`}      unit={`/ ${targets.carbs}g`}   size={96} />
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
              {nutrChartData.length >= 1 ? (
                <ResponsiveContainer width="100%" height={130}>
                  <ComposedChart data={nutrChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#5c7c6c" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#5c7c6c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number, name: string) =>
                        name === "caloriesNorm" ? [`${Math.round(v * 100)} kcal`, "Calories"] : [`${v}g`, "Protein"]
                      }
                      labelFormatter={fmtDate}
                    />
                    <Area type="monotone" dataKey="caloriesNorm" stroke="#5c7c6c" strokeWidth={1.5} fill="url(#calGrad)"
                      dot={{ r: 3, fill: "#5c7c6c", strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: "#5c7c6c", strokeWidth: 0 }}
                    />
                    <Line type="monotone" dataKey="protein" stroke="#B8860B" strokeWidth={2}
                      dot={{ r: 3, fill: "#B8860B", strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: "#B8860B", strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[130px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Log your first meal to see the nutrition chart</p>
                </div>
              )}
            </div>

            {/* All meals — sorted newest first */}
            {nutritionLog.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">All Meals</p>
                {[...nutritionLog]
                  .sort((a, b) => {
                    const dateDiff = b.date.localeCompare(a.date);
                    if (dateDiff !== 0) return dateDiff;
                    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
                  })
                  .slice(0, 20)
                  .map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3 bg-white dark:bg-card px-4 py-3 transition-transform active:scale-[0.98]" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(meal.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <button onClick={() => deleteMeal(meal.id)} className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 active:text-red-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Utensils} title="No meals logged yet" sub="Use the form above to log your first meal" />
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
                <button
                  onClick={() => { setGoalInput(String(goalWeight)); setShowGoalModal(true); }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-all"
                >
                  Goal: {goalWeight} kg <Pencil className="w-3 h-3" />
                </button>
              </div>
              {/* Date selector */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[hsl(34_8%_16%)] rounded-xl px-3 py-2 border border-gray-100 dark:border-[hsl(34_8%_22%)]">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={weightDate}
                  max={todayKey}
                  onChange={(e) => setWeightDate(e.target.value)}
                  className="flex-1 text-xs bg-transparent border-none outline-none text-foreground"
                />
                {weightDate !== todayKey && (
                  <button
                    onClick={() => setWeightDate(todayKey)}
                    className="text-[10px] font-medium text-primary hover:underline shrink-0"
                  >
                    Today
                  </button>
                )}
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
                  {latestWeight === goalWeight ? "🎯 Goal reached!" : `${Math.abs(latestWeight - goalWeight).toFixed(1)} kg ${latestWeight > goalWeight ? "to lose" : "to gain"}`}
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
                        <stop offset="5%"  stopColor="#5c7c6c" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#5c7c6c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={axisTick} tickLine={false} axisLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={axisTick} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => name === "weight" ? [`${v} kg`, "Weight"] : [`${v} kg`, "Goal"]} labelFormatter={fmtDate} />
                    <ReferenceLine y={goalWeight} stroke="#E2725B" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: `${goalWeight}kg goal`, position: "insideTopRight", fontSize: 9, fill: "#E2725B" }} />
                    <Area type="monotone" dataKey="weight" stroke="#5c7c6c" strokeWidth={2} fill="url(#bodyGrad)" dot={false} activeDot={{ r: 4, fill: "#5c7c6c", strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[140px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Log your weight to see your progress chart</p>
                </div>
              )}
            </div>

            {/* Goal progress bar */}
            {latestWeight !== null && firstWeight !== null && (
              <div className="bg-white dark:bg-card px-5 py-4 space-y-3" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-foreground">Goal: {goalWeight} kg</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">{goalProgress}%</span>
                    <button
                      onClick={() => { setGoalInput(String(goalWeight)); setShowGoalModal(true); }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${goalProgress}%`, background: "hsl(var(--primary))" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Start: {firstWeight} kg</span>
                  <span>
                    {latestWeight === goalWeight ? "🎯 Goal reached!" :
                      `${Math.abs(latestWeight - goalWeight).toFixed(1)} kg ${latestWeight > goalWeight ? "to lose" : "to gain"}`}
                  </span>
                </div>
              </div>
            )}

            {/* Weight history */}
            {weightLog.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Weight History</p>
                {[...weightLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-card transition-transform active:scale-[0.98]" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                        <Scale className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{entry.weight} kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <button onClick={() => deleteWeightEntry(entry.id)} className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 active:text-red-500 transition-colors">
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

        {/* ══════════════ SLEEP TAB ══════════════ */}
        {subTab === "sleep" && (
          <div className="space-y-4">

            {/* ─── Quick Log Form ─── */}
            <div className="bg-white dark:bg-card p-5 space-y-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" style={{ color: "#5c7c6c" }} />
                  <p className="text-sm font-bold text-foreground">Log Sleep</p>
                </div>
                <button
                  onClick={() => { setSleepTargetInput(String(sleepTarget)); setShowSleepTarget(true); }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-all"
                >
                  Target: {sleepTarget}h <Pencil className="w-3 h-3" />
                </button>
              </div>

              {/* Date selector */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-[hsl(34_8%_16%)] rounded-xl px-3 py-2 border border-gray-100 dark:border-[hsl(34_8%_22%)]">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={sleepDate}
                  max={todayKey}
                  onChange={(e) => setSleepDate(e.target.value)}
                  className="flex-1 text-xs bg-transparent border-none outline-none text-foreground"
                />
                {sleepDate !== todayKey && (
                  <button
                    onClick={() => setSleepDate(todayKey)}
                    className="text-[10px] font-medium text-primary hover:underline shrink-0"
                  >
                    Today
                  </button>
                )}
              </div>

              {/* Duration inputs */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Duration</p>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number" placeholder="Hours" value={sleepHoursInput}
                      onChange={(e) => setSleepHoursInput(e.target.value)}
                      className="pl-9 text-sm" min="0" max="24"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">:</span>
                  <div className="relative flex-1">
                    <AlarmClock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number" placeholder="Min" value={sleepMinsInput}
                      onChange={(e) => setSleepMinsInput(e.target.value)}
                      className="pl-9 text-sm" min="0" max="59"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {(() => {
                      const h = parseInt(sleepHoursInput) || 0;
                      const m = parseInt(sleepMinsInput)  || 0;
                      return h || m ? `= ${h}h ${m}m` : "";
                    })()}
                  </span>
                </div>
              </div>

              {/* Quality stars */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quality</p>
                <div className="flex items-center gap-1">
                  {([1,2,3,4,5] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSleepQuality(s)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        className="w-7 h-7 transition-colors"
                        style={{
                          fill: s <= sleepQuality ? "#5c7c6c" : "transparent",
                          color: s <= sleepQuality ? "#5c7c6c" : "#D1CBC2",
                          strokeWidth: 1.5,
                        }}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {["", "Poor", "Fair", "OK", "Good", "Great"][sleepQuality]}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleLogSleep}
                className="w-full gap-1.5"
                style={{ background: "#5c7c6c" }}
              >
                <Moon className="w-4 h-4" /> Log Sleep
              </Button>
              {todaySleep && (
                <p className="text-[10px] text-muted-foreground text-center -mt-1">
                  Today already logged: <span className="font-semibold" style={{ color: "#5c7c6c" }}>{todaySleep.hours}h {todaySleep.minutes > 0 ? `${todaySleep.minutes}m` : ""}</span> — tap Log to overwrite
                </p>
              )}
            </div>

            {/* ─── Sleep Debt Card ─── */}
            {weekSleepAvg !== null && (
              <div
                className="p-4 space-y-2"
                style={{
                  borderRadius: 28, border: "1px solid #E5E0D8",
                  background: weekSleepAvg >= sleepTarget ? "#F0F4EC" : weekSleepAvg >= sleepTarget * 0.8 ? "#FDF8E8" : "#FDF2F0",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {weekSleepAvg >= sleepTarget
                      ? <Check className="w-4 h-4 text-primary" />
                      : <TrendingDown className="w-4 h-4" style={{ color: weekSleepAvg >= sleepTarget * 0.8 ? "#B8860B" : "#E2725B" }} />
                    }
                    <p className="text-sm font-bold text-foreground">Weekly Sleep Debt</p>
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{ color: weekSleepAvg >= sleepTarget ? "#5c7c6c" : weekSleepAvg >= sleepTarget * 0.8 ? "#B8860B" : "#E2725B" }}
                  >
                    avg {weekSleepAvg.toFixed(1)}h / {sleepTarget}h
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E0D8" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (weekSleepAvg / sleepTarget) * 100)}%`,
                      background: weekSleepAvg >= sleepTarget ? "#5c7c6c" : weekSleepAvg >= sleepTarget * 0.8 ? "#B8860B" : "#E2725B",
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {weekSleepAvg >= sleepTarget
                    ? "You're hitting your sleep target this week 🎉"
                    : `You're averaging ${(sleepTarget - weekSleepAvg).toFixed(1)}h short of your ${sleepTarget}h target`}
                </p>
              </div>
            )}

            {/* ─── Sleep Trend Chart ─── */}
            <div className="bg-white dark:bg-card p-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}>
              {/* Header row: title + range selector */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Sleep Trend</p>
                <div
                  className="period-toggle-wrap"
                  style={{ borderRadius: 28, padding: 3, height: 30, width: 220 }}
                >
                  <div
                    className="period-toggle-thumb"
                    style={{
                      top: 3, bottom: 3, left: 3,
                      width: "calc(25% - 1.5px)",
                      transform: `translateX(calc(${["7d","30d","month","custom"].indexOf(sleepRange)} * 100%))`,
                      transition: "transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1)",
                    }}
                  />
                  {(["7d","30d","month","custom"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSleepRange(r)}
                      className={cn("period-toggle-btn", sleepRange === r && "is-active")}
                      style={{ fontSize: 10 }}
                    >
                      {r === "7d" ? "7D" : r === "30d" ? "30D" : r === "month" ? "Month" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom date range inputs */}
              {sleepRange === "custom" && (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="date"
                    value={sleepCustomStart}
                    onChange={(e) => setSleepCustomStart(e.target.value)}
                    className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 date-range-input"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">→</span>
                  <input
                    type="date"
                    value={sleepCustomEnd}
                    min={sleepCustomStart}
                    onChange={(e) => setSleepCustomEnd(e.target.value)}
                    className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 date-range-input"
                  />
                </div>
              )}

              {/* Chart */}
              {sleepChartData.length >= 1 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={sleepChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#5c7c6c" stopOpacity={0.20} />
                        <stop offset="95%" stopColor="#5c7c6c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={fmtDate}
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
                      interval={Math.max(0, Math.ceil(sleepChartData.length / 6) - 1)}
                    />
                    <YAxis
                      domain={[0, Math.max(10, sleepTarget + 2)]}
                      tick={axisTick}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={fmtDate}
                      formatter={(value: number, name: string) => {
                        if (name === "hours")   return [`${value.toFixed(1)}h`, "Hours slept"];
                        if (name === "quality") return [
                          `${value.toFixed(1)} / 5 · ${["","Poor","Fair","OK","Good","Great"][Math.round(value)] ?? ""}`,
                          "Quality"
                        ];
                        return [value, name];
                      }}
                    />
                    <ReferenceLine
                      y={sleepTarget}
                      stroke="#E2725B"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{ value: `${sleepTarget}h target`, position: "insideTopRight", fontSize: 9, fill: "#E2725B" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#5c7c6c"
                      strokeWidth={2}
                      fill="url(#sleepGrad)"
                      dot={{ r: sleepChartData.length > 15 ? 2 : 3, fill: "#5c7c6c", strokeWidth: 0 }}
                      activeDot={{ r: 4, fill: "#5c7c6c", strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="quality"
                      stroke="#B8860B"
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                      fill="none"
                      dot={false}
                      activeDot={{ r: 3, fill: "#B8860B", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[150px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Log sleep to see your trend</p>
                </div>
              )}

              {/* Legend */}
              {sleepChartData.length >= 1 && (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: "#5c7c6c" }} />
                    <span className="text-[10px] text-muted-foreground">Hours slept</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px border-t border-dashed" style={{ borderColor: "#B8860B" }} />
                    <span className="text-[10px] text-muted-foreground">Quality (1–5)</span>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Sleep History ─── */}
            {sleepLog.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Sleep History</p>
                {[...sleepLog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14).map((entry) => {
                  const totalH = entry.hours + entry.minutes / 60;
                  const onTarget = totalH >= sleepTarget;
                  return (
                    <div key={entry.id} className="flex items-center gap-3 bg-white dark:bg-card px-4 py-3 transition-transform active:scale-[0.98]" style={{ borderRadius: 20, border: "1px solid #E5E0D8" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#5c7c6c10" }}>
                        <Moon className="w-4 h-4" style={{ color: "#5c7c6c" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{entry.hours}h {entry.minutes > 0 ? `${entry.minutes}m` : ""}</p>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md", onTarget ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground")}>
                            {onTarget ? "On target" : `${(sleepTarget - totalH).toFixed(1)}h short`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {([1,2,3,4,5] as const).map((s) => (
                            <Star key={s} className="w-3 h-3" style={{ fill: s <= entry.quality ? "#5c7c6c" : "transparent", color: s <= entry.quality ? "#5c7c6c" : "#D1CBC2", strokeWidth: 1.5 }} />
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">{["","Poor","Fair","OK","Good","Great"][entry.quality]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <button onClick={() => deleteSleep(entry.id)} className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded text-muted-foreground/40 hover:text-red-400 active:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Moon} title="No sleep logged yet" sub="Use the form above to log your first night" />
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

      {/* Sleep Target Modal */}
      {showSleepTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSleepTarget(false)}
        >
          <div className="w-full max-w-sm bg-white p-6 space-y-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-base font-bold text-foreground">Sleep Target</p>
              <p className="text-xs text-muted-foreground mt-0.5">Set your nightly sleep goal (default: 8h)</p>
            </div>
            <div className="relative">
              <Moon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number" placeholder={`Current target: ${sleepTarget}h`}
                value={sleepTargetInput} onChange={(e) => setSleepTargetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseFloat(sleepTargetInput);
                    if (!isNaN(v) && v >= 1 && v <= 24) { setSleepTarget(v); setShowSleepTarget(false); toast({ title: "Target updated", description: `Sleep goal: ${v} hours` }); }
                  }
                }}
                className="pl-10 text-sm" step="0.5" min="1" max="24" autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSleepTarget(false)} className="flex-1">Cancel</Button>
              <Button
                className="flex-1 gap-1.5"
                style={{ background: "#5c7c6c" }}
                onClick={() => {
                  const v = parseFloat(sleepTargetInput);
                  if (!isNaN(v) && v >= 1 && v <= 24) { setSleepTarget(v); setShowSleepTarget(false); toast({ title: "Target updated", description: `Sleep goal: ${v} hours` }); }
                }}
              >
                <Check className="w-4 h-4" /> Save Target
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Weight Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowGoalModal(false)}
        >
          <div className="w-full max-w-sm bg-white p-6 space-y-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-base font-bold text-foreground">Edit Weight Goal</p>
              <p className="text-xs text-muted-foreground mt-0.5">Set your target weight in kg</p>
            </div>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number" placeholder={`Current goal: ${goalWeight} kg`}
                value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseFloat(goalInput);
                    if (!isNaN(v) && v > 0 && v < 500) { setGoalWeight(v); setShowGoalModal(false); toast({ title: "Goal updated", description: `New target: ${v} kg` }); }
                  }
                }}
                className="pl-10 text-sm" step="0.5" min="30" max="300" autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowGoalModal(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={() => {
                const v = parseFloat(goalInput);
                if (!isNaN(v) && v > 0 && v < 500) { setGoalWeight(v); setShowGoalModal(false); toast({ title: "Goal updated", description: `New target: ${v} kg` }); }
              }}>
                <Check className="w-4 h-4" /> Save Goal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Targets Modal */}
      {showNutrTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.28)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowNutrTargets(false)}
        >
          <div className="w-full max-w-sm bg-white p-6 space-y-4" style={{ borderRadius: 28, border: "1px solid #E5E0D8" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-base font-bold text-foreground">Daily Nutrition Goals</p>
              <p className="text-xs text-muted-foreground mt-0.5">Set your daily macro targets</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Daily Calories (kcal)</label>
                <div className="relative mt-1">
                  <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder={`Current: ${targets.calories} kcal`} value={nutrCalGoal} onChange={(e) => setNutrCalGoal(e.target.value)} className="pl-9 text-sm" min="500" max="10000" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Daily Protein (g)</label>
                <div className="relative mt-1">
                  <Beef className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder={`Current: ${targets.protein}g`} value={nutrProtGoal} onChange={(e) => setNutrProtGoal(e.target.value)} className="pl-9 text-sm" min="0" max="1000" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Daily Carbs (g)</label>
                <div className="relative mt-1">
                  <Wheat className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input type="number" placeholder={`Current: ${targets.carbs}g`} value={nutrCarbsGoal} onChange={(e) => setNutrCarbsGoal(e.target.value)} className="pl-9 text-sm" min="0" max="2000" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNutrTargets(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1 gap-1.5" onClick={() => {
                const cal   = parseFloat(nutrCalGoal)  || targets.calories;
                const prot  = parseFloat(nutrProtGoal) || targets.protein;
                const carbs = parseFloat(nutrCarbsGoal)|| targets.carbs;
                updateTargets({ calories: cal, protein: prot, carbs });
                setShowNutrTargets(false);
                toast({ title: "Targets updated", description: `${cal} kcal · ${prot}g protein · ${carbs}g carbs` });
              }}>
                <Check className="w-4 h-4" /> Save Targets
              </Button>
            </div>
          </div>
        </div>
      )}

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
          {/* Track — uses .ring-track class so dark mode can override via CSS */}
          <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none"
            strokeWidth={7}
            style={{ stroke: "#F0EDE7", transform: "rotate(-90deg)", transformOrigin: "center" }}
          />
          {/* Progress arc — stroke set via style so CSS custom properties resolve */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            strokeWidth={7} strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
            style={{ stroke: color, transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: "hsl(var(--foreground))", lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 8.5, color: "hsl(var(--muted-foreground))", lineHeight: 1 }}>{unit}</p>
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
