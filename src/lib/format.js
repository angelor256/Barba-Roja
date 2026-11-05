import { TZ } from './config';

export const crc = (n) => '₡' + Number(n).toLocaleString('en-US');

export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString('es-CR', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });

export const fmtDate = (d, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Date(d).toLocaleDateString('es-CR', { ...opts, timeZone: TZ });

export const fmtDateTime = (d) => `${fmtDate(d)} · ${fmtTime(d)}`;

export const STATUS = {
  pending: { label: 'Pendiente', cls: 'bg-amber-500/20 text-amber-300' },
  confirmed: { label: 'Confirmada', cls: 'bg-emerald-500/20 text-emerald-300' },
  completed: { label: 'Completada', cls: 'bg-sky-500/20 text-sky-300' },
  cancelled: { label: 'Cancelada', cls: 'bg-neutral-500/20 text-neutral-400' },
};
