import { useEffect, useRef } from "react";

type AutoRefreshOptions = {
  intervalMs?: number;
  refreshWhenHidden?: boolean;
  runImmediately?: boolean;
};

const DEFAULT_REFRESH_MS = 10_000;

export const useAutoRefresh = (
  refresh: () => void | Promise<void>,
  options: AutoRefreshOptions = {}
) => {
  const { intervalMs = DEFAULT_REFRESH_MS, refreshWhenHidden = false, runImmediately = true } = options;
  const refreshRef = useRef(refresh);
  const runningRef = useRef(false);

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

    if (runImmediately) {
      runRefresh();
    }
    const timer = window.setInterval(runRefresh, intervalMs);
    const handleDataChanged = () => {
      runRefresh();
    };

    window.addEventListener("rexi-data-changed", handleDataChanged);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("rexi-data-changed", handleDataChanged);
    };
  }, [intervalMs, refreshWhenHidden, runImmediately]);
};
