# Barba Roja 💈 — PWA de citas

Web app + PWA para la barbería **Barba Roja** (Rohrmoser, San José, Costa Rica).
React + Vite + Tailwind CSS + Supabase (Auth, Postgres, Storage, Edge Functions) + Web Push.

## Estructura

```
public/            manifest.webmanifest, sw.js (offline + push), iconos (maskable incluidos)
src/
  lib/             config, fechas (UTC-6), disponibilidad, push, supabase
  context/         AuthContext (email/contraseña + Google)
  components/      Header, InstallBanner (iOS/Android), BookingModal (4 pasos), Calendar, Auth, Ubicación…
  pages/           Home, Profile, Admin + admin/{Agenda,Barbers,Schedules,Services,PushPanel}
supabase/
  schema.sql                 tablas, RLS, RPCs (book_appointment…), semillas de servicios
  functions/send-push/       Edge Function: difusión (admin) + recordatorios (cron)
```

## Puesta en marcha

1. `npm install`
2. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` en el SQL Editor.
3. Copia `.env.example` → `.env` y rellena URL/anon key de Supabase, WhatsApp y la clave VAPID pública.
4. Claves VAPID: `npx web-push generate-vapid-keys`.
5. `npm run dev` (o `npm run build && npm run preview` para probar PWA + service worker, que solo se registra en producción).
6. Regístrate en la app y vuélvete admin en el SQL Editor:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'tu@correo.com');
   ```
7. Google Auth: Supabase → Authentication → Providers → Google.

### Notificaciones push

```bash
supabase functions deploy send-push
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:tu@correo.com CRON_SECRET=...
```
Los recordatorios automáticos (1 hora antes) se programan con `pg_cron` (ver bloque al final de `schema.sql`).
En iPhone, las notificaciones solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4+); el banner de instalación explica los pasos.

### Despliegue
Cualquier hosting estático con fallback SPA (`vercel.json` y `public/_redirects` incluidos). Requiere HTTPS para PWA/push.

## Notas de diseño
- **Sin doble reserva**: restricción `EXCLUDE` en Postgres (por barbero y rango horario) + validación de horario, descanso y feriados dentro de `book_appointment`.
- Los clientes ven horas ocupadas mediante `get_busy_slots`, que no expone datos personales.
- Los iconos se recortaron del logo adjunto (baja resolución): sustitúyelos por el logo vectorial/alta resolución en `public/icons/`.
- Falta definir: número de WhatsApp (`VITE_WHATSAPP_NUMBER`) y coordenadas exactas si prefieres un mapa fijo (hoy se usa búsqueda por texto).
