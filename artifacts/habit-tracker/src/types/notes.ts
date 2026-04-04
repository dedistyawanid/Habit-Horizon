export type NoteCategory = string;

export interface QuickNote {
  id: string;
  title: string;
  category: NoteCategory;
  content: string;
  createdAt: string;
  updatedAt: string;
}
