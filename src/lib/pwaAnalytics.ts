/**
 * Lightweight PWA install analytics.
 * Persists a rolling log in localStorage and forwards to any
 * globally registered handler (window.gtag / window.plausible / etc.)
 * without introducing a new dependency.
 */
export type PwaEvent =
  | "prompt_available"
  | "prompt_shown"
  | "prompt_accepted"
  | "prompt_dismissed"
  | "manual_guide_shown"
  | "installed"
  | "already_standalone";

const KEY = "pwa_events_log";
const MAX = 100;

interface LogEntry {
  event: PwaEvent;
  at: number;
  platform: string;
  meta?: Record<string, unknown>;
}

export function trackPwaEvent(event: PwaEvent, meta?: Record<string, unknown>) {
  try {
    const platform = typeof navigator !== "undefined" ? navigator.userAgent : "server";
    const entry: LogEntry = { event, at: Date.now(), platform, meta };

    // Local ring-buffer
    const raw = localStorage.getItem(KEY);
    const arr: LogEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    while (arr.length > MAX) arr.shift();
    localStorage.setItem(KEY, JSON.stringify(arr));

    // Forward to external analytics if present
    type WithAnalytics = {
      gtag?: (...a: unknown[]) => void;
      plausible?: (...a: unknown[]) => void;
      dataLayer?: unknown[];
    };
    const w = window as unknown as WithAnalytics;
    w.gtag?.("event", `pwa_${event}`, meta ?? {});
    w.plausible?.(`pwa_${event}`, { props: meta });
    w.dataLayer?.push({ event: `pwa_${event}`, ...(meta ?? {}) });
  } catch {
    /* ignore */
  }
}

export function getPwaEventLog(): LogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPwaEventLog() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}
