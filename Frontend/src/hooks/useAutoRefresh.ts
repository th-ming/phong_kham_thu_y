import { useEffect, useRef } from "react";

type AutoRefreshOptions = {
  intervalMs?: number;
  refreshWhenHidden?: boolean;
  runImmediately?: boolean;
};

// Tăng từ 10s → 30s để giảm tải backend: 3x ít request hơn khi app mở nhiều tab
const DEFAULT_REFRESH_MS = 30_000;

export const useAutoRefresh = (
  refresh: () => void | Promise<void>,
  options: AutoRefreshOptions = {}
) => {
  const { intervalMs = DEFAULT_REFRESH_MS, refreshWhenHidden = false, runImmediately = true } = options;
  const refreshRef = useRef(refresh);
  const runningRef = useRef(false);
  // Debounce timer để tránh nhiều component cùng fire khi 1 event đến
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;

    const runRefresh = async () => {
      if (cancelled || runningRef.current) return;
      if (!refreshWhenHidden && document.visibilityState === "hidden") return;

      runningRef.current = true;
      try {
        await refreshRef.current();
      } finally {
        runningRef.current = false;
      }
    };

    // Debounced handler: gom nhiều event cùng lúc thành 1 lần gọi duy nhất sau 800ms
    const handleDataChanged = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        runRefresh();
      }, 800);
    };

    if (runImmediately) {
      runRefresh();
    }
    const timer = window.setInterval(runRefresh, intervalMs);

    window.addEventListener("rexi-data-changed", handleDataChanged);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("rexi-data-changed", handleDataChanged);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [intervalMs, refreshWhenHidden, runImmediately]);
};
