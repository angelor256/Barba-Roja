// Modo demostración (sin Supabase): barberos ficticios + citas guardadas solo en este dispositivo.
import { crDate } from './dates';

export const DEMO_BARBERS = [
  { id: 'demo-mateo', name: 'Mateo Vargas', nickname: 'El Rojo', specialty: 'Degradados y fade', years: 9, sort_order: 1, active: true,
    bio: 'Fundador del estilo de la casa. Especialista en degradados limpios y cortes modernos que se mantienen días.' },
  { id: 'demo-diego', name: 'Diego Alvarado', nickname: 'La Navaja', specialty: 'Barba y navaja clásica', years: 7, sort_order: 2, active: true,
    bio: 'Barba perfilada a navaja y toalla caliente. Si buscas el ritual completo, es tu barbero.' },
  { id: 'demo-kevin', name: 'Kevin Solano', nickname: 'K-Style', specialty: 'Diseños y estilos urbanos', years: 5, sort_order: 3, active: true,
    bio: 'Líneas, diseños y looks urbanos. Siempre al día con las tendencias sin perder la esencia.' },
  { id: 'demo-andres', name: 'Andrés Mora', nickname: 'El Gentleman', specialty: 'Corte clásico y ejecutivo', years: 11, sort_order: 4, active: true,
    bio: 'Corte clásico, ejecutivo y arreglo de barba con mucha paciencia al detalle.' },
];

// Lun–Sáb 9:00–19:00 (sáb hasta 17:00), almuerzo 12:00–13:00. Kevin descansa los lunes.
export const DEMO_SCHEDULES = DEMO_BARBERS.flatMap((b) =>
  [1, 2, 3, 4, 5, 6].filter((d) => !(b.id === 'demo-kevin' && d === 1)).map((d) => ({
    barber_id: b.id, weekday: d, start_time: '09:00', end_time: d === 6 ? '17:00' : '19:00', break_start: '12:00', break_end: '13:00',
  })));

const KEY = 'br_demo_appts';
const PKEY = 'br_demo_profile';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } };

export const demoProfile = () => read(PKEY, { full_name: '', phone: '' });
export const saveDemoProfile = (p) => write(PKEY, p);

// Hash determinista para simular que ya hay clientes agendados
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); }

/** Citas ocupadas de un día: ~30 % simuladas + las que el usuario creó en la demo. */
export function demoBusy(day) {
  const out = [];
  for (const b of DEMO_BARBERS) {
    for (let i = 0; i < 20; i++) {              // 9:00 → 18:30 cada 30 min
      const mins = 9 * 60 + i * 30;
      if (mins >= 12 * 60 && mins < 13 * 60) continue;
      const h = hash(`${day}|${b.id}|${i}`);
      if (h % 100 < 30) {
        const len = h % 7 < 2 ? 60 : 30;
        const hh = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        out.push({ barber_id: b.id, start_at: crDate(day, hh(mins)).toISOString(), end_at: crDate(day, hh(mins + len)).toISOString() });
        i += len / 30 - 1;
      }
    }
  }
  const dayStart = crDate(day, '00:00').getTime(), dayEnd = crDate(day, '23:59').getTime();
  demoAppointments().filter((a) => a.status !== 'cancelled' && +new Date(a.start_at) >= dayStart && +new Date(a.start_at) <= dayEnd)
    .forEach((a) => out.push({ barber_id: a.barber_id, start_at: a.start_at, end_at: a.end_at }));
  return out;
}

export const demoAppointments = () => read(KEY, []);

export function demoBook({ barber, start, services, name, phone, notes }) {
  const dur = services.reduce((a, s) => a + s.duration_min, 0);
  const appt = {
    id: 'd' + Date.now(), barber_id: barber.id, barbers: { name: barber.name },
    start_at: start.toISOString(), end_at: new Date(start.getTime() + dur * 60000).toISOString(),
    status: 'pending', notes: notes || null, total_crc: services.reduce((a, s) => a + s.price_crc, 0),
    appointment_services: services.map((s) => ({ name: s.name, price_crc: s.price_crc })), client: { full_name: name, phone },
  };
  write(KEY, [appt, ...demoAppointments()]);
  saveDemoProfile({ full_name: name, phone });
  return appt;
}

export function demoCancel(id) {
  write(KEY, demoAppointments().map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)));
}
