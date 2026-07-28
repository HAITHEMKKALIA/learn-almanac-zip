/**
 * Guarded service worker registration.
 * Rules follow the Lovable PWA skill:
 *  - never register in dev / preview / iframes
 *  - allow `?sw=off` kill switch to unregister
 *  - only registers the generated /sw.js
 */

const SW_PATH = "/sw.js";

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.top !== window.self) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  if (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" || h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")
  ) return true;
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppSW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(SW_PATH)) await r.unregister();
    }
  } catch { /* ignore */ }
}

export function registerAppSW() {
  if (!("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    void unregisterAppSW();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_PATH, { scope: "/" })
      .catch(() => { /* offline caching optional */ });
  });
}
