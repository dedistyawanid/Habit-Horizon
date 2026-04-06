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
import { Trash2 } from "lucide-react";
import { HabitFrequency, Habit } from "@/types/habit";
import { HABIT_COLORS } from "@/lib/colors";
import { useApp } from "@/context/AppContext";

const habitSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(200).optional().default(""),
  frequency: z.enum(["Daily", "Weekly", "Monthly"] as const),
  color: z.string().optional().default("#879A77"),
  monthlyTarget: z.string().optional(),
  weeklyStreakTarget: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitSchema>;
const FREQUENCIES: HabitFrequency[] = ["Daily", "Weekly", "Monthly"];

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Habit, "id" | "createdAt">) => void;
  onDelete?: () => void;
  initialValues?: Partial<Habit>;
  mode?: "add" | "edit";
}

export function HabitForm({ open, onClose, onSubmit, onDelete, initialValues, mode = "add" }: HabitFormProps) {
  const { settings } = useApp();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: "",
      category: settings.habitCategories[0] || "Health",
      description: "",
      frequency: "Daily",
      color: "#879A77",
      monthlyTarget: "",
      weeklyStreakTarget: "7",
    },
  });

  useEffect(() => {
    if (open) {
      setConfirmingDelete(false);
      form.reset({
        name: initialValues?.name || "",
        category: initialValues?.category || settings.habitCategories[0] || "Health",
        description: initialValues?.description || "",
        frequency: initialValues?.frequency || "Daily",
        color: initialValues?.color || "#879A77",
        monthlyTarget: initialValues?.monthlyTarget?.toString() || "",
        weeklyStreakTarget: initialValues?.weeklyStreakTarget?.toString() || "7",
      });
    }
  }, [open, initialValues, form, settings.habitCategories]);

  function handleSubmit(values: HabitFormValues) {
    const monthly = values.monthlyTarget ? parseInt(values.monthlyTarget) : undefined;
    const weekly = values.weeklyStreakTarget ? parseInt(values.weeklyStreakTarget) : 7;
    onSubmit({
      name: values.name,
      category: values.category as Habit["category"],
      description: values.description || "",
      frequency: values.frequency,
      color: values.color || "#879A77",
      monthlyTarget: monthly && !isNaN(monthly) && monthly > 0 ? monthly : undefined,
      weeklyStreakTarget: !isNaN(weekly) && weekly > 0 ? weekly : 7,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {mode === "add" ? "Add New Habit" : "Edit Habit"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Morning workout" {...field} data-testid="input-habit-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Choose category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {settings.habitCategories.map((cat) => (
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="monthlyTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Goal <span className="text-gray-400 font-normal text-xs">(optional)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" placeholder="e.g. 20" {...field} data-testid="input-habit-target" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weeklyStreakTarget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Streak Block <span className="text-gray-400 font-normal text-xs">(days)</span></FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="30" placeholder="7" {...field} data-testid="input-streak-target" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-gray-400 font-normal text-xs">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Push-up 3×12 reps" className="resize-none min-h-[60px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {HABIT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className="w-6 h-6 rounded-full border-2 transition-all"
                          style={{
                            backgroundColor: color,
                            borderColor: field.value === color ? "#374151" : "transparent",
                            transform: field.value === color ? "scale(1.25)" : "scale(1)",
                          }}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" data-testid="btn-submit-habit">
                {mode === "add" ? "Add Habit" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            </div>

            {mode === "edit" && onDelete && (
              <div className="pt-1">
                {confirmingDelete ? (
                  <div className="rounded-2xl border border-[#ac6e5c]/30 bg-[#ac6e5c]/8 dark:bg-[#ac6e5c]/10 p-3">
                    <p className="text-sm text-center text-[#ac6e5c] font-medium mb-2.5">
                      Delete this habit and all its history?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { onDelete(); onClose(); }}
                        className="flex-1 rounded-xl py-2 text-sm font-semibold text-white bg-[#ac6e5c] hover:bg-[#9a5f4d] transition-colors active:scale-[0.97]"
                        data-testid="btn-confirm-delete-habit"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="flex-1 rounded-xl py-2 text-sm font-medium text-muted-foreground bg-muted hover:bg-muted/80 transition-colors"
                      >
                        Keep It
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-medium text-[#ac6e5c] border border-[#ac6e5c]/30 hover:bg-[#ac6e5c]/8 dark:hover:bg-[#ac6e5c]/12 transition-colors"
                    data-testid="btn-delete-habit"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Habit
                  </button>
                )}
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
