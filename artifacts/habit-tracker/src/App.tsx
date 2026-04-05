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
import { Settings, RefreshCw, Rocket } from "lucide-react";
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

/** Thin 2px animated bar at the very top of the viewport while syncing. */
function SyncProgressBar({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 2,
        zIndex: 9999,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0, left: "-50%",
          width: "50%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, #556B2F, #6B8A3A, transparent)",
          animation: visible ? "syncSlide 1.2s ease-in-out infinite" : "none",
        }}
      />
      <style>{`@keyframes syncSlide { 0%{left:-50%} 100%{left:150%} }`}</style>
    </div>
  );
}

function AppShell() {
  const [settingsOpen,     setSettingsOpen]     = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [fabOpen,          setFabOpen]          = useState(false);
  const [notesSelecting,   setNotesSelecting]   = useState(false);

  /* Listen for Notes selection mode changes to hide/show FAB */
  useEffect(() => {
    function handler(e: Event) {
      setNotesSelecting((e as CustomEvent<{ active: boolean }>).detail.active);
    }
    window.addEventListener("notes-selection-change", handler);
    return () => window.removeEventListener("notes-selection-change", handler);
  }, []);
  const { onTouchStart, onTouchEnd, bouncingTab } = useSwipeNav();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { triggerSync, status: syncStatus } = useSyncStatus();
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

  const isSyncing = syncStatus === "syncing" || refreshing;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Thin top progress bar — replaces any full-screen loading overlay */}
      <SyncProgressBar visible={isSyncing} />

      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-header">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <Rocket className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-100 tracking-tight">Horizon Hub</span>
            <SyncIndicator />
          </div>

          <div className="flex items-center gap-2">
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

      <MultiFAB
        open={fabOpen}
        onToggle={() => setFabOpen((v) => !v)}
        onClose={() => setFabOpen(false)}
        onNewNote={() => { setFabOpen(false); setLocation("/notes?new=1"); }}
        onNewFinance={() => { setFabOpen(false); setLocation("/finance?new=1"); }}
        onQuickCheckin={() => { setFabOpen(false); setCheckinModalOpen(true); }}
        hidden={notesSelecting}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <QuickCheckinDialog open={checkinModalOpen} onClose={() => setCheckinModalOpen(false)} />
    </div>
  );
}

/* ── AuthGate: owns the appKey and refresh logic ── */
function AuthGate() {
  const { user, loading, hydratedAt } = useAuth();
  const [appKey,     setAppKey]     = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const prevHydratedAt = useState(0);

  /* Bump appKey whenever a background hydration cycle completes */
  useEffect(() => {
    if (hydratedAt > 0 && hydratedAt !== prevHydratedAt[0]) {
      prevHydratedAt[0] = hydratedAt;
      setAppKey((k) => k + 1);
    }
  }, [hydratedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshFromCloud = useCallback(async () => {
    if (!user || refreshing) return;
    setRefreshing(true);
    try {
      if (navigator.onLine) await flushQueue();
      const [syncResult, profile] = await Promise.all([
        fetchAllFromCloud(user.id),
        fetchProfile(user.id),
      ]);
      if (profile) applyProfileToLocalStorage(profile);
      if (syncResult !== "offline" && syncResult !== "error") {
        setAppKey((k) => k + 1);
      }
    } finally {
      setRefreshing(false);
    }
  }, [user, refreshing]);

  /* While Supabase auth check runs (fast, < 200ms) — show a minimal splash */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-end justify-center pb-12"
        style={{ background: "#F5F4F0" }}
      >
        {/* Slim progress bar at the very top */}
        <SyncProgressBar visible />
        {/* Minimal brand mark only — no blocking text */}
        <div className="flex flex-col items-center gap-2 opacity-60">
          <div
            className="w-10 h-10 rounded-[14px] flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #556B2F 0%, #6B8A3A 100%)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <p className="text-xs text-gray-400 font-medium">Habit Horizon</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    /*
     * WouterRouter is intentionally OUTSIDE AppProvider so that when appKey
     * increments (sync remount), the Router's location state is preserved.
     * Only the data/context layer remounts — navigation is untouched.
     */
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <RefreshProvider value={{ refreshing, refreshFromCloud }}>
        <AppProvider key={appKey}>
          <SyncProvider>
            <AppShell />
            <Toaster />
          </SyncProvider>
        </AppProvider>
      </RefreshProvider>
    </WouterRouter>
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
