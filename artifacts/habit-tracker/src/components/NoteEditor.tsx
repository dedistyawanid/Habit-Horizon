import { useEffect, useRef, useCallback, useState } from "react";
import {
  ArrowLeft, Trash2, Bold, Italic, Heading1, Heading2,
  List, ListOrdered, Link2, Bell, Check, Clock, X,
} from "lucide-react";
import { QuickNote } from "@/types/notes";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  note: QuickNote;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<Omit<QuickNote, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}

type SaveStatus = "saved" | "saving";

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

const CATEGORIES = [
  "General", "Work", "Personal", "Health", "Finance",
  "Ideas", "Shopping", "Travel", "Journal", "Script", "Tasks", "Other",
];

const CAT_COLORS: Record<string, string> = {
  General: "#879A77", Work: "#3b82f6", Personal: "#ec4899", Health: "#10b981",
  Finance: "#f59e0b", Ideas: "#8b5cf6", Shopping: "#06b6d4", Travel: "#f97316",
  Journal: "#9BB5A0", Script: "#B8A9C9", Tasks: "#C9C5A8", Other: "#C9B5A8",
};

function fmtReminderDate(str: string): string {
  try {
    const d = new Date(str + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return str; }
}

export function NoteEditor({ note, onBack, onUpdate, onDelete }: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef  = useRef<HTMLTextAreaElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef(note.id);

  const [saveStatus,         setSaveStatus]         = useState<SaveStatus>("saved");
  const [category,           setCategory]           = useState(note.category);
  const [url,                setUrl]                = useState(note.url || "");
  const [reminderDate,       setReminderDate]       = useState(note.reminderDate || "");
  const [reminderEnabled,    setReminderEnabled]    = useState(note.reminderEnabled ?? false);
  const [confirmDelete,      setConfirmDelete]      = useState(false);
  const [showUrlInput,       setShowUrlInput]       = useState(!!(note.url));
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [pickerDate,         setPickerDate]         = useState(note.reminderDate || "");

  /* ── Save logic ── */
  const doSave = useCallback(() => {
    if (!editorRef.current || !titleRef.current) return;
    onUpdate(noteIdRef.current, {
      content: editorRef.current.innerHTML,
      title: titleRef.current.value.trim() || "Untitled",
    });
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

  /* ── Init on note change ── */
  useEffect(() => {
    noteIdRef.current = note.id;
    if (editorRef.current) editorRef.current.innerHTML = initContent(note.content);
    if (titleRef.current) {
      titleRef.current.value = note.title;
      autoResizeTitle();
    }
    setCategory(note.category);
    setUrl(note.url || "");
    setShowUrlInput(!!(note.url));
    setReminderDate(note.reminderDate || "");
    setPickerDate(note.reminderDate || "");
    setReminderEnabled(note.reminderEnabled ?? false);
    setSaveStatus("saved");
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

  /* ── Flush on unmount ── */
  useEffect(() => {
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); doSave(); }
    };
  }, [doSave]);

  function autoResizeTitle() {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = titleRef.current.scrollHeight + "px";
    }
  }

  function execCmd(cmd: string) {
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    scheduleSave();
  }

  function execBlock(tag: string) {
    editorRef.current?.focus();
    document.execCommand("formatBlock", false, tag);
    scheduleSave();
  }

  function isActive(cmd: string): boolean {
    try { return document.queryCommandState(cmd); } catch { return false; }
  }

  function handleDeleteClick() {
    if (confirmDelete) { onDelete(note.id); onBack(); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
  }

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    saveMeta({ category: cat });
  }

  function handleUrlBlur() {
    saveMeta({ url: url || undefined });
    if (!url) setShowUrlInput(false);
  }

  function handleReminderConfirm() {
    const enabled = !!pickerDate;
    setReminderEnabled(enabled);
    setReminderDate(pickerDate);
    saveMeta({ reminderEnabled: enabled, reminderDate: pickerDate || undefined });
    setShowReminderPicker(false);
  }

  function handleReminderClear() {
    setReminderEnabled(false);
    setReminderDate("");
    setPickerDate("");
    saveMeta({ reminderEnabled: false, reminderDate: undefined });
    setShowReminderPicker(false);
  }

  const catColor = CAT_COLORS[category] || "#879A77";
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-gray-950">

      {/* ── Header block (3 rows, always visible) ── */}
      <div className="shrink-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">

        {/* Row 1: Navigation */}
        <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              {saveStatus === "saving" ? (
                <><Clock className="w-2.5 h-2.5 animate-pulse" /> Saving…</>
              ) : (
                <><Check className="w-2.5 h-2.5 text-emerald-500" /> Saved</>
              )}
            </div>
          </div>

          <button
            onClick={handleDeleteClick}
            className={cn(
              "p-1.5 rounded-xl transition-colors",
              confirmDelete
                ? "bg-red-50 text-red-500 dark:bg-red-900/20"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            )}
            title={confirmDelete ? "Tap again to confirm delete" : "Delete note"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Category horizontal scroll */}
        <div
          className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                "shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                category === cat
                  ? "text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
              style={category === cat ? { backgroundColor: catColor } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Row 3: Slim meta row — URL + Reminder */}
        <div className="flex items-center gap-1.5 px-3 pb-2">
          {/* URL toggle */}
          <button
            onClick={() => { setShowUrlInput((v) => !v); }}
            className={cn(
              "p-1.5 rounded-lg transition-colors shrink-0",
              showUrlInput || url
                ? "text-primary bg-primary/10"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title={url ? url : "Add reference URL"}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          {showUrlInput ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              placeholder="https://..."
              autoFocus
              className="flex-1 min-w-0 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          ) : url ? (
            <span className="flex-1 min-w-0 text-xs text-primary truncate">{url}</span>
          ) : (
            <div className="flex-1" />
          )}

          {/* Reminder bell */}
          <button
            onClick={() => { setPickerDate(reminderDate); setShowReminderPicker(true); }}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors shrink-0",
              reminderEnabled
                ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="Set reminder"
          >
            <Bell className="w-3.5 h-3.5" />
            {reminderEnabled && reminderDate && (
              <span className="text-[10px] font-medium">{fmtReminderDate(reminderDate)}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Scrollable content area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-4 pb-6 max-w-2xl mx-auto">
          {/* Title */}
          <textarea
            ref={titleRef}
            placeholder="Untitled"
            rows={1}
            onInput={() => { autoResizeTitle(); scheduleSave(); }}
            className="w-full text-[1.65rem] font-bold text-gray-900 dark:text-gray-50 placeholder:text-gray-300 dark:placeholder:text-gray-700 resize-none border-none outline-none bg-transparent leading-tight mb-3 overflow-hidden"
            style={{ minHeight: "2.5rem" }}
          />

          {/* Body */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={scheduleSave}
            data-placeholder="Start writing…"
            className={cn(
              "min-h-[50vh] outline-none text-gray-700 dark:text-gray-300 leading-relaxed text-base",
              "prose prose-sm dark:prose-invert max-w-none",
              "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:dark:text-gray-50 [&_h1]:mt-6 [&_h1]:mb-2",
              "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:dark:text-gray-100 [&_h2]:mt-5 [&_h2]:mb-2",
              "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1",
              "[&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-gray-50",
              "[&_em]:italic [&_em]:text-gray-700 [&_em]:dark:text-gray-300",
              "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul_li]:my-0.5",
              "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol_li]:my-0.5",
              "[&_p]:my-1",
              "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:dark:text-gray-700 empty:before:pointer-events-none"
            )}
          />
        </div>
      </div>

      {/* ── Sticky bottom formatting toolbar ── */}
      <div className="shrink-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        <div className="flex items-center gap-0.5 px-3 py-1.5 max-w-2xl mx-auto">
          {/* Headings */}
          {[
            { label: "H1", action: () => execBlock("H1"), title: "Heading 1" },
            { label: "H2", action: () => execBlock("H2"), title: "Heading 2" },
          ].map(({ label, action, title }) => (
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

          {/* Bold / Italic */}
          {[
            { cmd: "bold",   icon: Bold,   title: "Bold" },
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

          {/* Lists */}
          {[
            { cmd: "insertUnorderedList", icon: List,          title: "Bullet List" },
            { cmd: "insertOrderedList",   icon: ListOrdered,   title: "Numbered List" },
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
      </div>

      {/* ── Reminder date picker (bottom-sheet modal) ── */}
      {showReminderPicker && (
        <div
          className="absolute inset-0 z-10 flex flex-col justify-end"
          onClick={() => setShowReminderPicker(false)}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* Sheet */}
          <div
            className="relative z-10 bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Set Reminder
              </p>
              <button
                onClick={() => setShowReminderPicker(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="date"
              value={pickerDate}
              onChange={(e) => setPickerDate(e.target.value)}
              min={today}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={handleReminderClear}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleReminderConfirm}
                disabled={!pickerDate}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
