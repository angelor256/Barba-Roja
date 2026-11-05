import { SLOT_STEP_MIN } from './config';
import { crDate, weekdayOf } from './dates';

const MIN = 60_000;

/**
 * Bloques libres de un barbero para un día.
 * @param day       'YYYY-MM-DD' (hora CR)
 * @param schedules horarios semanales del barbero
 * @param busy      [{start_at,end_at}] citas activas
 * @param timeOff   [{barber_id,start_date,end_date}] ausencias (barber_id null = cierre general)
 * @returns Date[] horas de inicio posibles
 */
export function freeSlots({ day, barberId, schedules, busy, timeOff, durationMin }) {
  const sch = schedules.find((s) => s.barber_id === barberId && s.weekday === weekdayOf(day));
  if (!sch || !durationMin) return [];
  if (timeOff.some((t) => (t.barber_id == null || t.barber_id === barberId) && day >= t.start_date && day <= t.end_date)) return [];

  const open = crDate(day, sch.start_time);
  const close = crDate(day, sch.end_time);
  const bs = sch.break_start ? crDate(day, sch.break_start) : null;
  const be = sch.break_end ? crDate(day, sch.break_end) : null;
  const dur = durationMin * MIN;
  const now = Date.now();
  const mine = busy.filter((b) => b.barber_id === barberId);
  const out = [];

  for (let t = open.getTime(); t + dur <= close.getTime(); t += SLOT_STEP_MIN * MIN) {
    const end = t + dur;
    if (t <= now) continue;
    if (bs && t < be.getTime() && end > bs.getTime()) continue;
    if (mine.some((b) => t < new Date(b.end_at).getTime() && end > new Date(b.start_at).getTime())) continue;
    out.push(new Date(t));
  }
  return out;
}

/** ¿Trabaja el barbero este día (aunque esté lleno)? Para habilitar días en el calendario. */
export function worksOn({ day, barberIds, schedules, timeOff }) {
  return barberIds.some((id) =>
    schedules.some((s) => s.barber_id === id && s.weekday === weekdayOf(day)) &&
    !timeOff.some((t) => (t.barber_id == null || t.barber_id === id) && day >= t.start_date && day <= t.end_date));
}
