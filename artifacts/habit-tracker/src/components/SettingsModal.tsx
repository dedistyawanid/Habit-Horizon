import { useRef, useState, useEffect, useCallback } from "react";
import {
  Moon, Sun, Monitor, Upload, Download, Check, X,
  User, Scale, Ruler, Target, Image, Palette, LogOut,
  RefreshCw, Mail, Flame, Beef, CloudUpload, AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { DateFormat, Theme, THEME_PRESETS, AccentTheme } from "@/types/settings";
import { exportAsCSV, exportAsJSON, parseImportFile } from "@/lib/exportUtils";
import { NutritionEntry } from "@/hooks/useNutritionLog";
import { SleepEntry } from "@/hooks/useSleepLog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { upsertProfile } from "@/lib/fetchFromCloud";
import { getUserId } from "@/lib/supabase";
import { forcePushAll, type PushResult } from "@/lib/sync";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark",  label: "Dark",  icon: Moon },
  { value: "system",label: "System",icon: Monitor },
];

const DATE_FORMATS: DateFormat[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

function safeJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const {
    settings, updateSettings, updateProfile,
    habits, checkIns, notes, importData,
    transactions, financeSettings, weightLog, activityLog,
    wishlist,
  } = useApp();

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ── Health targets (local state, persisted to localStorage + Supabase) ── */
  const [targetWeight,   setTargetWeight]   = useState(() => localStorage.getItem("dedi_goal_weight") ?? "");
  const [calorieGoal,    setCalorieGoal]    = useState(() => String(safeJson<{calories?:number}>("dedi_nutrition_targets", {}).calories ?? 2500));
  const [proteinGoal,    setProteinGoal]    = useState(() => String(safeJson<{protein?:number}>("dedi_nutrition_targets", {}).protein ?? 150));
  const [carbsGoal,      setCarbsGoal]      = useState(() => String(safeJson<{carbs?:number}>("dedi_nutrition_targets", {}).carbs ?? 300));
  const [logoutConfirm,  setLogoutConfirm]  = useState(false);
  const [pushing,        setPushing]        = useState(false);
  const [pushResults,    setPushResults]    = useState<PushResult[] | null>(null);

  /* Sync health targets to localStorage + Supabase (debounced) */
  const saveHealthTargets = useCallback(() => {
    if (targetWeight) localStorage.setItem("dedi_goal_weight", targetWeight);
    const targets = {
      calories: Number(calorieGoal) || 2500,
      protein:  Number(proteinGoal) || 150,
      carbs:    Number(carbsGoal)   || 300,
    };
    localStorage.setItem("dedi_nutrition_targets", JSON.stringify(targets));
    upsertProfile({
      user_id:       getUserId(),
      target_weight: Number(targetWeight) || null,
      calorie_goal:  targets.calories,
      protein_goal:  targets.protein,
      carbs_goal:    targets.carbs,
    });
  }, [targetWeight, calorieGoal, proteinGoal, carbsGoal]);

  /* Auto-save health targets 800ms after last change */
  useEffect(() => {
    const t = setTimeout(saveHealthTargets, 800);
    return () => clearTimeout(t);
  }, [saveHealthTargets]);

  /* Auto-save theme + name (+ current avatarUrl) to Supabase when changed.
     avatarUrl is included in the JSON so theme changes never wipe the cloud avatar. */
  useEffect(() => {
    const t = setTimeout(() => {
      upsertProfile({
        user_id:          getUserId(),
        display_name:     settings.profile.fullName || null,
        theme_selection:  JSON.stringify({
          theme:       settings.theme,
          accentTheme: settings.accentTheme,
          avatarUrl:   settings.profile.avatarUrl ?? "",
        }),
      });
    }, 800);
    return () => clearTimeout(t);
  }, [settings.theme, settings.accentTheme, settings.profile.fullName]); // avatarUrl intentionally excluded (pushed immediately on change)

  /* ── Force Push to Supabase ── */
  async function handleForcePush() {
    if (pushing) return;
    setPushResults(null);
    setPushing(true);
    try {
      const results = await forcePushAll();
      setPushResults(results);
      const failed = results.filter((r) => !r.success && r.sent > 0);
      if (failed.length === 0) {
        toast({ title: "Upload complete!", description: "All data pushed to Supabase successfully." });
      } else {
        toast({ title: "Partial upload", description: `${failed.length} table(s) had errors. Check details below.` });
      }
    } finally {
      setPushing(false);
    }
  }

  /* ── Export / Import ── */
  function handleExportJSON() {
    const nutritionLog = safeJson<NutritionEntry[]>("dedi_nutrition_log", []);
    const sleepLog     = safeJson<SleepEntry[]>("dedi_sleep_log", []);
    exportAsJSON(
      habits, checkIns, notes, settings,
      transactions, financeSettings,
      weightLog, activityLog,
      nutritionLog, sleepLog, wishlist,
    );
    toast({ title: "Export complete", description: "Full backup downloaded." });
  }
  function handleExportCSV() {
    const nutritionLog = safeJson<NutritionEntry[]>("dedi_nutrition_log", []);
    const sleepLog     = safeJson<SleepEntry[]>("dedi_sleep_log", []);
    exportAsCSV(
      habits, checkIns,
      transactions, notes,
      weightLog, activityLog,
      nutritionLog, sleepLog,
      wishlist,
    );
    toast({ title: "Export complete", description: "CSV file downloaded." });
  }
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseImportFile(ev.target?.result as string);
      if (result.success && result.data) {
        importData(result.data);
        toast({ title: "Import successful", description: "Data restored from backup." });
      } else {
        toast({ title: "Import failed", description: result.message, variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  /** Compress & resize an image file to ≤ maxPx on the longest side at given quality. */
  function compressImage(file: File, maxPx = 220, quality = 0.78): Promise<string> {
    return new Promise((resolve) => {
      const img = document.createElement("img") as HTMLImageElement;
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const w = Math.round(img.width  * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = objectUrl;
    });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const avatarUrl = await compressImage(file);
    /* Update local state immediately */
    updateProfile({ avatarUrl, avatarType: "upload" });
    /* Push to Supabase right away — avatarUrl lives inside theme_selection JSON */
    upsertProfile({
      user_id:         getUserId(),
      display_name:    settings.profile.fullName || null,
      theme_selection: JSON.stringify({
        theme:       settings.theme,
        accentTheme: settings.accentTheme,
        avatarUrl,
      }),
    });
  }

  function clearAvatar() {
    updateProfile({ avatarUrl: "", avatarType: "initials" });
    /* Remove avatar from Supabase immediately */
    upsertProfile({
      user_id:         getUserId(),
      display_name:    settings.profile.fullName || null,
      theme_selection: JSON.stringify({
        theme:       settings.theme,
        accentTheme: settings.accentTheme,
        avatarUrl:   "",
      }),
    });
  }

  async function handleLogout() {
    if (!logoutConfirm) { setLogoutConfirm(true); return; }
    await signOut();
    onClose();
    setLogoutConfirm(false);
    toast({ title: "Signed out", description: "See you next time!" });
  }

  const initials = (settings.profile.fullName || "DS")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-xl w-full max-h-[90vh] overflow-y-auto border-0 bg-white/[0.92] dark:bg-[#1c1a18]/[0.92] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        style={{ borderRadius: 28, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", boxShadow: "0 32px 80px rgba(0,0,0,0.4), 0 0 0 0px transparent" }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* ── PROFILE TAB ── */}
          <TabsContent value="profile" className="space-y-5 pt-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {settings.profile.avatarUrl ? (
                  <img src={settings.profile.avatarUrl} alt={`Profile photo for ${settings.profile.fullName || "user"}`} className="w-20 h-20 rounded-2xl object-cover" loading="lazy" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-card border border-[hsl(var(--border))] rounded-lg p-1.5 shadow-sm hover:shadow-md transition-all"
                  data-testid="btn-upload-avatar"
                >
                  <Image className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Upload Photo
                </Button>
                {settings.profile.avatarUrl && (
                  <Button size="sm" variant="outline" onClick={clearAvatar}>
                    <X className="w-3.5 h-3.5 mr-1" /> Remove
                  </Button>
                )}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            {/* Basic info */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </Label>
                <Input
                  value={settings.profile.fullName}
                  onChange={(e) => updateProfile({ fullName: e.target.value })}
                  placeholder="Your full name"
                  data-testid="input-full-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                    <Scale className="w-3.5 h-3.5" /> Current Weight (kg)
                  </Label>
                  <Input
                    value={settings.profile.weight}
                    onChange={(e) => updateProfile({ weight: e.target.value })}
                    placeholder="e.g. 72" type="number"
                    data-testid="input-weight"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                    <Ruler className="w-3.5 h-3.5" /> Height (cm)
                  </Label>
                  <Input
                    value={settings.profile.height}
                    onChange={(e) => updateProfile({ height: e.target.value })}
                    placeholder="e.g. 175" type="number"
                    data-testid="input-height"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                  <Target className="w-3.5 h-3.5" /> Personal Mission / Goal
                </Label>
                <Textarea
                  value={settings.profile.mission}
                  onChange={(e) => updateProfile({ mission: e.target.value })}
                  placeholder="e.g. 1 Billion IDR 2026 Target"
                  className="resize-none min-h-[72px] text-sm"
                  data-testid="input-mission"
                />
              </div>
            </div>

            {/* ── Health & Nutrition Targets (synced to cloud) ── */}
            <div className="rounded-2xl p-4 space-y-3 bg-accent border border-[hsl(var(--border))]">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                <p className="text-sm font-semibold text-foreground">Health &amp; Nutrition Targets</p>
                <span className="text-xs text-muted-foreground ml-auto">Cloud-synced</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1 mb-1.5">
                    <Scale className="w-3 h-3" /> Target Weight (kg)
                  </Label>
                  <Input
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="e.g. 60" type="number"
                    data-testid="input-target-weight"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1 mb-1.5">
                    <Flame className="w-3 h-3" /> Daily Calories (kcal)
                  </Label>
                  <Input
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(e.target.value)}
                    placeholder="e.g. 2500" type="number"
                    data-testid="input-calorie-goal"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1 mb-1.5">
                    <Beef className="w-3 h-3" /> Protein Goal (g)
                  </Label>
                  <Input
                    value={proteinGoal}
                    onChange={(e) => setProteinGoal(e.target.value)}
                    placeholder="e.g. 150" type="number"
                    data-testid="input-protein-goal"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium flex items-center gap-1 mb-1.5">
                    <Target className="w-3 h-3" /> Carbs Goal (g)
                  </Label>
                  <Input
                    value={carbsGoal}
                    onChange={(e) => setCarbsGoal(e.target.value)}
                    placeholder="e.g. 300" type="number"
                    data-testid="input-carbs-goal"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Saved automatically · synced across all your devices</p>
            </div>
          </TabsContent>

          {/* ── APPEARANCE TAB ── */}
          <TabsContent value="appearance" className="space-y-5 pt-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Theme Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateSettings({ theme: value })}
                    data-testid={`theme-btn-${value}`}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                      settings.theme === value
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-[hsl(var(--border))] hover:border-[hsl(var(--border))]"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", settings.theme === value ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", settings.theme === value ? "text-primary" : "text-muted-foreground")}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Accent Color
              </p>
              <div className="grid grid-cols-1 gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => updateSettings({ accentTheme: preset.id as AccentTheme })}
                    data-testid={`accent-btn-${preset.id}`}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      settings.accentTheme === preset.id
                        ? "border-foreground/40 bg-accent"
                        : "border-[hsl(var(--border))] hover:border-[hsl(var(--border))]"
                    )}
                  >
                    <div className="w-8 h-8 rounded-xl shrink-0" style={{ backgroundColor: preset.previewColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </div>
                    {settings.accentTheme === preset.id && (
                      <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white dark:text-background" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Date Format</p>
              <div className="grid grid-cols-3 gap-2">
                {DATE_FORMATS.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => updateSettings({ dateFormat: fmt })}
                    data-testid={`date-format-btn-${fmt}`}
                    className={cn(
                      "p-2.5 rounded-xl border-2 text-xs font-mono transition-all",
                      settings.dateFormat === fmt
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-[hsl(var(--border))] text-muted-foreground hover:border-[hsl(var(--border))]"
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── DATA TAB ── */}
          <TabsContent value="data" className="space-y-4 pt-4">

            {/* ── Force Push to Cloud ── */}
            <div className="rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CloudUpload className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Force Upload to Cloud</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pushes everything stored on this device to Supabase right now.
                Use this if data shows "Pending" and won't auto-sync.
              </p>
              <Button
                onClick={handleForcePush}
                disabled={pushing}
                className="w-full gap-2"
                data-testid="btn-force-push"
              >
                <RefreshCw className={`w-4 h-4${pushing ? " animate-spin" : ""}`} />
                {pushing ? "Uploading…" : "Push Now"}
              </Button>

              {/* Results table */}
              {pushResults && (
                <div className="space-y-1.5 pt-1">
                  {pushResults.map((r) => (
                    <div
                      key={r.table}
                      className="flex items-center justify-between text-xs px-3 py-2 rounded-xl"
                      style={{ background: r.success ? "hsl(130 15% 14%)" : "hsl(0 15% 14%)" }}
                    >
                      <span className="font-mono text-foreground">{r.table}</span>
                      <div className="flex items-center gap-2">
                        {r.sent > 0 && (
                          <span className="text-muted-foreground">{r.sent} row{r.sent !== 1 ? "s" : ""}</span>
                        )}
                        {r.success ? (
                          <span className="flex items-center gap-1 text-green-600 font-semibold">
                            <Check className="w-3 h-3" /> OK
                          </span>
                        ) : (
                          <span
                            className="flex items-center gap-1 text-red-500 font-semibold"
                            title={r.error}
                          >
                            <AlertCircle className="w-3 h-3" />
                            {r.error?.slice(0, 30) ?? "Error"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Export Data</p>
              <p className="text-xs text-muted-foreground mb-3">
                Downloads a full backup including habits, notes, finance transactions, weight log, and settings.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleExportJSON} className="gap-2" data-testid="btn-export-json">
                  <Download className="w-4 h-4" /> Export JSON
                </Button>
                <Button onClick={handleExportCSV} variant="outline" className="gap-2" data-testid="btn-export-csv">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--border))] pt-4">
              <p className="text-sm font-semibold text-foreground mb-1">Import Data</p>
              <p className="text-xs text-muted-foreground mb-3">Restore data from a JSON backup file. This will overwrite your current data.</p>
              <Button
                variant="outline" className="gap-2 w-full border-dashed"
                onClick={() => fileInputRef.current?.click()}
                data-testid="btn-import-data"
              >
                <Upload className="w-4 h-4" /> Choose Backup File (.json)
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>

            <div className="bg-accent/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
              <p><span className="font-semibold">Habits:</span> {habits.length}</p>
              <p><span className="font-semibold">Check-ins:</span> {checkIns.length}</p>
              <p><span className="font-semibold">Notes:</span> {notes.length}</p>
              <p><span className="font-semibold">Transactions:</span> {transactions.length}</p>
              <p><span className="font-semibold">Weight entries:</span> {weightLog.length}</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* ── ACCOUNT / LOGOUT (always visible below tabs) ── */}
        <div
          className="mt-4 pt-4 border-t border-[hsl(var(--border))]"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#F5F4F0" }}
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.email ?? "Not signed in"}
              </p>
              <p className="text-xs text-muted-foreground">Signed in · data synced to cloud</p>
            </div>
            <button
              onClick={handleLogout}
              data-testid="btn-logout"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                logoutConfirm
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              )}
            >
              <LogOut className="w-3.5 h-3.5" />
              {logoutConfirm ? "Tap again to confirm" : "Sign Out"}
            </button>
          </div>
          {logoutConfirm && (
            <p className="text-xs text-muted-foreground mt-2 ml-12">
              This will clear local data on this device. Your cloud data remains safe.
              <button
                onClick={() => setLogoutConfirm(false)}
                className="ml-2 text-primary underline"
              >
                Cancel
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
