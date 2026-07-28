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

/**
 * Send notifications through the secured `send_notification` RPC.
 * The server enforces that the caller is allowed to notify each target
 * (self, admin, or shared-school membership).
 * Payloads are grouped by (type,title,body,link,metadata) to batch recipients.
 */
export async function notify(payload: NotifPayload | NotifPayload[]) {
  const list = Array.isArray(payload) ? payload : [payload];
  if (list.length === 0) return;
  const groups = new Map<string, { p: NotifPayload; ids: string[] }>();
  for (const p of list) {
    const key = JSON.stringify([p.type, p.title, p.body ?? null, p.link ?? null, p.metadata ?? {}]);
    const g = groups.get(key);
    if (g) g.ids.push(p.user_id);
    else groups.set(key, { p, ids: [p.user_id] });
  }
  for (const { p, ids } of groups.values()) {
    const { error } = await supabase.rpc("send_notification", {
      _user_ids: ids,
      _type: p.type,
      _title: p.title,
      _body: p.body ?? null,
      _link: p.link ?? null,
      _metadata: (p.metadata ?? {}) as any,
    });
    if (error) console.error("[notify]", error.message);
  }
}
