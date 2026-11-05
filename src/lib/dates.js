import { TZ_OFFSET } from './config';

const p = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' de un Date usando sus componentes locales (para cuadrículas de calendario). */
export const ymd = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

/** Fecha 'YYYY-MM-DD' -> Date a medianoche local (solo para aritmética de calendario). */
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

/** "Hoy" en Costa Rica, sin importar la zona del dispositivo. */
export const todayCR = () => {
  const t = new Date(Date.now() - 6 * 3600_000);
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
};

export const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
export const weekdayOf = (s) => parseYmd(s).getDay();

/** 'YYYY-MM-DD' + 'HH:MM' (hora de Costa Rica) -> Date absoluto */
export const crDate = (day, hhmm) => new Date(`${day}T${hhmm.slice(0, 5)}:00${TZ_OFFSET}`);

/** Date absoluto -> 'YYYY-MM-DD' en hora de Costa Rica */
export const crDay = (d) => {
  const t = new Date(new Date(d).getTime() - 6 * 3600_000);
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}`;
};

export const startOfWeek = (s) => addDays(s, -weekdayOf(s)); // domingo
export const hhmm = (t) => (t ? t.slice(0, 5) : '');
