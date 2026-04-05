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
}

const SyncContext = createContext<SyncContextValue>({
  status: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
  triggerSync: () => {},
});

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>(
    navigator.onLine ? "idle" : "offline"
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

  useEffect(() => {
    const onOnline = () => { setStatus("idle"); doSync(); };
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    async function init() {
      if (!navigator.onLine) return;
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
    <SyncContext.Provider
      value={{ status, lastSyncedAt, pendingCount, triggerSync: doSync }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncContext);
}
