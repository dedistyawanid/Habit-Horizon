import { useEffect } from "react";
import { Plus, PenLine, Wallet, CheckCircle2, X, Dumbbell } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface MultiFABProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNewNote: () => void;
  onNewFinance: () => void;
  onQuickCheckin: () => void;
}

const ACTIONS = [
  {
    icon: Dumbbell,
    label: "Log Activity",
    sublabel: "Workout · Run · More",
    color: "#556B2F",
    bg: "#556B2F18",
    key: "activity",
  },
  {
    icon: PenLine,
    label: "New Note",
    sublabel: "Write anything",
    color: "#3B82F6",
    bg: "#3B82F618",
    key: "note",
  },
  {
    icon: Wallet,
    label: "Finance",
    sublabel: "Income · Expense",
    color: "#10B981",
    bg: "#10B98118",
    key: "finance",
  },
  {
    icon: CheckCircle2,
    label: "Quick Check-in",
    sublabel: "Log habits now",
    color: "#F59E0B",
    bg: "#F59E0B18",
    key: "checkin",
  },
];

export function MultiFAB({ open, onToggle, onClose, onNewNote, onNewFinance, onQuickCheckin }: MultiFABProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleAction(key: string) {
    onClose();
    if (key === "activity") { setLocation("/health"); return; }
    if (key === "note")     { onNewNote();    return; }
    if (key === "finance")  { onNewFinance(); return; }
    if (key === "checkin")  { onQuickCheckin(); return; }
  }

  return (
    <>
      {/* Centered modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9990] bg-black/60 flex items-center justify-center p-6"
          onClick={onClose}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-card rounded-[28px] shadow-2xl overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Quick Log</p>
                <p className="text-xs text-gray-400 mt-0.5">What would you like to track?</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-3 px-4 pb-5">
              {ACTIONS.map(({ icon: Icon, label, sublabel, color, bg, key }) => (
                <button
                  key={key}
                  onClick={() => handleAction(key)}
                  className="flex flex-col items-start gap-2.5 p-4 rounded-[20px] text-left transition-all active:scale-[0.96] hover:brightness-95"
                  style={{ background: bg }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: color }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight" style={{ color }}>
                      {label}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
                      {sublabel}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAB trigger button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed bottom-20 right-4 z-[9999]",
          "w-14 h-14 rounded-2xl bg-primary text-primary-foreground",
          "flex items-center justify-center shadow-xl",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          open && "rotate-45"
        )}
        aria-label="Quick log"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
