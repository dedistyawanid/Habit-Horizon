export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type Theme = "light" | "dark" | "system";
export type AccentTheme = "sage" | "terracotta" | "forest" | "ochre" | "slate";

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
    id: "sage",
    name: "Sage & Charcoal",
    description: "Default — Natural & Grounded",
    previewColor: "#556B2F",
    lightVars: {
      "--primary": "83 40% 30%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "83 25% 91%",
      "--accent-foreground": "83 40% 22%",
      "--ring": "83 40% 30%",
      "--sidebar-primary": "83 40% 30%",
      "--sidebar-accent": "83 20% 93%",
      "--bg-gradient": "#FAF9F6",
      "--chart-1": "83 40% 30%",
    },
    darkVars: {
      "--primary": "83 35% 55%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "83 20% 18%",
      "--accent-foreground": "83 30% 72%",
      "--ring": "83 35% 55%",
      "--sidebar-primary": "83 35% 55%",
      "--sidebar-accent": "83 20% 18%",
      "--bg-gradient": "#0d1408",
      "--chart-1": "83 35% 55%",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta & Sand",
    description: "Warm & Earthy",
    previewColor: "#E2725B",
    lightVars: {
      "--primary": "10 69% 62%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "10 40% 93%",
      "--accent-foreground": "10 60% 28%",
      "--ring": "10 69% 62%",
      "--sidebar-primary": "10 69% 62%",
      "--sidebar-accent": "10 35% 93%",
      "--bg-gradient": "#FDF8F5",
      "--chart-1": "10 69% 62%",
    },
    darkVars: {
      "--primary": "10 65% 68%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "10 30% 18%",
      "--accent-foreground": "10 50% 78%",
      "--ring": "10 65% 68%",
      "--sidebar-primary": "10 65% 68%",
      "--sidebar-accent": "10 30% 18%",
      "--bg-gradient": "#1a0a07",
      "--chart-1": "10 65% 68%",
    },
  },
  {
    id: "forest",
    name: "Deep Forest",
    description: "Dark & Mossy",
    previewColor: "#2D3A2D",
    lightVars: {
      "--primary": "120 13% 20%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "120 10% 91%",
      "--accent-foreground": "120 13% 15%",
      "--ring": "120 13% 20%",
      "--sidebar-primary": "120 13% 20%",
      "--sidebar-accent": "120 8% 92%",
      "--bg-gradient": "#F2F4F2",
      "--chart-1": "120 13% 20%",
    },
    darkVars: {
      "--primary": "120 15% 50%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "120 10% 16%",
      "--accent-foreground": "120 12% 70%",
      "--ring": "120 15% 50%",
      "--sidebar-primary": "120 15% 50%",
      "--sidebar-accent": "120 10% 16%",
      "--bg-gradient": "#080d08",
      "--chart-1": "120 15% 50%",
    },
  },
  {
    id: "ochre",
    name: "Autumn Ochre",
    description: "Golden & Rich",
    previewColor: "#B8860B",
    lightVars: {
      "--primary": "42 92% 38%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "42 60% 92%",
      "--accent-foreground": "42 80% 18%",
      "--ring": "42 92% 38%",
      "--sidebar-primary": "42 92% 38%",
      "--sidebar-accent": "42 55% 93%",
      "--bg-gradient": "#FFFDF5",
      "--chart-1": "42 92% 38%",
    },
    darkVars: {
      "--primary": "42 88% 55%",
      "--primary-foreground": "0 0% 8%",
      "--accent": "42 40% 16%",
      "--accent-foreground": "42 70% 72%",
      "--ring": "42 88% 55%",
      "--sidebar-primary": "42 88% 55%",
      "--sidebar-accent": "42 40% 16%",
      "--bg-gradient": "#120e00",
      "--chart-1": "42 88% 55%",
    },
  },
  {
    id: "slate",
    name: "Stone & Slate",
    description: "Minimal & Neutral",
    previewColor: "#4A4A4A",
    lightVars: {
      "--primary": "0 0% 29%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "0 0% 92%",
      "--accent-foreground": "0 0% 18%",
      "--ring": "0 0% 29%",
      "--sidebar-primary": "0 0% 29%",
      "--sidebar-accent": "0 0% 93%",
      "--bg-gradient": "#F5F5F5",
      "--chart-1": "0 0% 29%",
    },
    darkVars: {
      "--primary": "0 0% 72%",
      "--primary-foreground": "0 0% 8%",
      "--accent": "0 0% 18%",
      "--accent-foreground": "0 0% 72%",
      "--ring": "0 0% 72%",
      "--sidebar-primary": "0 0% 72%",
      "--sidebar-accent": "0 0% 18%",
      "--bg-gradient": "#0a0a0a",
      "--chart-1": "0 0% 72%",
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
  accentTheme: "sage",
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
