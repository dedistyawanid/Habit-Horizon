export type NoteCategory = string;

export interface QuickNote {
  id: string;
  title: string;
  category: NoteCategory;
  content: string;
  url?: string;
  reminderDate?: string;
  reminderEnabled?: boolean;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}
