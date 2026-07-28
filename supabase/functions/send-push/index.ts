// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    // Public key discovery
    if (payload?.action === 'public_key') {
      return new Response(JSON.stringify({ publicKey: VAPID_PUBLIC }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds: string[] = payload.user_ids ?? (payload.user_id ? [payload.user_id] : []);
    if (!userIds.length) {
      return new Response(JSON.stringify({ error: 'user_id_required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);
    if (error) throw error;

    const notif = {
      title: payload.title ?? 'Deutsch Meister',
      body: payload.body ?? '',
      icon: payload.icon ?? '/icons/icon-192.png',
      badge: payload.badge ?? '/icons/icon-192.png',
      image: payload.image,
      sound: payload.sound ?? '/sounds/notify.mp3',
      tag: payload.type ?? 'default',
      data: {
        url: payload.link ?? '/',
        notification_id: payload.notification_id,
        type: payload.type,
        metadata: payload.metadata ?? {},
      },
      vibrate: [200, 100, 200],
      requireInteraction: true,
    };

    let sent = 0, failed = 0;
    const dead: string[] = [];
    await Promise.all((subs ?? []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          JSON.stringify(notif),
          { TTL: 60 * 60 * 24 },
        );
        sent++;
      } catch (e: any) {
        failed++;
        if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.endpoint);
      }
    }));

    if (dead.length) {
      await admin.from('push_subscriptions').delete().in('endpoint', dead);
    }

    return new Response(JSON.stringify({ sent, failed, cleaned: dead.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-push error', e);
    return new Response(JSON.stringify({ error: e?.message ?? 'internal_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
