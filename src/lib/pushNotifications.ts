import { supabase } from '@/integrations/supabase/client';

const SW_URL = '/push-sw.js';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function isPushSupported() {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

async function registerSW() {
  return navigator.serviceWorker.register(SW_URL, { scope: '/' });
}

async function fetchPublicKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('send-push', {
    body: { action: 'public_key' },
  });
  if (error) throw error;
  return (data as any).publicKey as string;
}

export async function enablePushNotifications(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'denied' };

  const reg = await registerSW();
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const publicKey = await fetchPublicKey();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json: any = sub.toJSON();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return { ok: false, reason: 'not_authenticated' };

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.user.id,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth_key: json.keys?.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: 'user_id,endpoint' });
  if (error) return { ok: false, reason: error.message };

  // Wire sound playback from SW messages
  navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data?.type === 'push-sound') {
      try {
        const a = new Audio(ev.data.sound || '/sounds/notify.mp3');
        a.volume = 0.6;
        a.play().catch(() => {});
      } catch {}
    }
  });

  return { ok: true };
}

export async function disablePushNotifications() {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
}

export async function getPushStatus(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}
