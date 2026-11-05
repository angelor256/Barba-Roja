-- =====================================================================
-- Barba Roja · Esquema Supabase (PostgreSQL)
-- Ejecutar completo en: Supabase -> SQL Editor
-- Zona horaria del negocio: America/Costa_Rica (UTC-6, sin horario de verano)
-- =====================================================================

create extension if not exists btree_gist;

-- ---------- Tablas ----------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        text not null default 'client' check (role in ('client','admin')),
  created_at  timestamptz not null default now()
);

create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  price_crc     integer not null check (price_crc >= 0),
  duration_min  integer not null check (duration_min > 0),
  sort_order    integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.barbers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  specialty   text,
  photo_url   text,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Horario semanal por barbero. weekday: 0 = domingo ... 6 = sábado
create table if not exists public.barber_schedules (
  id           uuid primary key default gen_random_uuid(),
  barber_id    uuid not null references public.barbers(id) on delete cascade,
  weekday      smallint not null check (weekday between 0 and 6),
  start_time   time not null,
  end_time     time not null,
  break_start  time,
  break_end    time,
  unique (barber_id, weekday),
  check (end_time > start_time),
  check ((break_start is null) = (break_end is null))
);

-- Feriados / ausencias. barber_id NULL = toda la barbería cerrada.
create table if not exists public.time_off (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid references public.barbers(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text,
  check (end_date >= start_date)
);

create table if not exists public.appointments (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  barber_id      uuid not null references public.barbers(id),
  start_at       timestamptz not null,
  end_at         timestamptz not null,
  status         text not null default 'pending'
                 check (status in ('pending','confirmed','completed','cancelled')),
  notes          text,
  total_crc      integer not null default 0,
  reminder_sent  boolean not null default false,
  created_at     timestamptz not null default now(),
  check (end_at > start_at),
  -- Imposible solapar citas activas del mismo barbero (a prueba de carreras)
  constraint no_overlap exclude using gist (
    barber_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('pending','confirmed'))
);
create index if not exists appointments_client_idx on public.appointments (client_id, start_at desc);
create index if not exists appointments_start_idx  on public.appointments (start_at);

-- Foto (snapshot) de los servicios de cada cita
create table if not exists public.appointment_services (
  id              uuid primary key default gen_random_uuid(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  service_id      uuid references public.services(id) on delete set null,
  name            text not null,
  price_crc       integer not null,
  duration_min    integer not null
);

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- Funciones auxiliares ----------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Horas ocupadas (sin datos personales) para calcular disponibilidad en tiempo real
create or replace function public.get_busy_slots(p_from timestamptz, p_to timestamptz, p_barber uuid default null)
returns table (barber_id uuid, start_at timestamptz, end_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.barber_id, a.start_at, a.end_at
  from public.appointments a
  where a.status in ('pending','confirmed')
    and a.start_at < p_to and a.end_at > p_from
    and (p_barber is null or a.barber_id = p_barber);
$$;

-- Reservar cita: valida horario, ausencias, duración y solapamiento
create or replace function public.book_appointment(
  p_barber uuid, p_start timestamptz, p_service_ids uuid[], p_notes text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_tz constant text := 'America/Costa_Rica';
  v_uid uuid := auth.uid();
  v_dur integer; v_total integer; v_end timestamptz; v_id uuid;
  v_local_start timestamp; v_local_end timestamp; v_sched public.barber_schedules;
begin
  if v_uid is null then raise exception 'Debes iniciar sesión' using errcode = '28000'; end if;
  if p_service_ids is null or cardinality(p_service_ids) = 0 then raise exception 'Selecciona al menos un servicio'; end if;
  if not exists (select 1 from public.barbers where id = p_barber and active) then raise exception 'Barbero no disponible'; end if;

  select sum(duration_min), sum(price_crc) into v_dur, v_total
  from public.services where id = any(p_service_ids) and active;
  if v_dur is null then raise exception 'Servicios inválidos'; end if;

  v_end := p_start + make_interval(mins => v_dur);
  if p_start < now() then raise exception 'La hora ya pasó'; end if;

  v_local_start := p_start at time zone v_tz;
  v_local_end   := v_end   at time zone v_tz;

  select * into v_sched from public.barber_schedules
   where barber_id = p_barber and weekday = extract(dow from v_local_start)::smallint;
  if not found then raise exception 'El barbero no trabaja ese día'; end if;
  if v_local_start::time < v_sched.start_time or v_local_end::time > v_sched.end_time
     or v_local_end::date <> v_local_start::date then
    raise exception 'Fuera del horario de atención';
  end if;
  if v_sched.break_start is not null
     and v_local_start::time < v_sched.break_end and v_local_end::time > v_sched.break_start then
    raise exception 'Coincide con el descanso del barbero';
  end if;
  if exists (select 1 from public.time_off t
              where (t.barber_id is null or t.barber_id = p_barber)
                and v_local_start::date between t.start_date and t.end_date) then
    raise exception 'Día no disponible';
  end if;

  insert into public.appointments (client_id, barber_id, start_at, end_at, notes, total_crc)
  values (v_uid, p_barber, p_start, v_end, p_notes, v_total)
  returning id into v_id;   -- si hay solape, no_overlap lanza 23P01

  insert into public.appointment_services (appointment_id, service_id, name, price_crc, duration_min)
  select v_id, s.id, s.name, s.price_crc, s.duration_min from public.services s where s.id = any(p_service_ids);

  return v_id;
end $$;

-- El cliente cancela su propia cita (mín. 1 hora antes)
create or replace function public.cancel_my_appointment(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.appointments set status = 'cancelled'
   where id = p_id and client_id = auth.uid()
     and status in ('pending','confirmed') and start_at > now() + interval '1 hour';
  if not found then raise exception 'No se puede cancelar esta cita (debe ser con más de 1 hora de anticipación)'; end if;
end $$;

grant execute on function public.get_busy_slots(timestamptz, timestamptz, uuid) to anon, authenticated;
grant execute on function public.book_appointment(uuid, timestamptz, uuid[], text) to authenticated;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;

-- ---------- Row Level Security ----------

alter table public.profiles             enable row level security;
alter table public.services             enable row level security;
alter table public.barbers              enable row level security;
alter table public.barber_schedules     enable row level security;
alter table public.time_off             enable row level security;
alter table public.appointments         enable row level security;
alter table public.appointment_services enable row level security;
alter table public.push_subscriptions   enable row level security;

-- Catálogo público de lectura, escritura solo admin
do $$
declare t text;
begin
  foreach t in array array['services','barbers','barber_schedules','time_off'] loop
    execute format('drop policy if exists "%1$s_read" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_admin" on public.%1$s', t);
    execute format('create policy "%1$s_read" on public.%1$s for select using (true)', t);
    execute format('create policy "%1$s_admin" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = public.my_role());  -- no puede auto-promoverse

drop policy if exists appointments_select on public.appointments;
drop policy if exists appointments_admin  on public.appointments;
create policy appointments_select on public.appointments for select using (client_id = auth.uid() or public.is_admin());
create policy appointments_admin  on public.appointments for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists appt_services_select on public.appointment_services;
create policy appt_services_select on public.appointment_services for select using (
  public.is_admin() or exists (select 1 from public.appointments a where a.id = appointment_id and a.client_id = auth.uid())
);

drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists push_admin_read on public.push_subscriptions;
create policy push_admin_read on public.push_subscriptions for select using (public.is_admin());  -- para contar instalaciones

-- ---------- Storage: fotos de barberos ----------

insert into storage.buckets (id, name, public) values ('barbers', 'barbers', true) on conflict (id) do nothing;
drop policy if exists "barbers_img_read"  on storage.objects;
drop policy if exists "barbers_img_admin" on storage.objects;
create policy "barbers_img_read"  on storage.objects for select using (bucket_id = 'barbers');
create policy "barbers_img_admin" on storage.objects for all
  using (bucket_id = 'barbers' and public.is_admin()) with check (bucket_id = 'barbers' and public.is_admin());

-- ---------- Datos iniciales ----------

insert into public.services (name, description, price_crc, duration_min, sort_order)
select * from (values
  ('Barba Express',       'Menos de 15 minutos',           7000,  15, 1),
  ('Barba',               'Perfilado y arreglo completo',  8250,  30, 2),
  ('Pelo',                'Corte a tu estilo',             8750,  40, 3),
  ('Combo Barba + Pelo',  'El paquete completo',          13750,  60, 4),
  ('Mascarilla Facial',   'Limpieza e hidratación',        6000,  20, 5),
  ('Depilación de Nariz', null,                            3000,  10, 6),
  ('Depilación de Orejas',null,                            2500,  10, 7)
) as v(name, description, price_crc, duration_min, sort_order)
where not exists (select 1 from public.services);

-- Un barbero de ejemplo con horario Lunes–Sábado 9:00–19:00, almuerzo 12:00–13:00
with b as (
  insert into public.barbers (name, specialty, sort_order)
  select 'Barbero Barba Roja', 'Cortes clásicos y barba', 1
  where not exists (select 1 from public.barbers)
  returning id
)
insert into public.barber_schedules (barber_id, weekday, start_time, end_time, break_start, break_end)
select b.id, d, '09:00', '19:00', '12:00', '13:00' from b, generate_series(1,6) d;

-- ---------- Recordatorios automáticos (opcional) ----------
-- Activa pg_cron y pg_net en Supabase y programa la Edge Function cada 10 min:
--
-- select cron.schedule('barba-roja-recordatorios', '*/10 * * * *', $$
--   select net.http_post(
--     url     := 'https://TU-PROYECTO.supabase.co/functions/v1/send-push',
--     headers := '{"Content-Type":"application/json","x-cron-secret":"TU_CRON_SECRET"}'::jsonb,
--     body    := '{"mode":"reminders"}'::jsonb);
-- $$);
--
-- Para volver admin a tu usuario (después de registrarte en la app):
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'tu@correo.com');
