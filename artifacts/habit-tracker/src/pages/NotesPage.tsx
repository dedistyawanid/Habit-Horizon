import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, BookOpen, ExternalLink, Bell, FilePlus, ArrowUpDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { QuickNote } from "@/types/notes";
import { NoteEditor } from "@/components/NoteEditor";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CAT_COLORS: Record<string, string> = {
  General: "#879A77", Work: "#3b82f6", Personal: "#ec4899", Health: "#10b981",
  Finance: "#f59e0b", Ideas: "#8b5cf6", Shopping: "#06b6d4", Travel: "#f97316",
  Journal: "#9BB5A0", Script: "#B8A9C9", Tasks: "#C9C5A8", Other: "#C9B5A8",
};

function getCatColor(cat: string) {
  return CAT_COLORS[cat] || "#879A77";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getPreview(content: string): string {
  return stripHtml(content).slice(0, 100);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getHostname(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

type SortMode = "latest" | "alpha" | "reminder";

const SORT_LABELS: Record<SortMode, string> = {
  latest: "Latest Edit",
  alpha: "A → Z",
  reminder: "Reminder Active",
};

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, settings } = useApp();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") {
      window.history.replaceState(null, "", window.location.pathname);
      handleCreateNote();
    } else if (params.get("open")) {
      const id = params.get("open");
      window.history.replaceState(null, "", window.location.pathname);
      if (id && notes.find((n) => n.id === id)) setActiveNoteId(id);
    }
  }, []);

  function handleCreateNote() {
    const newNote = addNote({ title: "", category: "General", content: "" });
    setActiveNoteId(newNote.id);
  }

  function handleDeleteNote(id: string) {
    if (confirmDelete === id) {
      deleteNote(id);
      setConfirmDelete(null);
      if (activeNoteId === id) setActiveNoteId(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  const handleUpdate = useCallback(
    (id: string, updates: Partial<Omit<QuickNote, "id" | "createdAt">>) => {
      updateNote(id, updates);
    },
    [updateNote]
  );

  // --- EDITOR VIEW ---
  if (activeNoteId) {
    const note = notes.find((n) => n.id === activeNoteId);
    if (note) {
      return (
        <NoteEditor
          note={note}
          onBack={() => setActiveNoteId(null)}
          onUpdate={handleUpdate}
          onDelete={(id) => {
            deleteNote(id);
            setActiveNoteId(null);
          }}
        />
      );
    }
    setActiveNoteId(null);
  }

  // --- LIST VIEW ---
  const allNoteCats = ["All", ...settings.noteCategories];
  const allCats = Array.from(new Set([
    ...allNoteCats,
    "General", "Work", "Personal", "Health", "Finance",
    "Ideas", "Shopping", "Travel", "Journal", "Script", "Tasks", "Other",
  ]));

  const categoriesWithNotes = allCats.filter((cat) => {
    if (cat === "All") return true;
    return notes.some((n) => n.category === cat);
  });

  const searchLower = search.toLowerCase();
  const baseFiltered = notes
    .filter((n) => filterCat === "All" || n.category === filterCat)
    .filter(
      (n) =>
        !search ||
        n.title.toLowerCase().includes(searchLower) ||
        getPreview(n.content).toLowerCase().includes(searchLower)
    );

  const filtered = [...baseFiltered].sort((a, b) => {
    if (sortMode === "alpha") {
      return (a.title || "Untitled").localeCompare(b.title || "Untitled");
    }
    if (sortMode === "reminder") {
      const aR = a.reminderEnabled && a.reminderDate ? 1 : 0;
      const bR = b.reminderEnabled && b.reminderDate ? 1 : 0;
      return bR - aR || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="min-h-screen" onClick={() => sortOpen && setSortOpen(false)}>
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Notes</h1>
            <p className="text-xs text-gray-400 mt-0.5">{notes.length} {notes.length === 1 ? "doc" : "docs"}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setSortOpen((v) => !v); }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                {SORT_LABELS[sortMode]}
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden min-w-[140px]">
                  {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={(e) => { e.stopPropagation(); setSortMode(mode); setSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-xs transition-colors",
                        sortMode === mode
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {SORT_LABELS[mode]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCreateNote}
              data-testid="btn-add-note"
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <FilePlus className="w-3.5 h-3.5" />
              New Note
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-white dark:bg-gray-900 h-9 text-sm rounded-xl"
            data-testid="input-note-search"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {categoriesWithNotes.map((cat) => {
            const count = cat === "All" ? notes.length : notes.filter((n) => n.category === cat).length;
            const color = getCatColor(cat);
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                  filterCat === cat
                    ? "text-white border-transparent"
                    : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/40"
                )}
                style={filterCat === cat ? { backgroundColor: color } : {}}
              >
                {cat} {cat !== "All" && <span className="opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Notes grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
              {notes.length === 0 ? "No notes yet" : "No notes match your filter"}
            </p>
            {notes.length === 0 && (
              <button
                onClick={handleCreateNote}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Write your first note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((note) => {
              const color = getCatColor(note.category);
              const preview = getPreview(note.content);
              const title = note.title || "Untitled";
              return (
                <div
                  key={note.id}
                  data-testid={`note-card-${note.id}`}
                  onClick={() => setActiveNoteId(note.id)}
                  className="group bg-white dark:bg-gray-900 p-3.5 transition-all duration-200 cursor-pointer flex flex-col gap-2 relative min-h-[110px]"
                  style={{ borderRadius: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
                >
                  {/* Color accent bar */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ backgroundColor: color }}
                  />

                  <div className="pl-3 flex-1 flex flex-col gap-1.5 min-w-0">
                    {/* Title */}
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                      {title}
                    </h3>

                    {/* Snippet */}
                    {preview && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed flex-1">
                        {preview}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-[10px] text-gray-400">{formatDate(note.updatedAt)}</span>
                      <div className="flex items-center gap-1">
                        {note.reminderEnabled && note.reminderDate && (
                          <Bell className="w-2.5 h-2.5 text-amber-400" />
                        )}
                        {note.url && (
                          <a
                            href={note.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={getHostname(note.url)}
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete button — top-right */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    data-testid={`delete-note-btn-${note.id}`}
                    className={cn(
                      "absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                      confirmDelete === note.id
                        ? "opacity-100 bg-red-50 dark:bg-red-900/20 text-red-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                    )}
                    title={confirmDelete === note.id ? "Confirm delete" : "Delete"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
