import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { QuickNote } from "@/types/notes";
import { Maximize2, Minimize2, Bold, Italic, List } from "lucide-react";
import { cn } from "@/lib/utils";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  category: z.string().default("General"),
  content: z.string().max(5000).optional().default(""),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  reminderDate: z.string().optional().default(""),
  reminderEnabled: z.boolean().optional().default(false),
});

type NoteFormValues = z.infer<typeof noteSchema>;

const NOTE_CATEGORIES = ["General", "Work", "Personal", "Health", "Finance", "Ideas", "Shopping", "Travel", "Journal", "Script", "Tasks", "Other"];

interface QuickNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<QuickNote, "id" | "createdAt" | "updatedAt">) => void;
  initialValues?: Partial<QuickNote>;
  mode?: "add" | "edit";
}

function insertMarkdown(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  onChange: (v: string) => void
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.slice(start, end) || "text";
  const newText = text.slice(0, start) + before + selected + after + text.slice(end);
  onChange(newText);
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
  }, 0);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPreview(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)/gm, "• $1")
    .replace(/\n/g, "<br/>");
}

export function QuickNoteModal({ open, onClose, onSubmit, initialValues, mode = "add" }: QuickNoteModalProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      category: "General",
      content: "",
      url: "",
      reminderDate: "",
      reminderEnabled: false,
    },
  });

  const reminderEnabled = form.watch("reminderEnabled");
  const contentValue = form.watch("content");

  useEffect(() => {
    if (open) {
      form.reset({
        title: initialValues?.title || "",
        category: initialValues?.category || "General",
        content: initialValues?.content || "",
        url: initialValues?.url || "",
        reminderDate: initialValues?.reminderDate || "",
        reminderEnabled: initialValues?.reminderEnabled ?? false,
      });
      setFullscreen(false);
    }
  }, [open, initialValues, form]);

  function handleSubmit(values: NoteFormValues) {
    onSubmit({
      title: values.title,
      category: values.category,
      content: values.content || "",
      url: values.url || undefined,
      reminderDate: values.reminderEnabled && values.reminderDate ? values.reminderDate : undefined,
      reminderEnabled: values.reminderEnabled && !!values.reminderDate,
    });
    onClose();
  }

  function handleMarkdown(type: "bold" | "italic" | "list") {
    const ta = textareaRef.current;
    if (!ta) return;
    const onChange = (v: string) => form.setValue("content", v);
    if (type === "bold") insertMarkdown(ta, "**", "**", onChange);
    else if (type === "italic") insertMarkdown(ta, "*", "*", onChange);
    else if (type === "list") insertMarkdown(ta, "\n- ", "", onChange);
  }

  const contentHeight = fullscreen ? "min-h-[40vh]" : "min-h-[120px]";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "transition-all duration-300",
          fullscreen
            ? "!max-w-full !w-screen !h-screen !max-h-screen !rounded-none !m-0 !top-0 !left-0 !translate-x-0 !translate-y-0 overflow-y-auto"
            : "max-w-md w-full"
        )}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold">
              {mode === "add" ? "New Note" : "Edit Note"}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={fullscreen ? "Exit Full Screen" : "Full Screen Writing Mode"}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Note title..." {...field} className="text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NOTE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-1">
                    <FormLabel className="text-xs">
                      Content{" "}
                      <span className="text-gray-400 font-normal text-[10px]">(**bold**, *italic*, - list)</span>
                    </FormLabel>
                    <div className="flex gap-0.5">
                      {[
                        { type: "bold" as const, icon: Bold, title: "Bold" },
                        { type: "italic" as const, icon: Italic, title: "Italic" },
                        { type: "list" as const, icon: List, title: "List" },
                      ].map(({ type, icon: Icon, title }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleMarkdown(type)}
                          title={title}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <FormControl>
                    <textarea
                      {...field}
                      ref={(el) => {
                        textareaRef.current = el;
                        if (typeof field.ref === "function") field.ref(el);
                      }}
                      placeholder="Write your note here..."
                      className={cn(
                        "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm ring-offset-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono transition-all",
                        contentHeight
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Markdown preview in fullscreen */}
            {fullscreen && contentValue && (
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide font-semibold">Preview</p>
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderPreview(contentValue) }}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">
                    Link / URL{" "}
                    <span className="text-gray-400 font-normal text-[10px]">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Reminder</p>
                <p className="text-[10px] text-gray-500">Show on dashboard on the selected date</p>
              </div>
              <FormField
                control={form.control}
                name="reminderEnabled"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {reminderEnabled && (
              <FormField
                control={form.control}
                name="reminderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Reminder Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split("T")[0]}
                        className="text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1 text-sm">
                {mode === "add" ? "Save Note" : "Update Note"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-sm">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
