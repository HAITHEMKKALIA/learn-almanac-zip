import { useEffect, useMemo, useState } from "react";
import { detectDevice, type DeviceInfo } from "@/lib/deviceDetect";
import { getPwaEventLog, clearPwaEventLog } from "@/lib/pwaAnalytics";
import { useI18n } from "@/lib/i18n";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** /diagnostics — device + PWA readiness dashboard. */
export default function Diagnostics() {
  const { tt } = useI18n();
  const [info, setInfo] = useState<DeviceInfo>(() => detectDevice());
  const [log, setLog] = useState(() => getPwaEventLog());
  const [swState, setSwState] = useState<string>("checking…");
  const [swScopes, setSwScopes] = useState<string[]>([]);

  const refresh = () => {
    setInfo(detectDevice());
    setLog(getPwaEventLog());
  };

  useEffect(() => {
    const onResize = () => setInfo(detectDevice());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    let cancelled = false;
    (async () => {
      if (!("serviceWorker" in navigator)) { setSwState("unsupported"); return; }
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (cancelled) return;
        setSwScopes(regs.map(r => r.scope));
        if (!regs.length) setSwState("not-registered");
        else if (regs.some(r => r.active)) setSwState("active");
        else if (regs.some(r => r.installing)) setSwState("installing");
        else setSwState("registered");
      } catch { setSwState("error"); }
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const checks = useMemo(() => [
    { label: tt({ fr: "Mode standalone (installé)", de: "Standalone-Modus", ar: "الوضع المثبّت" }), ok: info.isStandalone },
    { label: tt({ fr: "Prompt d'installation natif", de: "Nativer Installations-Prompt", ar: "دعوة التثبيت الأصلية" }), ok: info.supportsBeforeInstallPrompt },
    { label: tt({ fr: "Service Worker actif", de: "Service Worker aktiv", ar: "Service Worker مفعّل" }), ok: swState === "active" },
    { label: tt({ fr: "Navigateur externe (pas WebView)", de: "Externer Browser", ar: "متصفح خارجي" }), ok: !info.isInAppBrowser },
    { label: tt({ fr: "HTTPS", de: "HTTPS", ar: "HTTPS" }), ok: typeof location !== "undefined" && location.protocol === "https:" },
  ], [info, swState, tt]);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/app" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 me-1" /> {tt({ fr: "Retour", de: "Zurück", ar: "رجوع" })}
          </Link>
          <h1 className="ms-auto text-lg sm:text-xl font-bold text-foreground">
            {tt({ fr: "Diagnostic PWA & appareil", de: "PWA- & Geräte-Diagnose", ar: "تشخيص PWA والجهاز" })}
          </h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{tt({ fr: "Vérifications", de: "Prüfungen", ar: "الفحوصات" })}</h2>
            <Button variant="ghost" size="sm" onClick={refresh}><RefreshCw className="h-4 w-4 me-1" />{tt({ fr: "Actualiser", de: "Aktualisieren", ar: "تحديث" })}</Button>
          </div>
          <ul className="text-sm space-y-1">
            {checks.map((c, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-foreground">{c.label}</span>
                <span className={c.ok ? "text-green-500 font-semibold" : "text-amber-500 font-semibold"}>
                  {c.ok ? "OK" : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-1 text-sm">
          <h2 className="font-semibold text-foreground mb-2">{tt({ fr: "Appareil", de: "Gerät", ar: "الجهاز" })}</h2>
          <Row k="OS" v={`${info.os} ${info.osVersion ?? ""}`} />
          <Row k="Navigateur" v={`${info.browser} ${info.browserVersion ?? ""}`} />
          <Row k="Modèle" v={info.model ?? "—"} />
          <Row k="Vendor" v={info.vendor ?? "—"} />
          <Row k="Type" v={info.isTablet ? "Tablette" : info.isMobile ? "Mobile" : "Desktop"} />
          <Row k="Orientation" v={info.orientation} />
          <Row k="Viewport" v={`${info.viewport.w}×${info.viewport.h}`} />
          <Row k="Écran" v={`${info.screen.w}×${info.screen.h}`} />
          <Row k="DPR" v={String(info.dpr)} />
          <Row k="WebView / in-app" v={info.isInAppBrowser ? "oui" : "non"} />
          <Row k="Service Worker" v={swState} />
          {swScopes.length > 0 && <Row k="SW scopes" v={swScopes.join(", ")} />}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-foreground">{tt({ fr: "Événements PWA", de: "PWA-Ereignisse", ar: "أحداث PWA" })}</h2>
            <Button variant="ghost" size="sm" onClick={() => { clearPwaEventLog(); setLog([]); }}>
              <Trash2 className="h-4 w-4 me-1" />{tt({ fr: "Vider", de: "Leeren", ar: "مسح" })}
            </Button>
          </div>
          {log.length === 0 ? (
            <p className="text-xs text-muted-foreground">{tt({ fr: "Aucun événement pour le moment.", de: "Noch keine Ereignisse.", ar: "لا توجد أحداث بعد." })}</p>
          ) : (
            <ul className="text-xs font-mono space-y-1 max-h-64 overflow-auto">
              {log.slice().reverse().map((e, i) => (
                <li key={i} className="border-b border-border/50 pb-1">
                  <span className="text-primary">{e.event}</span>{" · "}
                  <span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/40 last:border-0 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground font-medium text-end break-all">{v}</span>
    </div>
  );
}
