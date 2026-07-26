// Configurable anti-cheat proctor used by ExamRunner.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProctorSettings = {
  tab_switch?: boolean;
  copy_paste?: boolean;
  fullscreen?: boolean;
  block_context?: boolean;
  multi_screen?: boolean;
  webcam_snapshots?: boolean;
  snapshot_interval?: number; // seconds
};

export const DEFAULT_PROCTOR: ProctorSettings = {
  tab_switch: true,
  copy_paste: true,
  fullscreen: true,
  block_context: true,
  multi_screen: false,
  webcam_snapshots: false,
  snapshot_interval: 30,
};

export type ProctorHandle = {
  stop: () => void;
  violations: () => number;
};

async function logEvent(submissionId: string, type: string, meta?: any) {
  await supabase.from("exam_events").insert({ submission_id: submissionId, event_type: type, meta });
}

export function startProctor(opts: {
  submissionId: string;
  settings: ProctorSettings;
  onViolation?: (type: string) => void;
}): ProctorHandle {
  const s = { ...DEFAULT_PROCTOR, ...(opts.settings || {}) };
  let count = 0;
  const cleanups: Array<() => void> = [];

  const trip = async (type: string, meta?: any, msg?: string) => {
    count++;
    opts.onViolation?.(type);
    if (msg) toast.warning(msg);
    await logEvent(opts.submissionId, type, meta);
  };

  if (s.tab_switch) {
    const onVis = () => { if (document.hidden) trip("tab_hidden", null, "Onglet quitté — incident enregistré"); };
    const onBlur = () => trip("window_blur");
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    cleanups.push(() => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("blur", onBlur); });
  }

  if (s.copy_paste) {
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); trip("copy_attempt", null, "Copie bloquée"); };
    const onPaste = (e: ClipboardEvent) => { e.preventDefault(); trip("paste_attempt", null, "Collage bloqué"); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c","v","x","p","s","u","a"].includes(e.key.toLowerCase())) {
        e.preventDefault(); trip("shortcut_blocked", { key: e.key });
      }
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("keydown", onKey);
    cleanups.push(() => { document.removeEventListener("copy", onCopy); document.removeEventListener("paste", onPaste); document.removeEventListener("keydown", onKey); });
  }

  if (s.block_context) {
    const onCtx = (e: MouseEvent) => { e.preventDefault(); };
    document.addEventListener("contextmenu", onCtx);
    cleanups.push(() => document.removeEventListener("contextmenu", onCtx));
  }

  if (s.fullscreen) {
    const onFs = () => { if (!document.fullscreenElement) trip("fullscreen_exit", null, "Plein écran quitté — incident enregistré"); };
    document.addEventListener("fullscreenchange", onFs);
    cleanups.push(() => document.removeEventListener("fullscreenchange", onFs));
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  // Multi-screen detection (Window Management API + screen change)
  if (s.multi_screen) {
    const checkScreens = async () => {
      try {
        // @ts-ignore
        if (window.getScreenDetails) {
          // @ts-ignore
          const sd = await window.getScreenDetails();
          if (sd?.screens?.length > 1) trip("multi_screen", { count: sd.screens.length }, "Plusieurs écrans détectés");
        } else if (window.screen && (window.screen.availWidth < window.innerWidth || screen.width > screen.availWidth + 100)) {
          trip("multi_screen_guess");
        }
      } catch {}
    };
    checkScreens();
    const id = setInterval(checkScreens, 15000);
    cleanups.push(() => clearInterval(id));
  }

  // Webcam snapshots
  if (s.webcam_snapshots) {
    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let timer: any;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
        video = document.createElement("video");
        video.srcObject = stream; video.autoplay = true; video.muted = true;
        await video.play();
        canvas = document.createElement("canvas");
        canvas.width = 320; canvas.height = 240;
        const snap = async () => {
          if (!video || !canvas) return;
          const ctx = canvas.getContext("2d"); if (!ctx) return;
          ctx.drawImage(video, 0, 0, 320, 240);
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const path = `${opts.submissionId}/${Date.now()}.jpg`;
            const { error } = await supabase.storage.from("voice-uploads").upload(path, blob, { contentType: "image/jpeg", upsert: false });
            if (!error) {
              const { data } = supabase.storage.from("voice-uploads").getPublicUrl(path);
              await logEvent(opts.submissionId, "webcam_snapshot", { url: data.publicUrl });
            }
          }, "image/jpeg", 0.7);
        };
        snap();
        timer = setInterval(snap, (s.snapshot_interval || 30) * 1000);
      } catch (e: any) {
        await trip("webcam_denied", { error: e?.message }, "Webcam refusée — incident enregistré");
      }
    })();
    cleanups.push(() => {
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach(t => t.stop());
    });
  }

  // Always block accidental nav
  const onBefore = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
  window.addEventListener("beforeunload", onBefore);
  cleanups.push(() => window.removeEventListener("beforeunload", onBefore));

  return {
    stop: () => { cleanups.forEach(fn => { try { fn(); } catch {} }); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); },
    violations: () => count,
  };
}
