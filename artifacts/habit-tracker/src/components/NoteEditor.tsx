import { useEffect, useRef, useCallback, useState } from "react";
import {
  ArrowLeft, Trash2, Bold, Italic, Heading1, Heading2,
  List, ListOrdered, Link2, Check, Clock, MoreHorizontal,
  Bell, Tag,
} from "lucide-react";
import { QuickNote } from "@/types/notes";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  note: QuickNote;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Omit<QuickNote, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}

type SaveStatus = "saved" | "saving" | "unsaved";

function isHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

function initContent(content: string): string {
  if (!content) return "<p><br/></p>";
  if (isHtml(content)) return content;
  const html = markdownToHtml(content);
  return html || "<p><br/></p>";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const CATEGORIES = [
  "General", "Work", "Personal", "Health", "Finance",
  "Ideas", "Shopping", "Travel", "Journal", "Script", "Tasks", "Other",
];

const CAT_COLORS: Record<string, string> = {
  General: "#879A77", Work: "#3b82f6", Personal: "#ec4899", Health: "#10b981",
  Finance: "#f59e0b", Ideas: "#8b5cf6", Shopping: "#06b6d4", Travel: "#f97316",
  Journal: "#9BB5A0", Script: "#B8A9C9", Tasks: "#C9C5A8", Other: "#C9B5A8",
};

function formatTime(str: string): string {
  const d = new Date(str);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) +
    " · " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NoteEditor({ note, onBack, onUpdate, onDelete }: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef(note.id);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [showMeta, setShowMeta] = useState(false);
  const [category, setCategory] = useState(note.category);
  const [url, setUrl] = useState(note.url || "");
  const [reminderDate, setReminderDate] = useState(note.reminderDate || "");
  const [reminderEnabled, setReminderEnabled] = useState(note.reminderEnabled ?? false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const doSave = useCallback(() => {
    if (!editorRef.current || !titleRef.current) return;
    const content = editorRef.current.innerHTML;
    const title = titleRef.current.value.trim() || "Untitled";
    onUpdate(noteIdRef.current, { content, title });
    setSaveStatus("saved");
  }, [onUpdate]);

  const scheduleSave = useCallback(() => {
    setSaveStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 400);
  }, [doSave]);

  function saveMeta(updates: Partial<Omit<QuickNote, "id" | "createdAt">>) {
    onUpdate(note.id, updates);
    setSaveStatus("saved");
  }

  // Init editor content when note changes
  useEffect(() => {
    noteIdRef.current = note.id;
    if (editorRef.current) {
      editorRef.current.innerHTML = initContent(note.content);
    }
    if (titleRef.current) {
      titleRef.current.value = note.title;
      autoResizeTitle();
    }
    setCategory(note.category);
    setUrl(note.url || "");
    setReminderDate(note.reminderDate || "");
    setReminderEnabled(note.reminderEnabled ?? false);
    setSaveStatus("saved");
    // Place cursor at the end
    setTimeout(() => {
      if (editorRef.current) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 50);
  }, [note.id]);

  // Flush save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        doSave();
      }
    };
  }, [doSave]);

  function autoResizeTitle() {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }

  function execCmd(cmd: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    scheduleSave();
  }

  function execBlock(tag: string) {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    scheduleSave();
  }

  function isActive(cmd: string): boolean {
    try { return document.queryCommandState(cmd); }
    catch { return false; }
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(note.id);
      onBack();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    saveMeta({ category: cat });
  }

  function handleUrlChange(val: string) {
    setUrl(val);
    saveMeta({ url: val || undefined });
  }

  function handleReminderChange(enabled: boolean, date: string) {
    setReminderEnabled(enabled);
    setReminderDate(date);
    saveMeta({ reminderEnabled: enabled && !!date, reminderDate: enabled && date ? date : undefined });
  }

  const catColor = CAT_COLORS[category] || "#879A77";

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-2 px-3 py-2 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          aria-label="Back to notes"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-2">
          {/* Category pill */}
          <button
            onClick={() => setShowMeta((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors"
            style={{ backgroundColor: catColor + "20", color: catColor }}
          >
            <Tag className="w-2.5 h-2.5" />
            {category}
          </button>

          {/* Save status */}
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            {saveStatus === "saving" ? (
              <><Clock className="w-2.5 h-2.5 animate-pulse" /> Saving</>
            ) : (
              <><Check className="w-2.5 h-2.5 text-emerald-500" /> Saved</>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowMeta((v) => !v)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={handleDeleteClick}
          className={cn(
            "p-2 rounded-xl transition-colors",
            confirmDelete
              ? "bg-red-50 text-red-500 dark:bg-red-900/20"
              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          )}
          title={confirmDelete ? "Tap again to confirm delete" : "Delete note"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Metadata panel (category, url, reminder) */}
      {showMeta && (
        <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Category</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                    category === cat
                      ? "border-transparent text-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-500"
                  )}
                  style={category === cat ? { backgroundColor: CAT_COLORS[cat] || "#879A77" } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5" /> Reference URL
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://..."
              className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Reminder</p>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => handleReminderChange(e.target.checked, reminderDate)}
              className="w-4 h-4 accent-primary"
            />
          </div>
          {reminderEnabled && (
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => handleReminderChange(true, e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          )}

          <p className="text-[10px] text-gray-400">
            Edited {formatTime(note.updatedAt)}
          </p>
        </div>
      )}

      {/* Formatting toolbar */}
      <div className="sticky top-[44px] z-10 flex items-center gap-0.5 px-3 py-1.5 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {[
          { label: "H1", action: () => execBlock("H1"), title: "Heading 1", icon: Heading1 },
          { label: "H2", action: () => execBlock("H2"), title: "Heading 2", icon: Heading2 },
        ].map(({ label, action, title, icon: Icon }) => (
          <button
            key={label}
            onMouseDown={(e) => { e.preventDefault(); action(); }}
            title={title}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-bold shrink-0"
          >
            {label}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
        {[
          { cmd: "bold", icon: Bold, title: "Bold" },
          { cmd: "italic", icon: Italic, title: "Italic" },
        ].map(({ cmd, icon: Icon, title }) => (
          <button
            key={cmd}
            onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
            title={title}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg transition-colors shrink-0",
              isActive(cmd)
                ? "bg-primary/10 text-primary"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
        {[
          { cmd: "insertUnorderedList", icon: List, title: "Bullet List" },
          { cmd: "insertOrderedList", icon: ListOrdered, title: "Numbered List" },
        ].map(({ cmd, icon: Icon, title }) => (
          <button
            key={cmd}
            onMouseDown={(e) => { e.preventDefault(); execCmd(cmd); }}
            title={title}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />
        <button
          onMouseDown={(e) => { e.preventDefault(); execCmd("removeFormat"); }}
          title="Clear formatting"
          className="flex items-center justify-center px-2 h-8 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[10px] font-medium shrink-0"
        >
          Clear
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 px-4 pt-5 pb-32 max-w-2xl mx-auto w-full">
        {/* Title */}
        <textarea
          ref={titleRef}
          placeholder="Untitled"
          rows={1}
          onInput={(e) => {
            autoResizeTitle();
            scheduleSave();
          }}
          className="w-full text-2xl font-bold text-gray-900 dark:text-gray-50 placeholder:text-gray-300 dark:placeholder:text-gray-700 resize-none border-none outline-none bg-transparent leading-tight mb-4 overflow-hidden"
          style={{ minHeight: "2.5rem" }}
        />

        {/* Body */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              // Let the default behavior handle Enter — creates a new paragraph
            }
          }}
          data-placeholder="Start writing..."
          className={cn(
            "min-h-[60vh] outline-none text-gray-700 dark:text-gray-300 leading-relaxed text-base",
            "prose prose-sm dark:prose-invert max-w-none",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:dark:text-gray-50 [&_h1]:mt-6 [&_h1]:mb-2",
            "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:dark:text-gray-100 [&_h2]:mt-5 [&_h2]:mb-2",
            "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1",
            "[&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-gray-50",
            "[&_em]:italic [&_em]:text-gray-700 [&_em]:dark:text-gray-300",
            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul_li]:my-0.5",
            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol_li]:my-0.5",
            "[&_p]:my-1 [&_br]:content-['']",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:dark:text-gray-700 empty:before:pointer-events-none"
          )}
        />
      </div>
    </div>
  );
}
