import { useRef } from "react";
import { Moon, Sun, Monitor, Upload, Download, Check, X, User, Scale, Ruler, Target, Image, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { DateFormat, Theme, THEME_PRESETS, AccentTheme } from "@/types/settings";
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

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const {
    settings, updateSettings, updateProfile,
    habits, checkIns, notes, importData,
    transactions, financeSettings, weightLog, activityLog,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleExportJSON() {
    exportAsJSON(habits, checkIns, notes, settings, transactions, financeSettings, weightLog, activityLog);
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
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* ── PROFILE TAB ── */}
          <TabsContent value="profile" className="space-y-5 pt-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {settings.profile.avatarUrl ? (
                  <img src={settings.profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover" />
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
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
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
          </TabsContent>

          {/* ── APPEARANCE TAB ── */}
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
                        ? "border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-800"
                        : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                    )}
                  >
                    <div className="w-8 h-8 rounded-xl shrink-0" style={{ backgroundColor: preset.previewColor }} />
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

          {/* ── DATA TAB ── */}
          <TabsContent value="data" className="space-y-4 pt-4">
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
                variant="outline" className="gap-2 w-full border-dashed"
                onClick={() => fileInputRef.current?.click()}
                data-testid="btn-import-data"
              >
                <Upload className="w-4 h-4" />
                Choose Backup File (.json)
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
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
