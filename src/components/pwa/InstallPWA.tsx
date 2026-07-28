import { useEffect, useState } from "react";
import { X, Download, Share, MoreVertical, Menu, PlusSquare, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { detectDevice, type DeviceInfo } from "@/lib/deviceDetect";
import { trackPwaEvent } from "@/lib/pwaAnalytics";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 3;

export function InstallPWA() {
  const { tt } = useI18n();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [info, setInfo] = useState<DeviceInfo>(() => detectDevice());

  useEffect(() => {
    if (info.isStandalone) {
      trackPwaEvent("already_standalone", { os: info.os, browser: info.browser });
      return;
    }
    const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 86400_000) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
      trackPwaEvent("prompt_available", { os: info.os, browser: info.browser });
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      trackPwaEvent("installed", { os: info.os, browser: info.browser });
    };
    window.addEventListener("appinstalled", onInstalled);

    const onOrient = () => setInfo(detectDevice());
    window.addEventListener("resize", onOrient);
    window.addEventListener("orientationchange", onOrient);

    // iOS / Firefox / any mobile without BIP → show manual banner shortly.
    const needsManual = info.isIOS || info.browser === "firefox" || info.isInAppBrowser;
    const delay = needsManual ? 1500 : 4000;
    const t = setTimeout(() => {
      if (needsManual || (!deferred && info.isMobile)) setVisible(true);
    }, delay);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("resize", onOrient);
      window.removeEventListener("orientationchange", onOrient);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowGuide(false);
    trackPwaEvent("prompt_dismissed", { os: info.os, browser: info.browser });
  };

  const install = async () => {
    trackPwaEvent("prompt_shown", { os: info.os, browser: info.browser });
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      trackPwaEvent(choice.outcome === "accepted" ? "prompt_accepted" : "prompt_dismissed", {
        os: info.os, browser: info.browser,
      });
      setDeferred(null);
      setVisible(false);
      return;
    }
    setShowGuide(true);
    trackPwaEvent("manual_guide_shown", { os: info.os, browser: info.browser });
  };

  if (!visible) return null;

  const title = tt({ fr: "Installer Deutsch Meister", de: "Deutsch Meister installieren", ar: "ثبّت Deutsch Meister" });
  const sub = tt({
    fr: "Accès rapide depuis l'écran d'accueil, comme une vraie app.",
    de: "Schneller Zugriff vom Startbildschirm — wie eine echte App.",
    ar: "وصول سريع من الشاشة الرئيسية، كتطبيق حقيقي.",
  });
  const installLabel = tt({ fr: "Installer", de: "Installieren", ar: "تثبيت" });

  return (
    <>
      <div
        role="dialog"
        aria-label={title}
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
          <div className="text-sm font-semibold text-foreground truncate">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
        </div>
        <button
          onClick={install}
          className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground shrink-0"
        >
          {installLabel}
        </button>
        <button
          onClick={dismiss}
          aria-label={tt({ fr: "Fermer", de: "Schließen", ar: "إغلاق" })}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {showGuide && <InstallGuide info={info} onClose={dismiss} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Contextual install guide (per OS × Browser × language)              */
/* ------------------------------------------------------------------ */

function InstallGuide({ info, onClose }: { info: DeviceInfo; onClose: () => void }) {
  const { tt } = useI18n();
  const steps = guideStepsFor(info, tt);

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 grid place-items-end sm:place-items-center p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-background border border-border p-4 space-y-3 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div className="flex items-center justify-between">
          <div className="text-base font-bold text-foreground">
            {steps.title}
          </div>
          <button onClick={onClose} aria-label="close">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {info.isInAppBrowser && (
          <div className="text-xs rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-amber-600 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {tt({
                fr: "Vous naviguez dans une app externe (Facebook, Instagram…). Ouvrez ce lien dans votre navigateur (Chrome, Safari) pour pouvoir installer.",
                de: "Sie sind in einer In-App-Ansicht. Öffnen Sie diese Seite in Ihrem Browser (Chrome, Safari), um zu installieren.",
                ar: "أنت داخل تطبيق آخر. افتح الرابط في متصفحك (Chrome، Safari) للتثبيت.",
              })}
            </span>
          </div>
        )}

        <ol className="text-sm text-foreground space-y-2 list-decimal ps-5">
          {steps.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ol>
        <p className="text-[11px] text-muted-foreground">
          {tt({
            fr: "L'app s'ouvrira en plein écran, sans barre de navigateur, et fonctionnera même hors-ligne après première visite.",
            de: "Die App öffnet sich im Vollbild, ohne Browserleiste, und funktioniert nach dem ersten Besuch auch offline.",
            ar: "سيفتح التطبيق في وضع ملء الشاشة ويعمل دون إنترنت بعد أول زيارة.",
          })}
        </p>
      </div>
    </div>
  );
}

type Tt = (v: { fr: string; de?: string; ar?: string }) => string;

function guideStepsFor(info: DeviceInfo, tt: Tt): { title: string; items: React.ReactNode[] } {
  const share = <Share className="inline h-4 w-4 -mt-0.5" />;
  const menu = <MoreVertical className="inline h-4 w-4 -mt-0.5" />;
  const menuH = <Menu className="inline h-4 w-4 -mt-0.5" />;
  const plus = <PlusSquare className="inline h-4 w-4 -mt-0.5" />;

  const iOSSafari = {
    title: tt({ fr: "Installer sur iPhone / iPad (Safari)", de: "Auf iPhone / iPad installieren (Safari)", ar: "التثبيت على iPhone/iPad (Safari)" }),
    items: [
      <>{tt({ fr: "Touchez le bouton", de: "Tippen Sie auf", ar: "اضغط على زر" })} {share} {tt({ fr: "« Partager » en bas de Safari.", de: "„Teilen“ unten in Safari.", ar: "«مشاركة» أسفل Safari." })}</>,
      <>{tt({ fr: "Faites défiler et choisissez", de: "Scrollen und wählen Sie", ar: "مرّر واختر" })} <strong>{tt({ fr: "« Sur l'écran d'accueil »", de: "„Zum Home-Bildschirm“", ar: "«إلى الشاشة الرئيسية»" })}</strong> {plus}.</>,
      <>{tt({ fr: "Confirmez avec", de: "Bestätigen Sie mit", ar: "أكد بـ" })} <strong>{tt({ fr: "« Ajouter »", de: "„Hinzufügen“", ar: "«إضافة»" })}</strong>.</>,
    ],
  };

  const iOSChrome = {
    title: tt({ fr: "Installer sur iOS (Chrome)", de: "Auf iOS installieren (Chrome)", ar: "التثبيت على iOS (Chrome)" }),
    items: [
      <>{tt({ fr: "Touchez", de: "Tippen Sie auf", ar: "اضغط" })} {share} {tt({ fr: "en haut à droite.", de: "oben rechts.", ar: "أعلى اليمين." })}</>,
      <>{tt({ fr: "Choisissez", de: "Wählen Sie", ar: "اختر" })} <strong>{tt({ fr: "« Sur l'écran d'accueil »", de: "„Zum Home-Bildschirm“", ar: "«إلى الشاشة الرئيسية»" })}</strong>.</>,
      <>{tt({ fr: "Confirmez avec « Ajouter ».", de: "Mit „Hinzufügen“ bestätigen.", ar: "أكّد بـ «إضافة»." })}</>,
    ],
  };

  const androidChrome = {
    title: tt({ fr: "Installer sur Android (Chrome)", de: "Auf Android installieren (Chrome)", ar: "التثبيت على Android (Chrome)" }),
    items: [
      <>{tt({ fr: "Touchez le menu", de: "Tippen Sie auf das Menü", ar: "افتح القائمة" })} {menu} {tt({ fr: "en haut à droite.", de: "oben rechts.", ar: "أعلى اليمين." })}</>,
      <>{tt({ fr: "Choisissez", de: "Wählen Sie", ar: "اختر" })} <strong>{tt({ fr: "« Installer l'application »", de: "„App installieren“", ar: "«تثبيت التطبيق»" })}</strong> {tt({ fr: "ou « Ajouter à l'écran d'accueil ».", de: "oder „Zum Startbildschirm“.", ar: "أو «إضافة إلى الشاشة الرئيسية»." })}</>,
      <>{tt({ fr: "Confirmez.", de: "Bestätigen Sie.", ar: "أكد." })}</>,
    ],
  };

  const androidSamsung = {
    title: tt({ fr: "Installer sur Samsung Internet", de: "Auf Samsung Internet installieren", ar: "التثبيت على Samsung Internet" }),
    items: [
      <>{tt({ fr: "Touchez", de: "Tippen Sie auf", ar: "اضغط" })} {menuH} {tt({ fr: "en bas à droite.", de: "unten rechts.", ar: "أسفل اليمين." })}</>,
      <>{tt({ fr: "Choisissez", de: "Wählen Sie", ar: "اختر" })} <strong>{tt({ fr: "« Ajouter la page à » → « Écran d'accueil »", de: "„Seite hinzufügen zu“ → „Startbildschirm“", ar: "«إضافة الصفحة إلى» → «الشاشة الرئيسية»" })}</strong>.</>,
    ],
  };

  const firefoxAndroid = {
    title: tt({ fr: "Installer avec Firefox (Android)", de: "Mit Firefox installieren (Android)", ar: "التثبيت باستخدام Firefox (Android)" }),
    items: [
      <>{tt({ fr: "Touchez le menu", de: "Menü", ar: "افتح القائمة" })} {menu} {tt({ fr: "en haut à droite.", de: "oben rechts.", ar: "أعلى اليمين." })}</>,
      <>{tt({ fr: "Choisissez", de: "Wählen Sie", ar: "اختر" })} <strong>{tt({ fr: "« Installer »", de: "„Installieren“", ar: "«تثبيت»" })}</strong> {tt({ fr: "ou « Ajouter à l'écran d'accueil ».", de: "oder „Zum Startbildschirm hinzufügen“.", ar: "أو «إضافة إلى الشاشة الرئيسية»." })}</>,
    ],
  };

  const firefoxIOS = {
    title: tt({ fr: "Firefox iOS — installation limitée", de: "Firefox iOS — eingeschränkt", ar: "Firefox iOS — محدود" }),
    items: [
      <>{tt({
        fr: "Sur iOS, seul Safari peut installer une PWA. Ouvrez cette page dans Safari, puis suivez les étapes ci-dessous.",
        de: "Unter iOS kann nur Safari eine PWA installieren. Öffnen Sie diese Seite in Safari.",
        ar: "على iOS، فقط Safari يمكنه تثبيت PWA. افتح هذه الصفحة في Safari.",
      })}</>,
      ...iOSSafari.items,
    ],
  };

  const edgeDesktop = {
    title: tt({ fr: "Installer sur ordinateur (Edge / Chrome)", de: "Auf dem Computer installieren (Edge / Chrome)", ar: "التثبيت على الحاسوب (Edge / Chrome)" }),
    items: [
      <>{tt({ fr: "Cliquez sur l'icône", de: "Klicken Sie auf das Symbol", ar: "انقر على الأيقونة" })} {plus} {tt({ fr: "à droite de la barre d'adresse.", de: "rechts in der Adressleiste.", ar: "على يمين شريط العنوان." })}</>,
      <>{tt({ fr: "Confirmez « Installer ».", de: "Mit „Installieren“ bestätigen.", ar: "أكّد «تثبيت»." })}</>,
    ],
  };

  const generic = {
    title: tt({ fr: "Installer sur votre appareil", de: "Auf Ihrem Gerät installieren", ar: "التثبيت على جهازك" }),
    items: [
      <>{tt({ fr: "Ouvrez le menu de votre navigateur", de: "Öffnen Sie das Browser-Menü", ar: "افتح قائمة المتصفح" })} {menu}.</>,
      <>{tt({ fr: "Cherchez « Installer l'application » ou « Ajouter à l'écran d'accueil ».", de: "Suchen Sie „App installieren“ oder „Zum Startbildschirm“.", ar: "ابحث عن «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»." })}</>,
    ],
  };

  if (info.isIOS && info.browser === "firefox") return firefoxIOS;
  if (info.isIOS) return info.browser === "chrome" ? iOSChrome : iOSSafari;
  if (info.isAndroid) {
    if (info.browser === "samsung") return androidSamsung;
    if (info.browser === "firefox") return firefoxAndroid;
    return androidChrome;
  }
  if (!info.isMobile) return edgeDesktop;
  return generic;
}
