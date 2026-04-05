import { useState } from "react";
import { Tag, Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  categories: string[];
  onAdd: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDelete: (name: string) => void;
}

export function CategoryManager({
  open, onClose, title, categories, onAdd, onRename, onDelete,
}: CategoryManagerProps) {
  const [newCat, setNewCat] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onAdd(trimmed);
    setNewCat("");
  }

  function startEdit(cat: string) {
    setEditingCat(cat);
    setEditValue(cat);
  }

  function commitEdit(cat: string) {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== cat && !categories.includes(trimmed)) {
      onRename(cat, trimmed);
    }
    setEditingCat(null);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Tag className="w-4 h-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {categories.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No categories yet. Add one below.</p>
          )}

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2"
              >
                {editingCat === cat ? (
                  <>
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(cat);
                        if (e.key === "Escape") setEditingCat(null);
                      }}
                      className="h-6 text-sm flex-1 border-none bg-transparent p-0 focus-visible:ring-0"
                      autoFocus
                    />
                    <button onClick={() => commitEdit(cat)} className="text-emerald-500 hover:text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingCat(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                    <button onClick={() => startEdit(cat)} className="text-gray-400 hover:text-gray-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(cat)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Input
              placeholder="New category name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              className="text-sm"
            />
            <Button size="sm" onClick={handleAdd} variant="outline">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
