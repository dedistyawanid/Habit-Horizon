import { createContext, useContext, ReactNode } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useNotes } from "@/hooks/useNotes";
import { useHabits } from "@/hooks/useHabits";
import { useFinance } from "@/hooks/useFinance";
import { useWeightLog } from "@/hooks/useWeightLog";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useWishlist } from "@/hooks/useWishlist";
import { AppSettings } from "@/types/settings";
import { QuickNote } from "@/types/notes";
import { Habit, CheckIn, HabitWithStats } from "@/types/habit";
import { Transaction, FinanceSettings } from "@/types/finance";
import { WishlistItem } from "@/types/wishlist";
import { WeightEntry } from "@/hooks/useWeightLog";
import { ActivityEntry } from "@/hooks/useActivityLog";

interface AppContextType {
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateProfile: (updates: Partial<AppSettings["profile"]>) => void;
  addHabitCategory: (name: string) => void;
  renameHabitCategory: (oldName: string, newName: string) => void;
  deleteHabitCategory: (name: string) => void;
  addNoteCategory: (name: string) => void;
  renameNoteCategory: (oldName: string, newName: string) => void;
  deleteNoteCategory: (name: string) => void;
  // Notes
  notes: QuickNote[];
  addNote: (note: Omit<QuickNote, "id" | "createdAt" | "updatedAt">) => QuickNote;
  updateNote: (id: string, updates: Partial<Omit<QuickNote, "id" | "createdAt">>) => void;
  deleteNote: (id: string) => void;
  // Habits
  habits: Habit[];
  checkIns: CheckIn[];
  habitsWithStats: HabitWithStats[];
  topPerforming: HabitWithStats | null;
  needsAttention: HabitWithStats | null;
  addHabit: (habit: Omit<Habit, "id" | "createdAt">) => void;
  updateHabit: (id: string, updates: Partial<Omit<Habit, "id" | "createdAt">>) => void;
  deleteHabit: (id: string) => void;
  isCheckedInToday: (habitId: string) => boolean;
  getCheckInForDate: (habitId: string, date: string) => CheckIn | undefined;
  toggleCheckIn: (habitId: string, notes?: string) => void;
  updateCheckInNotes: (checkInId: string, notes: string) => void;
  getMonthCheckIns: (habitId: string, year: number, month: number) => CheckIn[];
  exportData: () => { habits: Habit[]; checkIns: CheckIn[] };
  // Finance
  transactions: Transaction[];
  financeSettings: FinanceSettings;
  setFinanceSettings: (s: FinanceSettings) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => void;
  deleteTransaction: (id: string) => void;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  currentYearIncome: number;
  // Wishlist
  wishlist: WishlistItem[];
  addWishlistItem: (item: Omit<WishlistItem, "id" | "createdAt">) => void;
  updateWishlistItem: (id: string, updates: Partial<Omit<WishlistItem, "id" | "createdAt">>) => void;
  deleteWishlistItem: (id: string) => void;
  addWishlistSavings: (id: string, amount: number) => void;
  // Weight log
  weightLog: WeightEntry[];
  addWeightEntry: (weight: number, notes?: string, date?: string) => void;
  deleteWeightEntry: (id: string) => void;
  latestWeight: number | null;
  // Activity log
  activityLog: ActivityEntry[];
  addActivityEntry: (entry: Omit<ActivityEntry, "id" | "createdAt">) => ActivityEntry;
  deleteActivityEntry: (id: string) => void;
  // Import
  importData: (data: {
    habits?: Habit[];
    checkIns?: CheckIn[];
    notes?: QuickNote[];
    settings?: AppSettings;
    transactions?: Transaction[];
    financeSettings?: FinanceSettings;
    weightLog?: WeightEntry[];
    activityLog?: ActivityEntry[];
  }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const settingsHook = useSettings();
  const notesHook = useNotes();
  const habitsHook = useHabits();
  const financeHook = useFinance();
  const weightHook = useWeightLog();
  const activityHook = useActivityLog();
  const wishlistHook = useWishlist();

  function importData(data: {
    habits?: Habit[];
    checkIns?: CheckIn[];
    notes?: QuickNote[];
    settings?: AppSettings;
    transactions?: Transaction[];
    financeSettings?: FinanceSettings;
    weightLog?: WeightEntry[];
    activityLog?: ActivityEntry[];
  }) {
    if (data.habits) localStorage.setItem("dedi_habits", JSON.stringify(data.habits));
    if (data.checkIns) localStorage.setItem("dedi_checkins", JSON.stringify(data.checkIns));
    if (data.notes) localStorage.setItem("dedi_quick_notes", JSON.stringify(data.notes));
    if (data.settings) localStorage.setItem("dedi_app_settings", JSON.stringify(data.settings));
    if (data.transactions) localStorage.setItem("dedi_transactions", JSON.stringify(data.transactions));
    if (data.financeSettings) localStorage.setItem("dedi_finance_settings", JSON.stringify(data.financeSettings));
    if (data.weightLog) localStorage.setItem("dedi_weight_log", JSON.stringify(data.weightLog));
    if (data.activityLog) localStorage.setItem("dedi_activity_log", JSON.stringify(data.activityLog));
    window.location.reload();
  }

  return (
    <AppContext.Provider
      value={{
        ...settingsHook,
        ...notesHook,
        ...habitsHook,
        ...financeHook,
        ...weightHook,
        ...activityHook,
        ...wishlistHook,
        importData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
