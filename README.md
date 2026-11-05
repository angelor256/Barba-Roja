# Barba Roja 💈 — PWA de citas

Web app + PWA para la barbería **Barba Roja** (Rohrmoser, San José, Costa Rica).
React + Vite + Tailwind CSS + Supabase (Auth, Postgres, Storage, Edge Functions) + Web Push.

## Estructura

```
public/            manifest.webmanifest, sw.js (offline + push), iconos (maskable incluidos)
src/
  lib/             config, fechas (UTC-6), disponibilidad, push, supabase, demo (modo demostración)
  context/         AuthContext (email/contraseña + Google)
  components/      Layout (header, barra inferior, footer), BookingFlow (4 pasos), InstallBanner, Calendar, cards…
  pages/           Home, Services, Barbers, BarberDetail, About, Contact, Book, Profile, Admin + admin/*
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

### Demo en GitHub Pages
1. El workflow `.github/workflows/pages.yml` publica en cada push a `main`.
2. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. La demo queda en `https://<usuario>.github.io/<repo>/`. Cada página tiene su URL (`#/servicios`, `#/barberos`, `#/agendar`…).
4. **Sin variables corre en modo demostración**: 4 barberos ficticios, horarios con disponibilidad simulada y reservas de mentira guardadas solo en el navegador (se ven en *Mis citas*).
5. Para que reserve de verdad: **Settings → Secrets and variables → Actions → Variables** → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_WHATSAPP_NUMBER`. En Supabase añade la URL de Pages en *Authentication → URL Configuration*.

La app usa rutas relativas y `HashRouter`, así que funciona igual en cualquier subcarpeta, dominio propio, Vercel o Netlify. Los repos privados necesitan plan de pago para Pages.

### Despliegue
Cualquier hosting estático con fallback SPA (`vercel.json` y `public/_redirects` incluidos). Requiere HTTPS para PWA/push.

## Notas de diseño
- **Sin doble reserva**: restricción `EXCLUDE` en Postgres (por barbero y rango horario) + validación de horario, descanso y feriados dentro de `book_appointment`.
- Los clientes ven horas ocupadas mediante `get_busy_slots`, que no expone datos personales.
- Los iconos se recortaron del logo adjunto (baja resolución): sustitúyelos por el logo vectorial/alta resolución en `public/icons/`.
- Falta definir: número de WhatsApp (`VITE_WHATSAPP_NUMBER`) y coordenadas exactas si prefieres un mapa fijo (hoy se usa búsqueda por texto).
