export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type Theme = "light" | "dark" | "system";

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
  dateFormat: DateFormat;
  profile: UserProfile;
  habitCategories: string[];
  noteCategories: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
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
