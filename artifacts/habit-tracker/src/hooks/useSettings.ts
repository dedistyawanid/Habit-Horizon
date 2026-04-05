import { useState, useEffect, useCallback } from "react";
import { AppSettings, DEFAULT_SETTINGS, THEME_PRESETS, AccentTheme } from "@/types/settings";

const SETTINGS_KEY = "dedi_app_settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const accentTheme: AccentTheme =
      parsed.accentTheme === "forest"
        ? "sage"
        : (parsed.accentTheme as AccentTheme) || DEFAULT_SETTINGS.accentTheme;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      accentTheme,
      profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
      habitCategories: parsed.habitCategories?.length
        ? parsed.habitCategories
        : DEFAULT_SETTINGS.habitCategories,
      noteCategories: parsed.noteCategories?.length
        ? parsed.noteCategories
        : DEFAULT_SETTINGS.noteCategories,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyTheme(theme: AppSettings["theme"]) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }
}

function applyAccentTheme(accentTheme: AccentTheme, isDark: boolean) {
  const preset = THEME_PRESETS.find((t) => t.id === accentTheme);
  if (!preset) return;
  const vars = isDark ? preset.darkVars : preset.lightVars;
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyTheme(settings.theme);
    const isDark =
      settings.theme === "dark" ||
      (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyAccentTheme(settings.accentTheme, isDark);
  }, [settings]);

  useEffect(() => {
    applyTheme(settings.theme);
    const isDark =
      settings.theme === "dark" ||
      (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyAccentTheme(settings.accentTheme, isDark);
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateProfile = useCallback((updates: Partial<AppSettings["profile"]>) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const addHabitCategory = useCallback((name: string) => {
    setSettings((prev) => ({
      ...prev,
      habitCategories: [...prev.habitCategories, name],
    }));
  }, []);

  const renameHabitCategory = useCallback((oldName: string, newName: string) => {
    setSettings((prev) => ({
      ...prev,
      habitCategories: prev.habitCategories.map((c) => (c === oldName ? newName : c)),
    }));
  }, []);

  const deleteHabitCategory = useCallback((name: string) => {
    setSettings((prev) => ({
      ...prev,
      habitCategories: prev.habitCategories.filter((c) => c !== name),
    }));
  }, []);

  const addNoteCategory = useCallback((name: string) => {
    setSettings((prev) => ({
      ...prev,
      noteCategories: [...prev.noteCategories, name],
    }));
  }, []);

  const renameNoteCategory = useCallback((oldName: string, newName: string) => {
    setSettings((prev) => ({
      ...prev,
      noteCategories: prev.noteCategories.map((c) => (c === oldName ? newName : c)),
    }));
  }, []);

  const deleteNoteCategory = useCallback((name: string) => {
    setSettings((prev) => ({
      ...prev,
      noteCategories: prev.noteCategories.filter((c) => c !== name),
    }));
  }, []);

  return {
    settings,
    updateSettings,
    updateProfile,
    addHabitCategory,
    renameHabitCategory,
    deleteHabitCategory,
    addNoteCategory,
    renameNoteCategory,
    deleteNoteCategory,
  };
}
