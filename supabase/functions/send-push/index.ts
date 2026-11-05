// Edge Function: envía Web Push.
//  - mode "broadcast": solo admins (JWT). Body: { title, body, url?, user_id? }
//  - mode "reminders": cron (header x-cron-secret). Avisa citas que empiezan en ~1 hora.
//
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...), CRON_SECRET
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY ya los inyecta Supabase)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@barbaroja.cr',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

async function sendTo(subs: Sub[], payload: Record<string, unknown>) {
  let sent = 0;
  const dead: string[] = [];
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
      sent++;
    } catch (e) {
      if ([404, 410].includes((e as { statusCode?: number }).statusCode ?? 0)) dead.push(s.id);
    }
  }));
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);
  return { sent, removed: dead.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const input = await req.json().catch(() => ({}));

  // ---- Recordatorios (cron) ----
  if (input.mode === 'reminders') {
    if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return json({ error: 'forbidden' }, 403);
    const now = Date.now();
    const { data: appts } = await admin.from('appointments')
      .select('id, client_id, start_at')
      .in('status', ['pending', 'confirmed']).eq('reminder_sent', false)
      .gte('start_at', new Date(now).toISOString())
      .lte('start_at', new Date(now + 65 * 60_000).toISOString());
    let total = 0;
    for (const a of appts ?? []) {
      const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', a.client_id);
      const hora = new Date(a.start_at).toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Costa_Rica' });
      const r = await sendTo(subs ?? [], {
        title: 'Recordatorio de tu cita 💈',
        body: `Hoy a las ${hora} en Barba Roja. ¡Te esperamos!`,
        url: '/perfil', tag: `cita-${a.id}`,
      });
      total += r.sent;
      await admin.from('appointments').update({ reminder_sent: true }).eq('id', a.id);
    }
    return json({ reminded: appts?.length ?? 0, sent: total });
  }

  // ---- Difusión (solo admin) ----
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (prof?.role !== 'admin') return json({ error: 'forbidden' }, 403);

  if (!input.title || !input.body) return json({ error: 'title y body son requeridos' }, 400);
  let q = admin.from('push_subscriptions').select('*');
  if (input.user_id) q = q.eq('user_id', input.user_id);
  const { data: subs, error } = await q;
  if (error) return json({ error: error.message }, 500);
  const r = await sendTo(subs ?? [], { title: input.title, body: input.body, url: input.url ?? '/' });
  return json({ total: subs?.length ?? 0, ...r });
});
