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
import { HabitCategory, HabitFrequency, Habit } from "@/types/habit";
import { HABIT_COLORS, getCategoryColor } from "@/lib/colors";

const habitSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(60, "Nama terlalu panjang"),
  category: z.enum(["Health", "Work", "Skill", "Finance", "Social", "Personal", "Other"] as const),
  description: z.string().max(200, "Deskripsi terlalu panjang").optional().default(""),
  frequency: z.enum(["Daily", "Weekly", "Monthly"] as const),
  color: z.string().optional().default("#7C9EBD"),
});

type HabitFormValues = z.infer<typeof habitSchema>;

const CATEGORIES: HabitCategory[] = ["Health", "Work", "Skill", "Finance", "Social", "Personal", "Other"];
const FREQUENCIES: HabitFrequency[] = ["Daily", "Weekly", "Monthly"];

const CATEGORY_LABELS: Record<HabitCategory, string> = {
  Health: "Kesehatan",
  Work: "Pekerjaan",
  Skill: "Keterampilan",
  Finance: "Keuangan",
  Social: "Sosial",
  Personal: "Pribadi",
  Other: "Lainnya",
};

const FREQUENCY_LABELS: Record<HabitFrequency, string> = {
  Daily: "Harian",
  Weekly: "Mingguan",
  Monthly: "Bulanan",
};

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Habit, "id" | "createdAt">) => void;
  initialValues?: Partial<Habit>;
  mode?: "add" | "edit";
}

export function HabitForm({ open, onClose, onSubmit, initialValues, mode = "add" }: HabitFormProps) {
  const form = useForm<HabitFormValues>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: initialValues?.name || "",
      category: initialValues?.category || "Health",
      description: initialValues?.description || "",
      frequency: initialValues?.frequency || "Daily",
      color: initialValues?.color || "#7C9EBD",
    },
  });

  useEffect(() => {
    if (open && initialValues) {
      form.reset({
        name: initialValues.name || "",
        category: initialValues.category || "Health",
        description: initialValues.description || "",
        frequency: initialValues.frequency || "Daily",
        color: initialValues.color || "#7C9EBD",
      });
    } else if (open && !initialValues) {
      form.reset({
        name: "",
        category: "Health",
        description: "",
        frequency: "Daily",
        color: "#7C9EBD",
      });
    }
  }, [open, initialValues, form]);

  function handleSubmit(values: HabitFormValues) {
    onSubmit({
      name: values.name,
      category: values.category,
      description: values.description || "",
      frequency: values.frequency,
      color: values.color || getCategoryColor(values.category),
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {mode === "add" ? "Tambah Kebiasaan Baru" : "Edit Kebiasaan"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kebiasaan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Olahraga pagi"
                      {...field}
                      data-testid="input-habit-name"
                    />
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
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </SelectItem>
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
                    <FormLabel>Frekuensi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue placeholder="Pilih frekuensi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {FREQUENCY_LABELS[f]}
                          </SelectItem>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi / Cheat Sheet <span className="text-gray-400 font-normal">(opsional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contoh: Push up 3x12 repetisi, istirahat 60 detik"
                      className="resize-none min-h-[80px]"
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
                  <FormLabel>Warna</FormLabel>
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
                {mode === "add" ? "Tambah" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
