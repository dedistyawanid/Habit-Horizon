export type NoteCategory = string;

export interface QuickNote {
  id: string;
  title: string;
  category: NoteCategory;
  content: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}
