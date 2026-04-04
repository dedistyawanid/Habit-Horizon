export type HabitCategory = "Health" | "Work" | "Skill" | "Finance" | "Social" | "Personal" | "Other";
export type HabitFrequency = "Daily" | "Weekly" | "Monthly";

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  description: string;
  frequency: HabitFrequency;
  createdAt: string;
  color: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string;
  notes: string;
  completedAt: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  completionThisMonth: number;
  totalCompletions: number;
  totalDaysThisMonth: number;
  completionPercentage: number;
}
