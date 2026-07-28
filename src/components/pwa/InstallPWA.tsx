import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 3;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  return { isIOS, isAndroid, isMobile, isSafari, isFirefox, isSamsung };
}

/**
 * Floating install banner: works on any device.
 * - Chrome/Edge/Samsung/Android: uses beforeinstallprompt (native install).
 * - iOS Safari: shows manual "Partager → Sur l'écran d'accueil" instructions.
 * - Firefox/others: shows manual instructions from the browser menu.
 */
export function InstallPWA() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 86400_000) return;

    const { isIOS } = detectPlatform();

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt → show manual banner after short delay
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIOS) {
      t = setTimeout(() => setVisible(true), 1500);
    } else {
      // Fallback for browsers without BIP support (Firefox desktop, etc.):
      // show manual banner if BIP did not fire within 4s AND we are on mobile.
      t = setTimeout(() => {
        if (!deferred && detectPlatform().isMobile) setVisible(true);
      }, 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowIOS(false);
  };

  const install = async () => {
    const { isIOS, isFirefox } = detectPlatform();
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
      return;
    }
    if (isIOS || isFirefox) {
      setShowIOS(true);
    }
  };

  if (!visible) return null;
  const { isIOS } = detectPlatform();

  return (
    <>
      <div
        role="dialog"
        aria-label="Installer l'application"
        className="fixed left-2 right-2 z-[80] rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl p-3 flex items-center gap-3"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          maxWidth: 480,
          marginInline: "auto",
        }}
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center shrink-0">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            Installer Deutsch Meister
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            Accès rapide depuis votre écran d'accueil, comme une vraie app.
          </div>
        </div>
        <button
          onClick={install}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground shrink-0"
        >
          Installer
        </button>
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showIOS && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 grid place-items-end sm:place-items-center p-3"
          onClick={dismiss}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background border border-border p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-foreground">
                {isIOS ? "Installer sur iPhone / iPad" : "Installer sur votre appareil"}
              </div>
              <button onClick={dismiss} aria-label="Fermer">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <ol className="text-sm text-foreground space-y-2 list-decimal ps-5">
              <li>
                Ouvrez le menu <Share className="inline h-4 w-4 -mt-0.5" />{" "}
                {isIOS ? "« Partager » de Safari" : "de votre navigateur"}.
              </li>
              <li>
                Choisissez <strong>« Sur l'écran d'accueil »</strong>{" "}
                {isIOS ? "" : "ou « Installer l'application »"}.
              </li>
              <li>Confirmez avec <strong>« Ajouter »</strong>.</li>
            </ol>
            <p className="text-[11px] text-muted-foreground">
              L'app fonctionnera en plein écran, sans barre du navigateur.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
