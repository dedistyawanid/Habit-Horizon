import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { QuickNote } from "@/types/notes";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  category: z.string().min(1, "Category is required"),
  content: z.string().min(1, "Content is required"),
});

type NoteFormValues = z.infer<typeof noteSchema>;

interface QuickNoteModalProps {
  open: boolean;
  onClose: () => void;
  editNote?: QuickNote | null;
}

export function QuickNoteModal({ open, onClose, editNote }: QuickNoteModalProps) {
  const { settings, addNote, updateNote } = useApp();
  const isEdit = !!editNote;

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      category: settings.noteCategories[0] || "Ideas",
      content: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: editNote?.title || "",
        category: editNote?.category || settings.noteCategories[0] || "Ideas",
        content: editNote?.content || "",
      });
    }
  }, [open, editNote, form, settings.noteCategories]);

  function handleSubmit(values: NoteFormValues) {
    if (isEdit && editNote) {
      updateNote(editNote.id, values);
    } else {
      addNote(values);
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isEdit ? "Edit Note" : "Quick Note"}
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
                    <Input placeholder="Note title..." {...field} data-testid="input-note-title" autoFocus />
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
                      <SelectTrigger data-testid="select-note-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {settings.noteCategories.map((cat) => (
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
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your note here..."
                      className="min-h-[140px] resize-none"
                      {...field}
                      data-testid="input-note-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" data-testid="btn-save-note">
                {isEdit ? "Save Changes" : "Add Note"}
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
