import { supabase } from "@/integrations/supabase/client";

/** Short beep via WebAudio (no assets). */
export function beep(freq = 880, ms = 160, gain = 0.08) {
  try {
    const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g).connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, ms);
  } catch { /* ignore */ }
}

export async function ensureBrowserNotifPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const p = await Notification.requestPermission();
    return p === "granted";
  } catch { return false; }
}

export function showBrowserNotif(title: string, body?: string, link?: string) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const n = new Notification(title, { body, icon: "/placeholder.svg", tag: link || title });
    if (link) n.onclick = () => { window.focus(); window.location.href = link; };
  } catch { /* ignore */ }
}

export type NotifPayload = {
  user_id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, any>;
};

/** Insert a notification row (RLS: any authenticated user may insert). */
export async function notify(payload: NotifPayload | NotifPayload[]) {
  const rows = (Array.isArray(payload) ? payload : [payload]).map((p) => ({
    user_id: p.user_id,
    type: p.type,
    title: p.title,
    body: p.body ?? null,
    link: p.link ?? null,
    metadata: p.metadata ?? {},
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("[notify]", error.message);
}
