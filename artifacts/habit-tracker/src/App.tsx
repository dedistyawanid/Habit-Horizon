import { useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SyncProvider } from "@/context/SyncContext";
import { BottomNav } from "@/components/BottomNav";
import { MultiFAB } from "@/components/MultiFAB";
import { SettingsModal } from "@/components/SettingsModal";
import { SyncIndicator } from "@/components/SyncIndicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSwipeNav } from "@/hooks/useSwipeNav";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import NotesPage from "@/pages/NotesPage";
import InsightsPage from "@/pages/InsightsPage";
import FinancePage from "@/pages/FinancePage";
import HealthPage from "@/pages/HealthPage";
import LoginPage from "@/pages/LoginPage";
import { Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { HabitCard } from "@/components/HabitCard";

const queryClient = new QueryClient();

function QuickCheckinDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { habitsWithStats, deleteHabit } = useApp();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick Check-in</DialogTitle>
        </DialogHeader>
        {habitsWithStats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No habits yet. Add habits from the main screen!</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {habitsWithStats.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                view="list"
                onEdit={() => {}}
                onDelete={deleteHabit}
                onRecap={() => {}}
                onNotes={() => {}}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AppShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const { onTouchStart, onTouchEnd, bouncingTab } = useSwipeNav();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Minimal top bar */}
      <header className="sticky top-0 z-30 glass-header">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-xs font-bold">D</span>
            </div>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-100 tracking-tight">Dedi's Tracker</span>
            <SyncIndicator />
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-9 h-9 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-sm hover:shadow-md transition-all"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Swipeable page content */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="select-none"
        style={{ touchAction: "pan-y" }}
      >
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/insights" component={InsightsPage} />
          <Route path="/finance" component={FinancePage} />
          <Route path="/health" component={HealthPage} />
          <Route path="/notes" component={NotesPage} />
          <Route component={NotFound} />
        </Switch>
      </div>

      <BottomNav bouncing={bouncingTab} />

      {location !== "/health" && (
        <MultiFAB
          onNewNote={() => setLocation("/notes?new=1")}
          onNewFinance={() => setLocation("/finance?new=1")}
          onQuickCheckin={() => setCheckinModalOpen(true)}
        />
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <QuickCheckinDialog open={checkinModalOpen} onClose={() => setCheckinModalOpen(false)} />
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F4F0" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center animate-pulse">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppProvider>
      <SyncProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppShell />
        </WouterRouter>
        <Toaster />
      </SyncProvider>
    </AppProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
