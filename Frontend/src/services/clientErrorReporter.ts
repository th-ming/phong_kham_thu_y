type ClientErrorPayload = {
  type: string;
  message: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source?: string;
  path?: string;
  status?: number | string;
  method?: string;
  url?: string;
};

const sentRecently = new Map<string, number>();
const DEDUPE_MS = 30_000;

const isAdminSession = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const raw = [
      user?.role,
      user?.vai_tro,
      user?.ten_vai_tro,
      user?.id_vai_tro,
      user?.chuc_vu,
    ].filter(Boolean).join(" ").toLowerCase();
    return raw.includes("admin") || raw.includes("vt-1") || raw.includes("vt-admin");
  } catch {
    return false;
  }
};

const getUserLabel = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.ten_dang_nhap || user?.email || user?.id_tai_khoan || "admin");
  } catch {
    return "admin";
  }
};

const shouldSkip = (payload: ClientErrorPayload) => {
  if (!isAdminSession()) return true;
  if (payload.url?.includes("/api/system/client-error")) return true;
  const key = `${payload.type}|${payload.status || ""}|${payload.message}|${payload.path || location.pathname}`;
  const now = Date.now();
  const last = sentRecently.get(key) || 0;
  if (now - last < DEDUPE_MS) return true;
  sentRecently.set(key, now);
  return false;
};

export const reportClientError = (payload: ClientErrorPayload) => {
  if (shouldSkip(payload)) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  const body = JSON.stringify({
    ...payload,
    path: payload.path || `${location.pathname}${location.search}`,
    user: getUserLabel(),
    userAgent: navigator.userAgent,
    detectedAt: new Date().toISOString(),
  });

  fetch("/api/system/client-error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
    keepalive: body.length < 60_000,
  }).catch(() => {
    // Không để hệ thống báo lỗi tự gây thêm lỗi UI.
  });
};

export const reportAxiosError = (error: any) => {
  const status = error?.response?.status;
  if (!status || status < 400) return;
  const config = error?.config || {};
  reportClientError({
    type: "API_ERROR",
    severity: status >= 500 ? "HIGH" : "MEDIUM",
    status,
    method: String(config.method || "GET").toUpperCase(),
    url: String(config.url || ""),
    message: String(error?.response?.data?.message || error?.message || `API lỗi ${status}`),
    source: "axios",
  });
};

export const installClientErrorReporter = () => {
  window.addEventListener("error", (event) => {
    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLElement && (target as any).src) {
      reportClientError({
        type: "RESOURCE_ERROR",
        severity: "MEDIUM",
        message: `Không tải được tài nguyên ${(target as any).src}`,
        source: target.tagName,
        url: String((target as any).src || ""),
      });
      return;
    }
    reportClientError({
      type: "RUNTIME_ERROR",
      severity: "HIGH",
      message: event.message || "JavaScript runtime error",
      source: `${event.filename || "unknown"}:${event.lineno || 0}:${event.colno || 0}`,
    });
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportClientError({
      type: "UNHANDLED_PROMISE",
      severity: "HIGH",
      message: String(reason?.message || reason || "Unhandled promise rejection"),
      source: reason?.stack ? String(reason.stack).slice(0, 500) : "promise",
    });
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (!(node instanceof HTMLElement)) continue;
        const text = node.textContent?.trim() || "";
        const marker = node.matches?.("[role='alert'], .error, .alert-danger, .text-danger, [data-error='true']");
        if (marker && /lỗi|error|failed|thất bại|không thể|unauthorized|forbidden/i.test(text)) {
          reportClientError({
            type: "DOM_ERROR_ALERT",
            severity: "MEDIUM",
            message: text.slice(0, 500),
            source: node.tagName.toLowerCase(),
          });
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
};
