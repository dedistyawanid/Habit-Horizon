export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type Theme = "light" | "dark" | "system";
export type AccentTheme = "classic" | "ocean" | "forest" | "sunset" | "midnight";

export interface ThemePreset {
  id: AccentTheme;
  name: string;
  description: string;
  lightVars: Record<string, string>;
  darkVars: Record<string, string>;
  previewColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "forest",
    name: "Sage Green",
    description: "Default — Soft & Natural",
    previewColor: "#879A77",
    lightVars: {
      "--primary": "93 18% 54%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "93 15% 92%",
      "--accent-foreground": "93 25% 30%",
      "--ring": "93 18% 54%",
      "--sidebar-primary": "93 18% 54%",
      "--sidebar-accent": "93 15% 92%",
    },
    darkVars: {
      "--primary": "93 20% 62%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "93 15% 20%",
      "--accent-foreground": "93 20% 72%",
      "--ring": "93 20% 62%",
      "--sidebar-primary": "93 20% 62%",
      "--sidebar-accent": "93 15% 20%",
    },
  },
  {
    id: "classic",
    name: "Violet",
    description: "Clean White & Violet",
    previewColor: "#7c3aed",
    lightVars: {
      "--primary": "262 80% 50%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "262 30% 94%",
      "--accent-foreground": "262 50% 35%",
      "--ring": "262 80% 50%",
      "--sidebar-primary": "262 80% 50%",
      "--sidebar-accent": "262 30% 94%",
    },
    darkVars: {
      "--primary": "262 70% 65%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "262 25% 18%",
      "--accent-foreground": "262 60% 80%",
      "--ring": "262 70% 65%",
      "--sidebar-primary": "262 70% 65%",
      "--sidebar-accent": "262 25% 18%",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep Navy & Soft Cyan",
    previewColor: "#0891b2",
    lightVars: {
      "--primary": "196 80% 42%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "196 60% 92%",
      "--accent-foreground": "196 70% 22%",
      "--ring": "196 80% 42%",
      "--sidebar-primary": "196 80% 42%",
      "--sidebar-accent": "196 60% 92%",
    },
    darkVars: {
      "--primary": "196 72% 55%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "196 40% 14%",
      "--accent-foreground": "196 70% 75%",
      "--ring": "196 72% 55%",
      "--sidebar-primary": "196 72% 55%",
      "--sidebar-accent": "196 40% 14%",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm Beige & Muted Orange",
    previewColor: "#d97706",
    lightVars: {
      "--primary": "35 85% 48%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "35 70% 92%",
      "--accent-foreground": "35 80% 22%",
      "--ring": "35 85% 48%",
      "--sidebar-primary": "35 85% 48%",
      "--sidebar-accent": "35 70% 92%",
    },
    darkVars: {
      "--primary": "35 80% 58%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "35 50% 15%",
      "--accent-foreground": "35 80% 72%",
      "--ring": "35 80% 58%",
      "--sidebar-primary": "35 80% 58%",
      "--sidebar-accent": "35 50% 15%",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Pure Black & Royal Purple",
    previewColor: "#7c22e8",
    lightVars: {
      "--primary": "274 82% 50%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "274 60% 92%",
      "--accent-foreground": "274 70% 26%",
      "--ring": "274 82% 50%",
      "--sidebar-primary": "274 82% 50%",
      "--sidebar-accent": "274 60% 92%",
    },
    darkVars: {
      "--primary": "274 78% 63%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "274 38% 16%",
      "--accent-foreground": "274 70% 78%",
      "--ring": "274 78% 63%",
      "--sidebar-primary": "274 78% 63%",
      "--sidebar-accent": "274 38% 16%",
    },
  },
];

export interface UserProfile {
  fullName: string;
  avatarUrl: string;
  avatarType: "upload" | "initials";
  weight: string;
  height: string;
  mission: string;
}

export interface AppSettings {
  theme: Theme;
  accentTheme: AccentTheme;
  dateFormat: DateFormat;
  profile: UserProfile;
  habitCategories: string[];
  noteCategories: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  accentTheme: "forest",
  dateFormat: "DD/MM/YYYY",
  profile: {
    fullName: "Dedi Styawan",
    avatarUrl: "",
    avatarType: "initials",
    weight: "",
    height: "",
    mission: "Consistency is Key",
  },
  habitCategories: ["Health", "Work", "Skill", "Finance", "Social", "Personal", "Other"],
  noteCategories: ["Ideas", "Journal", "Script", "Tasks", "Personal", "Other"],
};
