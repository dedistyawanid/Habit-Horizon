import { useState } from "react";
import { Plus, PenLine, Wallet, CheckCircle2, X } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface MultiFABProps {
  onNewNote: () => void;
  onNewFinance: () => void;
  onQuickCheckin: () => void;
}

export function MultiFAB({ onNewNote, onNewFinance, onQuickCheckin }: MultiFABProps) {
  const [open, setOpen] = useState(false);

  const actions = [
    { icon: PenLine, label: "New Note", emoji: "📝", onClick: onNewNote, color: "bg-emerald-500 hover:bg-emerald-600" },
    { icon: Wallet, label: "Finance Entry", emoji: "💸", onClick: onNewFinance, color: "bg-blue-500 hover:bg-blue-600" },
    { icon: CheckCircle2, label: "Quick Check-in", emoji: "✅", onClick: onQuickCheckin, color: "bg-amber-500 hover:bg-amber-600" },
  ];

  function handleAction(fn: () => void) {
    fn();
    setOpen(false);
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {/* Sub-actions */}
      {actions.map(({ icon: Icon, label, emoji, onClick, color }, i) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-2 transition-all duration-200",
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
          style={{ transitionDelay: open ? `${i * 50}ms` : "0ms" }}
        >
          <span className="bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-full shadow-md border border-gray-100 dark:border-gray-800 whitespace-nowrap">
            {label}
          </span>
          <button
            onClick={() => handleAction(onClick)}
            className={cn(
              "w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-lg transition-all active:scale-90",
              color
            )}
          >
            <Icon className="w-5 h-5" />
          </button>
        </div>
      ))}

      {/* Main FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl transition-all duration-300 active:scale-95",
          open && "rotate-45"
        )}
        aria-label="Actions"
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>

      {/* Backdrop to close */}
      {open && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
