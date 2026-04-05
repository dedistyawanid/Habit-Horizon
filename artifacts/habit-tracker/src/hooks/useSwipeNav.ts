import { useRef, useCallback, useState } from "react";
import { useLocation } from "wouter";

const TAB_ORDER = ["/", "/insights", "/finance", "/notes"];
const SWIPE_THRESHOLD = 60;
const SWIPE_TIME_LIMIT = 400;

export function useSwipeNav() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [bouncingTab, setBouncingTab] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  function triggerBounce(path: string) {
    setBouncingTab(path);
    setTimeout(() => setBouncingTab(null), 600);
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;

      if (dt > SWIPE_TIME_LIMIT) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.75) return;

      const currentIndex = TAB_ORDER.indexOf(location);
      if (currentIndex === -1) return;

      if (dx < 0 && currentIndex < TAB_ORDER.length - 1) {
        const next = TAB_ORDER[currentIndex + 1];
        setLocation(next);
        triggerBounce(next);
      } else if (dx > 0 && currentIndex > 0) {
        const prev = TAB_ORDER[currentIndex - 1];
        setLocation(prev);
        triggerBounce(prev);
      }
    },
    [location, setLocation]
  );

  return { onTouchStart, onTouchEnd, bouncingTab };
}
