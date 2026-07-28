/**
 * Rich device / browser detection used by the install banner
 * and the diagnostics screen. Pure client helper — no side effects.
 */
export type OSName = "ios" | "ipados" | "android" | "windows" | "macos" | "linux" | "other";
export type BrowserName =
  | "safari"
  | "chrome"
  | "edge"
  | "firefox"
  | "samsung"
  | "opera"
  | "brave"
  | "duckduckgo"
  | "webview"
  | "other";

export interface DeviceInfo {
  os: OSName;
  osVersion: string | null;
  browser: BrowserName;
  browserVersion: string | null;
  model: string | null;
  vendor: string | null;
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  supportsBeforeInstallPrompt: boolean;
  isInAppBrowser: boolean;
  orientation: "portrait" | "landscape";
  dpr: number;
  screen: { w: number; h: number };
  viewport: { w: number; h: number };
}

function match(re: RegExp, s: string): string | null {
  const m = s.match(re);
  return m ? m[1] : null;
}

export function detectDevice(): DeviceInfo {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const vendor = typeof navigator !== "undefined" ? navigator.vendor || null : null;

  const isIOS = /iPad|iPhone|iPod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isIPad = /iPad/i.test(ua) || (isIOS && (navigator.maxTouchPoints ?? 0) > 1 && /Macintosh/i.test(ua));
  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua) && !isIOS && !isIPad;
  const isLinux = /Linux/i.test(ua) && !isAndroid;

  const os: OSName = isIPad ? "ipados"
    : isIOS ? "ios"
    : isAndroid ? "android"
    : isWindows ? "windows"
    : isMac ? "macos"
    : isLinux ? "linux"
    : "other";

  const osVersion =
    match(/OS (\d+_\d+(?:_\d+)?)/i, ua)?.replace(/_/g, ".") ??
    match(/Android (\d+(?:\.\d+)?)/i, ua) ??
    match(/Windows NT (\d+\.\d+)/i, ua) ??
    match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/i, ua)?.replace(/_/g, ".") ??
    null;

  const isSamsung = /SamsungBrowser/i.test(ua);
  const isEdge = /Edg\//i.test(ua);
  const isOpera = /OPR\/|Opera/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isBrave = (navigator as unknown as { brave?: unknown }).brave != null;
  const isDDG = /DuckDuckGo/i.test(ua);
  const isFacebook = /FBAN|FBAV|Instagram|Line\/|Twitter/i.test(ua);
  const isWebView =
    /wv\)/i.test(ua) ||
    (isIOS && !/Safari/i.test(ua)) ||
    isFacebook;
  const isChrome = /Chrome|CriOS/i.test(ua) && !isEdge && !isSamsung && !isOpera && !isBrave;
  const isSafari = /Safari/i.test(ua) && !isChrome && !isEdge && !isSamsung && !isOpera && !isFirefox;

  const browser: BrowserName = isEdge ? "edge"
    : isSamsung ? "samsung"
    : isOpera ? "opera"
    : isFirefox ? "firefox"
    : isBrave ? "brave"
    : isDDG ? "duckduckgo"
    : isWebView ? "webview"
    : isChrome ? "chrome"
    : isSafari ? "safari"
    : "other";

  const browserVersion =
    match(/Edg\/([\d.]+)/i, ua) ??
    match(/OPR\/([\d.]+)/i, ua) ??
    match(/SamsungBrowser\/([\d.]+)/i, ua) ??
    match(/FxiOS\/([\d.]+)/i, ua) ??
    match(/Firefox\/([\d.]+)/i, ua) ??
    match(/CriOS\/([\d.]+)/i, ua) ??
    match(/Chrome\/([\d.]+)/i, ua) ??
    match(/Version\/([\d.]+).*Safari/i, ua) ??
    null;

  // Very rough Android model extraction: "; MODEL Build/"
  const model =
    match(/;\s*([^;)]+)\s+Build\//i, ua) ??
    (isIPad ? "iPad" : isIOS ? (match(/(iPhone|iPod)/i, ua)) : null);

  const isMobile = isIOS || isAndroid || /Mobi|Mobile/i.test(ua);
  const isTablet = isIPad || (isAndroid && !/Mobile/i.test(ua));

  const isStandalone =
    (typeof window !== "undefined" &&
      (window.matchMedia?.("(display-mode: standalone)").matches ||
        window.matchMedia?.("(display-mode: fullscreen)").matches ||
        window.matchMedia?.("(display-mode: minimal-ui)").matches)) ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  const supportsBIP = "onbeforeinstallprompt" in window;
  const orientation: "portrait" | "landscape" =
    typeof window !== "undefined" && window.innerHeight >= window.innerWidth ? "portrait" : "landscape";

  return {
    os,
    osVersion,
    browser,
    browserVersion,
    model,
    vendor,
    isMobile,
    isTablet,
    isIOS: isIOS || isIPad,
    isAndroid,
    isStandalone,
    supportsBeforeInstallPrompt: supportsBIP,
    isInAppBrowser: isWebView,
    orientation,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
    screen: {
      w: typeof window !== "undefined" ? window.screen?.width ?? 0 : 0,
      h: typeof window !== "undefined" ? window.screen?.height ?? 0 : 0,
    },
    viewport: {
      w: typeof window !== "undefined" ? window.innerWidth : 0,
      h: typeof window !== "undefined" ? window.innerHeight : 0,
    },
  };
}
