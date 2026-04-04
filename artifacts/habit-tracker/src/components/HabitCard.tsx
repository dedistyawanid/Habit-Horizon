import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Pencil, Trash2, StickyNote, Calendar, Flame, Trophy } from "lucide-react";
import { HabitWithStats } from "@/types/habit";
import { useApp } from "@/context/AppContext";
import { getTodayKey } from "@/lib/dateUtils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ConfettiEffect } from "@/components/ConfettiEffect";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: HabitWithStats;
  view: "grid" | "list";
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (id: string) => void;
  onRecap: (habit: HabitWithStats) => void;
}

function getMilestone(streak: number): string | null {
  if (streak === 30) return "30-Day Streak!";
  if (streak === 7) return "7-Day Streak!";
  return null;
}

export function HabitCard({ habit, view, onEdit, onDelete, onRecap }: HabitCardProps) {
  const { isCheckedInToday, toggleCheckIn, getCheckInForDate, updateCheckInNotes } = useApp();
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [milestone, setMilestone] = useState<string | null>(null);

  const checkedToday = isCheckedInToday(habit.id);
  const today = getTodayKey();
  const existingCheckIn = getCheckInForDate(habit.id, today);
  const catColor = habit.color || "#7C9EBD";

  const targetProgress = habit.monthlyTarget
    ? Math.min(100, Math.round((habit.completionThisMonth / habit.monthlyTarget) * 100))
    : null;

  function handleCheckIn() {
    if (checkedToday) {
      toggleCheckIn(habit.id);
    } else {
      toggleCheckIn(habit.id, notesText);
      setNotesText("");
      setShowNotes(false);
      const nextStreak = habit.currentStreak + 1;
      const m = getMilestone(nextStreak);
      if (m) {
        setMilestone(m);
        setShowConfetti(true);
      }
    }
  }

  function handleSaveNotes() {
    if (existingCheckIn) {
      updateCheckInNotes(existingCheckIn.id, notesText || existingCheckIn.notes);
    }
    setShowNotes(false);
  }

  function handleNotesOpen() {
    if (existingCheckIn) setNotesText(existingCheckIn.notes);
    setShowNotes((v) => !v);
  }

  const streakBadge = habit.currentStreak >= 7
    ? <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500"><Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-500" />{habit.currentStreak}</span>
    : <span className="text-xs text-gray-400">🔥 {habit.currentStreak}</span>;

  if (view === "list") {
    return (
      <>
        <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
        {showConfetti && milestone && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl animate-bounce flex items-center gap-2">
            <Trophy className="w-5 h-5" /> {milestone}
          </div>
        )}
        <div
          data-testid={`habit-card-${habit.id}`}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center gap-4 hover:shadow-md transition-all duration-200"
        >
          <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
          <button
            data-testid={`checkin-btn-${habit.id}`}
            onClick={handleCheckIn}
            className="flex-shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
          >
            {checkedToday ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            ) : (
              <Circle className="w-7 h-7 text-gray-300 dark:text-gray-600" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("font-semibold text-gray-800 dark:text-gray-100 truncate", checkedToday && "line-through text-gray-400")}>
                {habit.name}
              </span>
              <Badge variant="secondary" className="text-xs py-0 px-2 flex-shrink-0" style={{ backgroundColor: catColor + "33", color: catColor }}>
                {habit.category}
              </Badge>
              <Badge variant="outline" className="text-xs py-0 px-2 flex-shrink-0">{habit.frequency}</Badge>
            </div>
            {habit.description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{habit.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 max-w-[160px]">
                <Progress value={habit.completionPercentage} className="h-1.5" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {habit.completionThisMonth}/{habit.totalDaysThisMonth} this month
              </span>
              {streakBadge}
            </div>
            {targetProgress !== null && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 max-w-[160px] h-1 rounded-full overflow-hidden" style={{ backgroundColor: catColor + "33" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${targetProgress}%`, backgroundColor: catColor }} />
                </div>
                <span className="text-xs text-gray-400">Target: {habit.completionThisMonth}/{habit.monthlyTarget}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNotesOpen} data-testid={`notes-btn-${habit.id}`}>
              <StickyNote className="w-4 h-4 text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRecap(habit)} data-testid={`recap-btn-${habit.id}`}>
              <Calendar className="w-4 h-4 text-gray-400" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(habit)} data-testid={`edit-btn-${habit.id}`}>
              <Pencil className="w-4 h-4 text-gray-400" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => {
                if (confirmDelete) { onDelete(habit.id); } else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
              }}
              data-testid={`delete-btn-${habit.id}`}
            >
              <Trash2 className={cn("w-4 h-4", confirmDelete ? "text-red-500" : "text-gray-400")} />
            </Button>
          </div>
          {showNotes && (
            <div className="col-span-full w-full mt-2">
              <Textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Add a note for today..."
                className="text-sm min-h-[80px]"
                data-testid={`notes-textarea-${habit.id}`}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={checkedToday ? handleSaveNotes : handleCheckIn} className="flex-1">
                  {checkedToday ? "Save Note" : "Check In + Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowNotes(false)} className="flex-1">Close</Button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      {showConfetti && milestone && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl animate-bounce flex items-center gap-2">
          <Trophy className="w-5 h-5" /> {milestone}
        </div>
      )}
      <div
        data-testid={`habit-card-${habit.id}`}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-3 hover:shadow-lg transition-all duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
              <span className={cn("font-semibold text-gray-800 dark:text-gray-100", checkedToday && "line-through text-gray-400")}>
                {habit.name}
              </span>
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <Badge variant="secondary" className="text-xs py-0 px-2" style={{ backgroundColor: catColor + "33", color: catColor }}>
                {habit.category}
              </Badge>
              <Badge variant="outline" className="text-xs py-0 px-2">{habit.frequency}</Badge>
            </div>
            {habit.description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-2">{habit.description}</p>
            )}
          </div>
          <button
            data-testid={`checkin-btn-${habit.id}`}
            onClick={handleCheckIn}
            className="ml-2 flex-shrink-0 transition-transform duration-150 hover:scale-110 active:scale-95"
          >
            {checkedToday ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            ) : (
              <Circle className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            )}
          </button>
        </div>

        {/* Completion progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Monthly progress</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{habit.completionPercentage}%</span>
          </div>
          <Progress value={habit.completionPercentage} className="h-2" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">{habit.completionThisMonth}/{habit.totalDaysThisMonth} done</span>
            {habit.currentStreak >= 7 ? (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-orange-500">
                <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-500" />
                {habit.currentStreak} day streak
              </span>
            ) : (
              <span className="text-xs text-amber-500">🔥 {habit.currentStreak}</span>
            )}
          </div>
        </div>

        {/* Monthly target progress */}
        {targetProgress !== null && habit.monthlyTarget && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Monthly Goal
              </span>
              <span className="text-xs font-semibold" style={{ color: catColor }}>{habit.completionThisMonth}/{habit.monthlyTarget}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: catColor + "33" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%`, backgroundColor: catColor }}
              />
            </div>
          </div>
        )}

        {showNotes && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add a note for today..."
              className="text-sm min-h-[70px]"
              data-testid={`notes-textarea-${habit.id}`}
            />
            <div className="flex gap-2 mt-2">
              {checkedToday ? (
                <Button size="sm" onClick={handleSaveNotes} className="flex-1">Save Note</Button>
              ) : (
                <Button size="sm" onClick={handleCheckIn} className="flex-1">Check In + Save</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowNotes(false)} className="flex-1">Close</Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-1 pt-1 border-t border-gray-50 dark:border-gray-800">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNotesOpen} data-testid={`notes-btn-${habit.id}`}>
            <StickyNote className="w-3.5 h-3.5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRecap(habit)} data-testid={`recap-btn-${habit.id}`}>
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(habit)} data-testid={`edit-btn-${habit.id}`}>
            <Pencil className="w-3.5 h-3.5 text-gray-400" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => {
              if (confirmDelete) { onDelete(habit.id); } else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }
            }}
            data-testid={`delete-btn-${habit.id}`}
          >
            <Trash2 className={cn("w-3.5 h-3.5", confirmDelete ? "text-red-500" : "text-gray-400")} />
          </Button>
        </div>
      </div>
    </>
  );
}
