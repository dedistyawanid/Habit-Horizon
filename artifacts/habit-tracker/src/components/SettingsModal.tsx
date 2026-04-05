import { useState, useRef } from "react";
import { Moon, Sun, Monitor, Upload, Download, Trash2, Plus, Pencil, Check, X, User, Scale, Ruler, Target, Image, Palette, DollarSign, TrendingDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { AppSettings, DateFormat, Theme, THEME_PRESETS, AccentTheme } from "@/types/settings";
import { exportAsCSV, exportAsJSON, parseImportFile } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const DATE_FORMATS: DateFormat[] = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

function CategoryList({
  categories,
  onAdd,
  onRename,
  onDelete,
  label,
}: {
  categories: string[];
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
  label: string;
}) {
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onAdd(trimmed);
    setNewCat("");
  }

  function startEdit(cat: string) {
    setEditingCat(cat);
    setEditValue(cat);
  }

  function commitEdit(cat: string) {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== cat && !categories.includes(trimmed)) {
      onRename(cat, trimmed);
    }
    setEditingCat(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="space-y-1.5">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
            {editingCat === cat ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(cat); if (e.key === "Escape") setEditingCat(null); }}
                  className="h-6 text-sm flex-1 border-none bg-transparent p-0 focus-visible:ring-0"
                  autoFocus
                />
                <button onClick={() => commitEdit(cat)} className="text-emerald-500 hover:text-emerald-700">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingCat(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                <button onClick={() => startEdit(cat)} className="text-gray-400 hover:text-gray-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(cat)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="New category name"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          className="text-sm"
        />
        <Button size="sm" onClick={handleAdd} variant="outline">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function formatIDR(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return n.toLocaleString();
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const {
    settings, updateSettings, updateProfile,
    addHabitCategory, renameHabitCategory, deleteHabitCategory,
    addNoteCategory, renameNoteCategory, deleteNoteCategory,
    habits, checkIns, notes, importData,
    transactions, financeSettings, setFinanceSettings,
    weightLog, addWeightEntry, deleteWeightEntry,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [annualTargetInput, setAnnualTargetInput] = useState<string>("");
  const [weightInput, setWeightInput] = useState<string>("");

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

  function handleExportJSON() {
    exportAsJSON(habits, checkIns, notes, settings, transactions, financeSettings, weightLog);
    toast({ title: "Export complete", description: "Full backup downloaded (habits, notes, finance, weight, settings)." });
  }

  function handleExportCSV() {
    exportAsCSV(habits, checkIns);
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

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateProfile({ avatarUrl: ev.target?.result as string, avatarType: "upload" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function clearAvatar() {
    updateProfile({ avatarUrl: "", avatarType: "initials" });
  }

  function handleSetAnnualTarget() {
    const raw = annualTargetInput.trim().replace(/[,_]/g, "");
    const num = Number(raw);
    if (isNaN(num) || num <= 0) {
      toast({ title: "Invalid target", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }
    setFinanceSettings({ ...financeSettings, annualTarget: num });
    setAnnualTargetInput("");
    toast({ title: "Annual target updated", description: `New target: IDR ${formatIDR(num)}` });
  }

  const initials = (settings.profile.fullName || "DS")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-5 pt-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {settings.profile.avatarUrl ? (
                  <img
                    src={settings.profile.avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 shadow-sm hover:shadow-md transition-all"
                  data-testid="btn-upload-avatar"
                >
                  <Image className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Upload Photo
                </Button>
                {settings.profile.avatarUrl && (
                  <Button size="sm" variant="outline" onClick={clearAvatar}>
                    <X className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

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
                    <Scale className="w-3.5 h-3.5" /> Weight (kg)
                  </Label>
                  <Input
                    value={settings.profile.weight}
                    onChange={(e) => updateProfile({ weight: e.target.value })}
                    placeholder="e.g. 72"
                    type="number"
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
                    placeholder="e.g. 175"
                    type="number"
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

            {/* Weight Log */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-primary" />
                Weight Log
                {weightLog.length > 0 && (
                  <span className="ml-auto text-xs font-normal text-gray-400">
                    Latest: <span className="font-semibold text-gray-600 dark:text-gray-300">{weightLog[weightLog.length - 1].weight} kg</span>
                  </span>
                )}
              </p>

              {/* Temperature-style area chart of last 5 entries */}
              {weightLog.length >= 2 && (
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...weightLog].slice(-5)} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => {
                          const dt = new Date(d);
                          return `${dt.getMonth() + 1}/${dt.getDate()}`;
                        }}
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
                        strokeWidth={2.5}
                        fill="url(#weightGrad)"
                        dot={{ r: 3.5, fill: "var(--color-primary)", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Log new weight */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Current weight (kg)"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleLogWeight(); }}
                  className="text-sm flex-1"
                  data-testid="input-weight-log"
                  step="0.1"
                  min="0"
                />
                <Button onClick={handleLogWeight} size="sm" className="shrink-0" data-testid="btn-log-weight">
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Log
                </Button>
              </div>

              {/* Last 5 entries list */}
              {weightLog.length > 0 && (
                <div className="space-y-1">
                  {[...weightLog].reverse().slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-xl group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{entry.weight} kg</span>
                        {entry.notes && (
                          <span className="text-xs text-gray-400 truncate max-w-[100px]">{entry.notes}</span>
                        )}
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
          </TabsContent>

          {/* APPEARANCE TAB */}
          <TabsContent value="appearance" className="space-y-5 pt-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Theme Mode</p>
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
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", settings.theme === value ? "text-primary" : "text-gray-400")} />
                    <span className={cn("text-xs font-medium", settings.theme === value ? "text-primary" : "text-gray-500")}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Accent Color
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
                        ? "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800"
                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-xl shrink-0"
                      style={{ backgroundColor: preset.previewColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{preset.name}</p>
                      <p className="text-xs text-gray-400">{preset.description}</p>
                    </div>
                    {settings.accentTheme === preset.id && (
                      <div className="w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white dark:text-gray-900" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Date Format</p>
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
                        : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-6 pt-4">
            <CategoryList
              label="Habit Categories"
              categories={settings.habitCategories}
              onAdd={addHabitCategory}
              onRename={renameHabitCategory}
              onDelete={deleteHabitCategory}
            />
            <div className="border-t border-gray-100 dark:border-gray-800" />
            <CategoryList
              label="Note Categories"
              categories={settings.noteCategories}
              onAdd={addNoteCategory}
              onRename={renameNoteCategory}
              onDelete={deleteNoteCategory}
            />
          </TabsContent>

          {/* DATA TAB */}
          <TabsContent value="data" className="space-y-4 pt-4">
            {/* Annual Revenue Target */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                  Annual Revenue Target
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Current target:{" "}
                  <span className="font-semibold text-primary">
                    IDR {financeSettings.annualTarget.toLocaleString()}
                  </span>
                  {" "}({formatIDR(financeSettings.annualTarget)})
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="e.g. 2000000000"
                  value={annualTargetInput}
                  onChange={(e) => setAnnualTargetInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSetAnnualTarget(); }}
                  className="text-sm flex-1"
                  data-testid="input-annual-target"
                />
                <Button
                  onClick={handleSetAnnualTarget}
                  size="sm"
                  className="shrink-0"
                  data-testid="btn-set-annual-target"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Set
                </Button>
              </div>
              <p className="text-[10px] text-gray-400">
                Quick amounts: 500M = 500000000 &nbsp;·&nbsp; 1B = 1000000000 &nbsp;·&nbsp; 2B = 2000000000
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Export Data</p>
              <p className="text-xs text-gray-400 mb-3">
                Downloads a full backup including habits, notes, finance transactions, weight log, and settings.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleExportJSON} className="gap-2" data-testid="btn-export-json">
                  <Download className="w-4 h-4" />
                  Export JSON
                </Button>
                <Button onClick={handleExportCSV} variant="outline" className="gap-2" data-testid="btn-export-csv">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Import Data</p>
              <p className="text-xs text-gray-400 mb-3">Restore data from a JSON backup file. This will overwrite your current data.</p>
              <Button
                variant="outline"
                className="gap-2 w-full border-dashed"
                onClick={() => fileInputRef.current?.click()}
                data-testid="btn-import-data"
              >
                <Upload className="w-4 h-4" />
                Choose Backup File (.json)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
              <p><span className="font-semibold">Habits:</span> {habits.length}</p>
              <p><span className="font-semibold">Check-ins:</span> {checkIns.length}</p>
              <p><span className="font-semibold">Notes:</span> {notes.length}</p>
              <p><span className="font-semibold">Transactions:</span> {transactions.length}</p>
              <p><span className="font-semibold">Weight entries:</span> {weightLog.length}</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
