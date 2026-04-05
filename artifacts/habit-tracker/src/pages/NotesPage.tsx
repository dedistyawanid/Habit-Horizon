import { useState } from "react";
import { Plus, Search, Pencil, Trash2, BookOpen, Filter, ExternalLink, Bell } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { QuickNote } from "@/types/notes";
import { QuickNoteModal } from "@/components/QuickNoteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)/gm, "• $1");
}

function getHostname(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

const CAT_COLORS: Record<string, string> = {
  General: "#879A77",
  Work: "#3b82f6",
  Personal: "#ec4899",
  Health: "#10b981",
  Finance: "#f59e0b",
  Ideas: "#8b5cf6",
  Shopping: "#06b6d4",
  Travel: "#f97316",
  Journal: "#9BB5A0",
  Script: "#B8A9C9",
  Tasks: "#C9C5A8",
  Other: "#C9B5A8",
};

function getCatColor(cat: string) {
  return CAT_COLORS[cat] || "#879A77";
}

const NOTE_CATEGORIES_ALL = ["All", "General", "Work", "Personal", "Health", "Finance", "Ideas", "Shopping", "Travel", "Journal", "Script", "Tasks", "Other"];

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, settings } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<QuickNote | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const allNoteCats = ["All", ...settings.noteCategories];
  const allCats = Array.from(new Set([...allNoteCats, ...NOTE_CATEGORIES_ALL]));

  const filtered = notes
    .filter((n) => filterCat === "All" || n.category === filterCat)
    .filter(
      (n) =>
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteNote(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  function handleEdit(note: QuickNote) {
    setEditNote(note);
    setShowModal(true);
  }

  function handleSubmit(values: Omit<QuickNote, "id" | "createdAt" | "updatedAt">) {
    if (editNote) {
      updateNote(editNote.id, values);
    } else {
      addNote(values);
    }
    setEditNote(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-24 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Notes</h1>
            <p className="text-xs text-gray-400 mt-0.5">{notes.length} total</p>
          </div>
          <Button
            onClick={() => { setEditNote(null); setShowModal(true); }}
            size="sm"
            className="gap-1.5 text-xs rounded-xl"
            data-testid="btn-add-note"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note
          </Button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-white dark:bg-gray-900 h-9 text-sm"
              data-testid="input-note-search"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-36 bg-white dark:bg-gray-900 h-9 text-xs" data-testid="filter-note-category">
              <Filter className="w-3 h-3 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allCats.filter((c, i, a) => a.indexOf(c) === i).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {allCats.filter((c, i, a) => a.indexOf(c) === i).map((cat) => {
            const count = cat === "All" ? notes.length : notes.filter((n) => n.category === cat).length;
            if (cat !== "All" && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                  filterCat === cat
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/40"
                )}
              >
                {cat} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Notes grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
              {notes.length === 0 ? "No notes yet" : "No notes match your filter"}
            </p>
            {notes.length === 0 && (
              <Button onClick={() => { setEditNote(null); setShowModal(true); }} size="sm" className="mt-2">
                Write your first note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((note) => {
              const color = getCatColor(note.category);
              return (
                <div
                  key={note.id}
                  data-testid={`note-card-${note.id}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-all duration-200 flex flex-col gap-2.5"
                >
                  {/* Category + title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 font-medium"
                          style={{ backgroundColor: color + "22", color }}
                        >
                          {note.category}
                        </Badge>
                        {note.reminderEnabled && note.reminderDate && (
                          <Bell className="w-3 h-3 text-amber-500 shrink-0" title={`Reminder: ${note.reminderDate}`} />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100 leading-tight truncate">
                        {note.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content preview */}
                  {note.content && (
                    <p
                      className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed flex-1"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                    />
                  )}

                  {/* URL preview */}
                  {note.url && (
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate group-hover:text-primary transition-colors">
                        {getHostname(note.url)}
                      </span>
                    </a>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-gray-800">
                    <span className="text-[10px] text-gray-400">{formatDate(note.createdAt)}</span>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => handleEdit(note)}
                        data-testid={`edit-note-btn-${note.id}`}
                      >
                        <Pencil className="w-3 h-3 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => handleDelete(note.id)}
                        data-testid={`delete-note-btn-${note.id}`}
                      >
                        <Trash2 className={cn("w-3 h-3", confirmDelete === note.id ? "text-red-500" : "text-gray-400")} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuickNoteModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditNote(null); }}
        onSubmit={handleSubmit}
        initialValues={editNote ?? undefined}
        mode={editNote ? "edit" : "add"}
      />
    </div>
  );
}
