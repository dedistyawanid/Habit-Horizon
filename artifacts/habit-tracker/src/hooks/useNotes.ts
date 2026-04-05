import { useState, useEffect, useCallback } from "react";
import { QuickNote } from "@/types/notes";
import {
  syncNote,
  deleteNote as dbDeleteNote,
} from "@/lib/sync";

const NOTES_KEY = "dedi_quick_notes";

function loadNotes(): QuickNote[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotes(notes: QuickNote[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function useNotes() {
  const [notes, setNotes] = useState<QuickNote[]>(loadNotes);

  useEffect(() => { saveNotes(notes); }, [notes]);

  const addNote = useCallback(
    (note: Omit<QuickNote, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newNote: QuickNote = {
        ...note,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setNotes((prev) => [newNote, ...prev]);
      syncNote(newNote);
      return newNote;
    },
    []
  );

  const updateNote = useCallback(
    (id: string, updates: Partial<Omit<QuickNote, "id" | "createdAt">>) => {
      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        );
        const found = updated.find((n) => n.id === id);
        if (found) syncNote(found);
        return updated;
      });
    },
    []
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    dbDeleteNote(id);
  }, []);

  return { notes, addNote, updateNote, deleteNote };
}
