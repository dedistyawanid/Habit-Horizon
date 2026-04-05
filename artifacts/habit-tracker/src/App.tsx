import { useState, useEffect, useCallback } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SyncProvider, useSyncStatus } from "@/context/SyncContext";
import { RefreshProvider, useRefresh } from "@/context/RefreshContext";
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
import { Settings, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { HabitCard } from "@/components/HabitCard";
import { useToast } from "@/hooks/use-toast";
import { fetchAllFromCloud, fetchProfile, applyProfileToLocalStorage } from "@/lib/fetchFromCloud";
import { flushQueue } from "@/lib/sync";

const queryClient = new QueryClient();
const SYNC_TOAST_KEY = "dedi_sync_toast";

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
  const [settingsOpen,     setSettingsOpen]     = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const { onTouchStart, onTouchEnd, bouncingTab } = useSwipeNav();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { triggerSync } = useSyncStatus();
  const { refreshFromCloud, refreshing } = useRefresh();

  /* Show deferred sync toast + immediate queue flush on mount */
  useEffect(() => {
    const pending = sessionStorage.getItem(SYNC_TOAST_KEY);
    if (pending) {
      sessionStorage.removeItem(SYNC_TOAST_KEY);
      try {
        const { title, description } = JSON.parse(pending);
        setTimeout(() => toast({ title, description }), 600);
      } catch { /* ignore */ }
    }
    if (navigator.onLine) triggerSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleManualRefresh() {
    if (refreshing) return;
    await refreshFromCloud();
    toast({
      title: "Sync complete",
      description: "Local changes pushed & cloud data refreshed.",
    });
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-header">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-xs font-bold">D</span>
            </div>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-100 tracking-tight">Dedi's Tracker</span>
            <SyncIndicator />
          </div>

          <div className="flex items-center gap-2">
            {/* Two-way sync button: push local → pull cloud */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
              aria-label="Sync data"
              title={refreshing ? "Syncing…" : "Push local changes & pull cloud data"}
            >
              <RefreshCw className={`w-4 h-4 transition-transform ${refreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="w-9 h-9 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-sm hover:shadow-md transition-all"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
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

/* ── AuthGate: owns the appKey and refresh logic ── */
function AuthGate() {
  const { user, loading } = useAuth();
  const [appKey,     setAppKey]     = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refreshFromCloud = useCallback(async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      /* ① Push any locally-queued offline ops first */
      if (navigator.onLine) await flushQueue();

      /* ② Pull everything from Supabase into localStorage */
      const [syncResult, profile] = await Promise.all([
        fetchAllFromCloud(user.id),
        fetchProfile(user.id),
      ]);
      if (profile) applyProfileToLocalStorage(profile);
      if (syncResult !== "offline" && syncResult !== "error") {
        /* Re-mount AppProvider so all hooks re-init from fresh localStorage */
        setAppKey((k) => k + 1);
      }
    } finally {
      setRefreshing(false);
    }
  }, [user, refreshing]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F4F0" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-[18px] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #556B2F 0%, #6B8A3A 100%)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-semibold text-gray-700">Syncing from cloud…</p>
            <p className="text-xs text-gray-400">Habit Horizon</p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <RefreshProvider value={{ refreshing, refreshFromCloud }}>
      <AppProvider key={appKey}>
        <SyncProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppShell />
          </WouterRouter>
          <Toaster />
        </SyncProvider>
      </AppProvider>
    </RefreshProvider>
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
