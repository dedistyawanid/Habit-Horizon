import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useSyncStatus, SyncStatus } from "@/context/SyncContext";
import { useEffect, useState } from "react";

const ACCENT = "#556B2F";

function StatusIcon({ status }: { status: SyncStatus }) {
  const [spin, setSpin] = useState(false);

  useEffect(() => {
    if (status === "syncing") {
      setSpin(true);
    } else {
      const t = setTimeout(() => setSpin(false), 400);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (status === "offline") return <CloudOff size={14} color="#9CA3AF" />;
  if (status === "error")   return <Cloud size={14} color="#EF4444" />;
  if (status === "syncing" || spin)
    return (
      <RefreshCw
        size={13}
        color={ACCENT}
        style={{ animation: "spin 1s linear infinite" }}
      />
    );
  if (status === "synced")  return <CheckCircle2 size={13} color={ACCENT} />;
  return <Cloud size={14} color="#9CA3AF" />;
}

export function SyncIndicator() {
  const { status, lastSyncedAt, pendingCount } = useSyncStatus();

  const label =
    status === "syncing"
      ? "Syncing…"
      : status === "synced"
      ? "Synced"
      : status === "offline"
      ? "Offline"
      : status === "error"
      ? `${pendingCount > 0 ? `${pendingCount} pending` : "Sync error"}`
      : "";

  const labelColor =
    status === "synced"
      ? ACCENT
      : status === "offline" || status === "idle"
      ? "#9CA3AF"
      : status === "error"
      ? "#EF4444"
      : ACCENT;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        color: labelColor,
        letterSpacing: "0.02em",
        opacity: status === "idle" ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
      title={lastSyncedAt ? `Last synced: ${lastSyncedAt.toLocaleTimeString()}` : undefined}
    >
      <StatusIcon status={status} />
      {label}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </span>
  );
}
