import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, BookOpen, ExternalLink, Bell, FilePlus, ArrowUpDown, LayoutGrid, List, Tag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { QuickNote } from "@/types/notes";
import { NoteEditor } from "@/components/NoteEditor";
import { CategoryManager } from "@/components/CategoryManager";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";


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
  const { notes, addNote, updateNote, deleteNote, settings, addNoteCategory, renameNoteCategory, deleteNoteCategory } = useApp();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const [notesView, setNotesView] = useState<"grid" | "list">("grid");
  const [showCategoryManager, setShowCategoryManager] = useState(false);

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
            <h1 className="text-xl font-bold text-foreground">Notes</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{notes.length} {notes.length === 1 ? "doc" : "docs"}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Layout toggle */}
            <div className="flex bg-card border border-[hsl(var(--border))] rounded-xl overflow-hidden">
              <button
                onClick={() => setNotesView("grid")}
                className={cn("px-2.5 py-2 transition-colors", notesView === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-muted-foreground")}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setNotesView("list")}
                className={cn("px-2.5 py-2 transition-colors", notesView === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-muted-foreground")}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setSortOpen((v) => !v); }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-[hsl(var(--border))] bg-card text-xs text-muted-foreground dark:text-muted-foreground hover:border-[hsl(var(--border))] transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                {SORT_LABELS[sortMode]}
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-card rounded-xl border border-[hsl(var(--border))] shadow-lg overflow-hidden min-w-[140px]">
                  {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={(e) => { e.stopPropagation(); setSortMode(mode); setSortOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 text-xs transition-colors",
                        sortMode === mode
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground dark:text-muted-foreground hover:bg-accent"
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

        {/* Search bar — minimal underline style */}
        <div className="flex gap-3 items-center border-b border-[hsl(var(--border))]/50 pb-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-none"
            data-testid="input-note-search"
          />
          <button
            onClick={() => setShowCategoryManager(true)}
            title="Manage note categories"
            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <Tag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category pills — rounded minimalist */}
        <div className="flex gap-2 flex-wrap">
          {categoriesWithNotes.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                filterCat === cat
                  ? "bg-primary text-primary-foreground"
                  : "border border-[hsl(var(--border))] text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notes grid / list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium text-sm">
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
          <div className={cn(notesView === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2")}>
            {filtered.map((note) => {
              const preview = getPreview(note.content);
              const title = note.title || "Untitled";
              const isList = notesView === "list";
              return isList ? (
                /* ── List card ── */
                <div
                  key={note.id}
                  data-testid={`note-card-${note.id}`}
                  onClick={() => setActiveNoteId(note.id)}
                  className="group relative flex items-center gap-3.5 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-all duration-150 bg-white dark:bg-card"
                  style={{ borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.10)" }}
                >
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold leading-snug truncate text-foreground">{title}</h3>
                    {preview && (
                      <p className="text-xs truncate mt-0.5 leading-relaxed text-muted-foreground">{preview}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-medium text-primary">{note.category}</span>
                    <span className="text-[10px] text-muted-foreground/55">{formatDate(note.updatedAt)}</span>
                  </div>
                  {note.reminderEnabled && note.reminderDate && (
                    <Bell className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    data-testid={`delete-note-btn-${note.id}`}
                    className={cn(
                      "absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                      confirmDelete === note.id ? "opacity-100 text-red-400" : "text-muted-foreground"
                    )}
                    title={confirmDelete === note.id ? "Confirm delete" : "Delete"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                /* ── Grid card ── */
                <div
                  key={note.id}
                  data-testid={`note-card-${note.id}`}
                  onClick={() => setActiveNoteId(note.id)}
                  className="group relative flex flex-col p-4 cursor-pointer active:scale-[0.98] transition-all duration-150 bg-white dark:bg-card"
                  style={{ borderRadius: 20, minHeight: 110, boxShadow: "0 1px 8px rgba(0,0,0,0.10)" }}
                >
                  {/* Title */}
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-1.5 text-foreground">
                    {title}
                  </h3>
                  {/* Preview */}
                  {preview && (
                    <p className="text-xs leading-relaxed line-clamp-3 flex-1 text-muted-foreground">
                      {preview}
                    </p>
                  )}
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-2.5">
                    <span className="text-[10px] text-muted-foreground/50">{formatDate(note.updatedAt)}</span>
                    <div className="flex items-center gap-1.5">
                      {note.reminderEnabled && note.reminderDate && (
                        <Bell className="w-2.5 h-2.5 text-amber-400" />
                      )}
                      {note.url && (
                        <a
                          href={note.url} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()} title={getHostname(note.url)}
                        >
                          <ExternalLink className="w-2.5 h-2.5 text-primary/60" />
                        </a>
                      )}
                      <span className="text-[10px] font-medium text-primary">{note.category}</span>
                    </div>
                  </div>
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    data-testid={`delete-note-btn-${note.id}`}
                    className={cn(
                      "absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                      confirmDelete === note.id ? "opacity-100 text-red-400" : "text-muted-foreground"
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

      <CategoryManager
        open={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        title="Note Categories"
        categories={settings.noteCategories}
        onAdd={addNoteCategory}
        onRename={renameNoteCategory}
        onDelete={deleteNoteCategory}
      />
    </div>
  );
}
