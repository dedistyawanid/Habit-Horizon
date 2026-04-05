import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, Trash2, BookOpen, ExternalLink, Bell, FilePlus,
  ArrowUpDown, LayoutGrid, List, Tag, Check, FolderOpen, Pin, X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { QuickNote } from "@/types/notes";
import { NoteEditor } from "@/components/NoteEditor";
import { CategoryManager } from "@/components/CategoryManager";
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
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
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
  alpha:  "A → Z",
  reminder: "Reminder Active",
};

export default function NotesPage() {
  const {
    notes, addNote, updateNote, deleteNote,
    bulkDeleteNotes, bulkUpdateNotes,
    settings, addNoteCategory, renameNoteCategory, deleteNoteCategory,
  } = useApp();

  const [activeNoteId,        setActiveNoteId]        = useState<string | null>(null);
  const [search,              setSearch]              = useState("");
  const [filterCat,           setFilterCat]           = useState("All");
  const [confirmDelete,       setConfirmDelete]       = useState<string | null>(null);
  const [sortMode,            setSortMode]            = useState<SortMode>("latest");
  const [sortOpen,            setSortOpen]            = useState(false);
  const [notesView,           setNotesView]           = useState<"grid" | "list">("grid");
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  /* ── Selection state ── */
  const [selectionMode,  setSelectionMode]  = useState(false);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [showCatPicker,  setShowCatPicker]  = useState(false);
  const [bulkConfirmDel, setBulkConfirmDel] = useState(false);

  /* Long-press timer shared across all cards */
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lpFired  = useRef(false);

  function lpStart(id: string) {
    lpFired.current = false;
    lpTimer.current = setTimeout(() => {
      lpFired.current = true;
      if (!selectionMode) {
        setSelectionMode(true);
        setSelectedIds(new Set([id]));
      } else {
        toggleSelect(id);
      }
      /* Haptic feedback on supported devices */
      if ("vibrate" in navigator) navigator.vibrate(40);
    }, 500);
  }
  function lpCancel() {
    if (lpTimer.current) { clearTimeout(lpTimer.current); lpTimer.current = null; }
  }

  /* ── Selection helpers ── */
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function exitSelection() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setShowCatPicker(false);
    setBulkConfirmDel(false);
  }

  /* Auto-exit if nothing left selected */
  useEffect(() => {
    if (selectionMode && selectedIds.size === 0) exitSelection();
  }, [selectedIds, selectionMode]);

  /* ── Bulk actions ── */
  function handleBulkDelete() {
    if (!bulkConfirmDel) { setBulkConfirmDel(true); return; }
    bulkDeleteNotes(Array.from(selectedIds));
    exitSelection();
  }
  function handleBulkCategory(cat: string) {
    bulkUpdateNotes(Array.from(selectedIds), { category: cat });
    exitSelection();
  }
  function handleBulkPin() {
    const ids = Array.from(selectedIds);
    const allPinned = ids.every((id) => notes.find((n) => n.id === id)?.pinned);
    bulkUpdateNotes(ids, { pinned: !allPinned });
    exitSelection();
  }

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
    (id: string, upd: Partial<Omit<QuickNote, "id" | "createdAt">>) => updateNote(id, upd),
    [updateNote]
  );

  /* ── Editor view ── */
  if (activeNoteId) {
    const note = notes.find((n) => n.id === activeNoteId);
    if (note) {
      return (
        <NoteEditor
          note={note}
          onBack={() => setActiveNoteId(null)}
          onUpdate={handleUpdate}
          onDelete={(id) => { deleteNote(id); setActiveNoteId(null); }}
        />
      );
    }
    setActiveNoteId(null);
  }

  /* ── Derived data ── */
  const allNoteCats = ["All", ...settings.noteCategories];
  const allCats = Array.from(new Set([
    ...allNoteCats,
    "General", "Work", "Personal", "Health", "Finance",
    "Ideas", "Shopping", "Travel", "Journal", "Script", "Tasks", "Other",
  ]));
  const categoriesWithNotes = allCats.filter((cat) =>
    cat === "All" || notes.some((n) => n.category === cat)
  );
  const searchLower = search.toLowerCase();
  const baseFiltered = notes
    .filter((n) => filterCat === "All" || n.category === filterCat)
    .filter((n) =>
      !search ||
      n.title.toLowerCase().includes(searchLower) ||
      getPreview(n.content).toLowerCase().includes(searchLower)
    );
  const filtered = [...baseFiltered].sort((a, b) => {
    if (sortMode === "alpha") return (a.title || "Untitled").localeCompare(b.title || "Untitled");
    if (sortMode === "reminder") {
      const aR = a.reminderEnabled && a.reminderDate ? 1 : 0;
      const bR = b.reminderEnabled && b.reminderDate ? 1 : 0;
      return bR - aR || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const moveCats = Array.from(new Set([
    ...settings.noteCategories,
    "General", "Work", "Personal", "Health", "Finance",
    "Ideas", "Shopping", "Travel", "Journal", "Script", "Tasks", "Other",
  ]));

  /* ── Card click handler ── */
  function handleCardClick(id: string) {
    if (lpFired.current) return;               // long-press already handled
    if (selectionMode) { toggleSelect(id); return; }
    setActiveNoteId(id);
  }

  /* ── Rendering each card inline ── */
  function renderCard(note: QuickNote) {
    const isSelected = selectedIds.has(note.id);
    const preview    = getPreview(note.content);
    const title      = note.title || "Untitled";
    const isList     = notesView === "list";

    const selRing = isSelected
      ? "ring-2 ring-[#5c7c6c] ring-offset-1 ring-offset-[#161819]"
      : selectionMode ? "opacity-70" : "";

    const longPressProps = {
      onTouchStart:  () => lpStart(note.id),
      onTouchEnd:    lpCancel,
      onTouchCancel: lpCancel,
      onMouseDown:   () => lpStart(note.id),
      onMouseUp:     lpCancel,
      onMouseLeave:  lpCancel,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        if (!selectionMode) { setSelectionMode(true); setSelectedIds(new Set([note.id])); }
      },
      onClick: () => handleCardClick(note.id),
    };

    const checkCircle = (
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all shrink-0",
        isSelected ? "bg-[#5c7c6c] border-[#5c7c6c]" : "border-muted-foreground/40 bg-transparent"
      )}>
        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
    );

    if (isList) {
      return (
        <div
          key={note.id}
          data-testid={`note-card-${note.id}`}
          {...longPressProps}
          className={cn(
            "group relative flex items-center gap-3.5 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-all duration-150 bg-white dark:bg-card select-none",
            selRing
          )}
          style={{ borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.10)" }}
        >
          {selectionMode
            ? checkCircle
            : (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
              </div>
            )
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold leading-snug truncate text-foreground">{title}</h3>
              {note.pinned && <Pin className="w-2.5 h-2.5 text-[#5c7c6c] shrink-0" />}
            </div>
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
          {!selectionMode && (
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
          )}
        </div>
      );
    }

    /* Grid card */
    return (
      <div
        key={note.id}
        data-testid={`note-card-${note.id}`}
        {...longPressProps}
        className={cn(
          "group relative flex flex-col p-4 cursor-pointer active:scale-[0.98] transition-all duration-150 bg-white dark:bg-card select-none",
          selRing
        )}
        style={{ borderRadius: 20, minHeight: 110, boxShadow: "0 1px 8px rgba(0,0,0,0.10)" }}
      >
        {selectionMode && (
          <div className="absolute top-2.5 left-2.5 z-10">{checkCircle}</div>
        )}
        {note.pinned && (
          <Pin className="absolute top-2.5 right-2.5 w-3 h-3 text-[#5c7c6c]" />
        )}
        <h3 className={cn(
          "text-sm font-semibold leading-snug line-clamp-2 mb-1.5 text-foreground",
          selectionMode && "pl-6"
        )}>
          {title}
        </h3>
        {preview && (
          <p className="text-xs leading-relaxed line-clamp-3 flex-1 text-muted-foreground">{preview}</p>
        )}
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
        {!selectionMode && (
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
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      onClick={() => {
        if (sortOpen) setSortOpen(false);
        if (showCatPicker) setShowCatPicker(false);
      }}
    >
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-36 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Notes</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectionMode
                ? `${selectedIds.size} selected`
                : `${notes.length} ${notes.length === 1 ? "doc" : "docs"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Layout toggle */}
            <div className="flex bg-card border border-[hsl(var(--border))] rounded-xl overflow-hidden">
              <button
                onClick={() => setNotesView("grid")}
                className={cn("px-2.5 py-2 transition-colors", notesView === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setNotesView("list")}
                className={cn("px-2.5 py-2 transition-colors", notesView === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setSortOpen((v) => !v); }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-[hsl(var(--border))] bg-card text-xs text-muted-foreground transition-colors"
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
                          : "text-muted-foreground hover:bg-accent"
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

        {/* Category pills */}
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
            {filtered.map(renderCard)}
          </div>
        )}
      </div>

      {/* ── Bulk Action Toolbar ─────────────────────────────────── */}
      {selectionMode && (
        <div className="fixed bottom-[72px] left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-sm flex items-center gap-2 px-3 py-2.5 rounded-2xl shadow-2xl"
            style={{ background: "#211f1d", border: "1px solid rgba(172,110,92,0.28)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cancel */}
            <button
              onClick={exitSelection}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Cancel selection"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-foreground flex-1 truncate">
              {selectedIds.size} note{selectedIds.size !== 1 ? "s" : ""}
            </span>

            {/* Pin / Unpin */}
            <button
              onClick={handleBulkPin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#5c7c6c]/15 text-[#5c7c6c] text-xs font-semibold hover:bg-[#5c7c6c]/25 transition-colors shrink-0"
              title="Pin / Unpin selected"
            >
              <Pin className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Pin</span>
            </button>

            {/* Move to Category */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCatPicker((v) => !v);
                  setBulkConfirmDel(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors shrink-0"
                title="Move to category"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Move</span>
              </button>
              {showCatPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50 bg-card rounded-xl border border-[hsl(var(--border))] shadow-2xl overflow-hidden min-w-[160px] max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-[hsl(var(--border))]/50">
                    Move to
                  </div>
                  {moveCats.map((cat) => (
                    <button
                      key={cat}
                      onClick={(e) => { e.stopPropagation(); handleBulkCategory(cat); }}
                      className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-[#5c7c6c]/10 hover:text-[#5c7c6c] transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={handleBulkDelete}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0",
                bulkConfirmDel
                  ? "bg-red-500 text-white scale-105"
                  : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              )}
              title={bulkConfirmDel ? "Tap again to confirm delete" : "Delete selected"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{bulkConfirmDel ? "Sure?" : "Delete"}</span>
            </button>
          </div>
        </div>
      )}

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
