import { useState } from "react";
import { Plus, Search, Pencil, Trash2, BookOpen, Filter } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { QuickNote } from "@/types/notes";
import { QuickNoteModal } from "@/components/QuickNoteModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const { notes, deleteNote, settings } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<QuickNote | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = notes
    .filter((n) => filterCat === "All" || n.category === filterCat)
    .filter(
      (n) =>
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );

  const allCats = ["All", ...settings.noteCategories];

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

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const CATEGORY_COLORS: Record<string, string> = {
    Ideas: "#7C9EBD",
    Journal: "#9BB5A0",
    Script: "#B8A9C9",
    Tasks: "#C9C5A8",
    Personal: "#E8B4A0",
    Other: "#C9B5A8",
  };

  function getCatColor(cat: string) {
    return CATEGORY_COLORS[cat] || "#7C9EBD";
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Notes</h1>
            <p className="text-sm text-gray-400 mt-0.5">{notes.length} total notes</p>
          </div>
          <Button onClick={() => { setEditNote(null); setShowModal(true); }} className="gap-2" data-testid="btn-add-note">
            <Plus className="w-4 h-4" />
            New Note
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900"
              data-testid="input-note-search"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-40 bg-white dark:bg-gray-900" data-testid="filter-note-category">
              <Filter className="w-3.5 h-3.5 mr-1 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allCats.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          {allCats.map((cat) => {
            const count = cat === "All" ? notes.length : notes.filter((n) => n.category === cat).length;
            if (cat !== "All" && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                  filterCat === cat
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-300"
                )}
              >
                {cat} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Notes grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/40 rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {notes.length === 0 ? "No notes yet" : "No notes match your filter"}
            </p>
            {notes.length === 0 && (
              <Button onClick={() => { setEditNote(null); setShowModal(true); }} className="mt-2">
                Write your first note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((note) => {
              const color = getCatColor(note.category);
              return (
                <div
                  key={note.id}
                  data-testid={`note-card-${note.id}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <Badge
                          variant="secondary"
                          className="text-xs py-0 px-2"
                          style={{ backgroundColor: color + "22", color }}
                        >
                          {note.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 leading-tight truncate">
                        {note.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 flex-1 leading-relaxed">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-gray-800">
                    <span className="text-xs text-gray-400">{formatDate(note.createdAt)}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => handleEdit(note)}
                        data-testid={`edit-note-btn-${note.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => handleDelete(note.id)}
                        data-testid={`delete-note-btn-${note.id}`}
                      >
                        <Trash2 className={cn("w-3.5 h-3.5", confirmDelete === note.id ? "text-red-500" : "text-gray-400")} />
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
        editNote={editNote}
      />
    </div>
  );
}
