"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Shared live-update mechanism (rules.md §5): polls `url` every
// `intervalMs` while the tab is visible, and pauses while hidden. Exposes
// `refetch` so callers can force an immediate refresh right after a write
// of their own, instead of waiting for the next tick.
export function usePolling<T>(url: string, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const refetch = useCallback(async () => {
    const res = await fetch(url);
    if (!res.ok) return;
    setData((await res.json()) as T);
  }, [url]);

  useEffect(() => {
    function start() {
      refetch();
      timerRef.current = setInterval(refetch, intervalMs);
    }
    function stop() {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs, refetch]);

  return { data, refetch };
}
