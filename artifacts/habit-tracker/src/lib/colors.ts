export const HABIT_COLORS = [
  "#7C9EBD",
  "#9BB5A0",
  "#B8A9C9",
  "#E8B4A0",
  "#A8C5DA",
  "#D4A5A5",
  "#B5C9A8",
  "#C9B5A8",
  "#A8B5C9",
  "#C9C5A8",
];

export const CATEGORY_COLORS: Record<string, string> = {
  Health: "#9BB5A0",
  Work: "#7C9EBD",
  Skill: "#B8A9C9",
  Finance: "#C9C5A8",
  Social: "#E8B4A0",
  Personal: "#A8C5DA",
  Other: "#C9B5A8",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "#7C9EBD";
}
