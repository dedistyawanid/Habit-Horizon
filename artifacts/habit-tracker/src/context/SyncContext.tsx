import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { runMigrationIfNeeded, flushQueue, getQueueSize } from "@/lib/sync";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

interface SyncContextValue {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  pendingCount: number;
  triggerSync: () => void;
  /** Lets external consumers (e.g. AuthContext cloud fetch) push status updates */
  setStatus: (s: SyncStatus) => void;
}

const SyncContext = createContext<SyncContextValue>({
  status: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
  triggerSync: () => {},
  setStatus: () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status,       setStatus]       = useState<SyncStatus>(
    navigator.onLine ? "syncing" : "offline"
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const syncingRef = useRef(false);

  const doSync = async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setStatus("syncing");
    try {
      await flushQueue(() => setPendingCount((n) => Math.max(0, n - 1)));
      const remaining = getQueueSize();
      setPendingCount(remaining);
      setStatus(remaining > 0 ? "error" : "synced");
      if (remaining === 0) setLastSyncedAt(new Date());
    } catch {
      setStatus("error");
    } finally {
      syncingRef.current = false;
    }
  };

  /* network events */
  useEffect(() => {
    const onOnline  = () => { setStatus("idle"); doSync(); };
    const onOffline = () => setStatus("offline");
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  /* initial sync on mount (push any queued offline ops) */
  useEffect(() => {
    async function init() {
      if (!navigator.onLine) { setStatus("offline"); return; }
      setStatus("syncing");
      try {
        await runMigrationIfNeeded();
        await flushQueue();
        setPendingCount(getQueueSize());
        setStatus("synced");
        setLastSyncedAt(new Date());
      } catch {
        setStatus("error");
      }
    }
    init();

    const interval = setInterval(() => {
      if (navigator.onLine) doSync();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SyncContext.Provider value={{ status, lastSyncedAt, pendingCount, triggerSync: doSync, setStatus }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncContext);
}
