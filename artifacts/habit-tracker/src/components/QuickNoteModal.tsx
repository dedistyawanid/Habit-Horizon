import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { QuickNote } from "@/types/notes";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  category: z.string().default("General"),
  content: z.string().max(2000).optional().default(""),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  reminderDate: z.string().optional().default(""),
  reminderEnabled: z.boolean().optional().default(false),
});

type NoteFormValues = z.infer<typeof noteSchema>;

const NOTE_CATEGORIES = ["General", "Work", "Personal", "Health", "Finance", "Ideas", "Shopping", "Travel"];

interface QuickNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<QuickNote, "id" | "createdAt" | "updatedAt">) => void;
  initialValues?: Partial<QuickNote>;
  mode?: "add" | "edit";
}

export function QuickNoteModal({ open, onClose, onSubmit, initialValues, mode = "add" }: QuickNoteModalProps) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {mode === "add" ? "New Note" : "Edit Note"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Note title..." {...field} />
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
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Content{" "}
                    <span className="text-gray-400 font-normal text-xs">(supports **bold**, *italic*, - list)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your note here..."
                      className="resize-none min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Link / URL{" "}
                    <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Reminder</p>
                <p className="text-xs text-gray-500">Show on dashboard on the chosen date</p>
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
                    <FormLabel>Reminder Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1">
                {mode === "add" ? "Save Note" : "Update Note"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
