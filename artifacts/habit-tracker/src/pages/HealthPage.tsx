import { useState } from "react";
import { Scale, Dumbbell, Activity, Trash2, Check, Plus, MapPin, Timer, Wind, Heart } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const ACTIVITY_TYPES = [
  { id: "Running", label: "Running", icon: Wind, color: "#10b981" },
  { id: "Badminton", label: "Badminton", icon: Activity, color: "#3b82f6" },
  { id: "Gym", label: "Gym", icon: Dumbbell, color: "#f59e0b" },
];

const EXERCISE_KEYWORDS = [
  "exercise", "workout", "sport", "gym", "run", "running",
  "fitness", "badminton", "olahraga", "lari", "training", "activity",
];

export default function HealthPage() {
  const {
    weightLog, addWeightEntry, deleteWeightEntry, latestWeight,
    activityLog, addActivityEntry, deleteActivityEntry,
    habitsWithStats, isCheckedInToday, toggleCheckIn,
  } = useApp();
  const { toast } = useToast();

  const [weightInput, setWeightInput] = useState("");
  const [activityType, setActivityType] = useState("Running");
  const [durationMin, setDurationMin] = useState("");
  const [distanceKm, setDistanceKm] = useState("");

  const todayKey = new Date().toISOString().split("T")[0];

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
      distanceKm: activityType === "Running" ? parseFloat(distanceKm) : undefined,
    });

    const exerciseHabits = habitsWithStats.filter((h) =>
      EXERCISE_KEYWORDS.some((kw) => h.name.toLowerCase().includes(kw))
    );
    let autoChecked = 0;
    exerciseHabits.forEach((h) => {
      if (!isCheckedInToday(h.id)) {
        toggleCheckIn(h.id);
        autoChecked++;
      }
    });

    setDurationMin("");
    setDistanceKm("");
    toast({
      title: "Activity logged!",
      description: autoChecked > 0
        ? `${activityType} saved. ${autoChecked} exercise habit${autoChecked > 1 ? "s" : ""} auto-checked ✓`
        : `${activityType} logged successfully.`,
    });
  }

  const chartData = [...weightLog].slice(-7);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Health</h1>
            <p className="text-xs text-gray-400 mt-1">Track weight & activity</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* ── WEIGHT HUB ── */}
        <div className="bg-white dark:bg-gray-900 p-4 space-y-3" style={{ borderRadius: 20, boxShadow: "0 2px 14px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Weight Log</p>
            </div>
            {latestWeight !== null && (
              <span className="text-sm font-bold text-primary">{latestWeight} kg</span>
            )}
          </div>

          {chartData.length >= 2 && (
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="healthWeightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => { const dt = new Date(d); return `${dt.getMonth() + 1}/${dt.getDate()}`; }}
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, padding: "6px 10px", borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
                    formatter={(v: number) => [`${v} kg`, "Weight"]}
                    labelFormatter={(l) => new Date(l).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--color-primary)"
                    strokeWidth={1.5}
                    fill="url(#healthWeightGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter weight (kg)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogWeight(); }}
              className="text-sm flex-1"
              step="0.1"
              min="0"
            />
            <Button onClick={handleLogWeight} size="sm" className="shrink-0">
              <Check className="w-3.5 h-3.5 mr-1" /> Log
            </Button>
          </div>

          {weightLog.length > 0 && (
            <div className="space-y-1">
              {[...weightLog].reverse().slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{entry.weight} kg</span>
                    {entry.notes && <span className="text-xs text-gray-400 truncate max-w-[100px]">{entry.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <button
                      onClick={() => deleteWeightEntry(entry.id)}
                      className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
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

        {/* ── ACTIVITY LOG ── */}
        <div className="bg-white dark:bg-gray-900 p-4 space-y-3" style={{ borderRadius: 20, boxShadow: "0 2px 14px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Log Activity</p>
          </div>

          {/* Activity type buttons */}
          <div className="flex gap-2">
            {ACTIVITY_TYPES.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActivityType(id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all border-2",
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

          {/* Input fields */}
          <div className="flex gap-2">
            {activityType === "Running" && (
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  type="number"
                  placeholder="Distance (km)"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="pl-9 text-sm"
                  step="0.1"
                  min="0"
                />
              </div>
            )}
            <div className="relative flex-1">
              <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                type="number"
                placeholder="Duration (min)"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="pl-9 text-sm"
                min="1"
              />
            </div>
          </div>

          <Button onClick={handleLogActivity} className="w-full gap-1.5">
            <Plus className="w-4 h-4" />
            Log {activityType}
          </Button>

          <p className="text-[10px] text-gray-400 text-center -mt-1">
            Logging an activity will auto-check exercise habits for today
          </p>
        </div>

        {/* ── ACTIVITY HISTORY ── */}
        {activityLog.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Recent Activity
            </p>
            <div className="space-y-2">
              {activityLog.slice(0, 15).map((entry) => {
                const typeInfo = ACTIVITY_TYPES.find((t) => t.id === entry.type);
                const Icon = typeInfo?.icon ?? Activity;
                const color = typeInfo?.color ?? "#879A77";
                return (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3"
                    style={{ borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}22` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{entry.type}</p>
                      <p className="text-xs text-gray-400">
                        {entry.distanceKm != null && <span>{entry.distanceKm} km · </span>}
                        {entry.durationMin} min
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
