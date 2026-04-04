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
import { HabitFrequency, Habit } from "@/types/habit";
import { HABIT_COLORS } from "@/lib/colors";
import { useApp } from "@/context/AppContext";

const habitSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Name is too long"),
  category: z.string().min(1, "Category is required"),
  description: z.string().max(200, "Description is too long").optional().default(""),
  frequency: z.enum(["Daily", "Weekly", "Monthly"] as const),
  color: z.string().optional().default("#7C9EBD"),
  monthlyTarget: z.string().optional(),
});

type HabitFormValues = z.infer<typeof habitSchema>;

const FREQUENCIES: HabitFrequency[] = ["Daily", "Weekly", "Monthly"];

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Habit, "id" | "createdAt">) => void;
  initialValues?: Partial<Habit>;
  mode?: "add" | "edit";
}

export function HabitForm({ open, onClose, onSubmit, initialValues, mode = "add" }: HabitFormProps) {
  const { settings } = useApp();

  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: initialValues?.name || "",
      category: initialValues?.category || settings.habitCategories[0] || "Health",
      description: initialValues?.description || "",
      frequency: initialValues?.frequency || "Daily",
      color: initialValues?.color || "#7C9EBD",
      monthlyTarget: initialValues?.monthlyTarget?.toString() || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues?.name || "",
        category: initialValues?.category || settings.habitCategories[0] || "Health",
        description: initialValues?.description || "",
        frequency: initialValues?.frequency || "Daily",
        color: initialValues?.color || "#7C9EBD",
        monthlyTarget: initialValues?.monthlyTarget?.toString() || "",
      });
    }
  }, [open, initialValues, form, settings.habitCategories]);

  function handleSubmit(values: HabitFormValues) {
    const target = values.monthlyTarget ? parseInt(values.monthlyTarget) : undefined;
    onSubmit({
      name: values.name,
      category: values.category as Habit["category"],
      description: values.description || "",
      frequency: values.frequency,
      color: values.color || "#7C9EBD",
      monthlyTarget: target && !isNaN(target) && target > 0 ? target : undefined,
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
                          <SelectValue placeholder="Choose frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
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
              name="monthlyTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Monthly Goal <span className="text-gray-400 font-normal">(optional — e.g. "20 times this month")</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="e.g. 20"
                      {...field}
                      data-testid="input-habit-target"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description / Cheat Sheet <span className="text-gray-400 font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Push-up 3x12 reps, rest 60 seconds"
                      className="resize-none min-h-[70px]"
                      {...field}
                      data-testid="input-habit-description"
                    />
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
                          className="w-7 h-7 rounded-full border-2 transition-all"
                          style={{
                            backgroundColor: color,
                            borderColor: field.value === color ? "#374151" : "transparent",
                            transform: field.value === color ? "scale(1.2)" : "scale(1)",
                          }}
                          data-testid={`color-btn-${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" data-testid="btn-submit-habit">
                {mode === "add" ? "Add Habit" : "Save Changes"}
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
