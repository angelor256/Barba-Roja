import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseYmd, todayCR, ymd } from '../lib/dates';

/** Calendario mensual. `isEnabled(day)` decide qué días se pueden elegir. */
export default function Calendar({ value, onChange, isEnabled, maxDaysAhead = 60 }) {
  const today = todayCR();
  const [cursor, setCursor] = useState(() => { const d = parseYmd(value || today); d.setDate(1); return d; });
  const first = new Date(cursor);
  const lead = first.getDay();
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const maxDay = ymd(new Date(parseYmd(today).getTime() + maxDaysAhead * 86400000));
  const monthLabel = cursor.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
  const move = (n) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const canPrev = ymd(new Date(cursor.getFullYear(), cursor.getMonth(), 0)) >= today;
  const canNext = ymd(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) <= maxDay;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button onClick={() => move(-1)} disabled={!canPrev} aria-label="Mes anterior" className="rounded-full p-2 transition hover:bg-white/10 disabled:opacity-20"><ChevronLeft /></button>
        <span className="font-display text-3xl capitalize tracking-wide">{monthLabel}</span>
        <button onClick={() => move(1)} disabled={!canNext} aria-label="Mes siguiente" className="rounded-full p-2 transition hover:bg-white/10 disabled:opacity-20"><ChevronRight /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <span key={i} className="py-1 text-xs font-bold text-neutral-500">{d}</span>)}
        {Array.from({ length: lead }).map((_, i) => <span key={'b' + i} />)}
        {Array.from({ length: days }, (_, i) => {
          const day = ymd(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1));
          const ok = day >= today && day <= maxDay && isEnabled(day);
          const sel = day === value;
          return (
            <button key={day} disabled={!ok} onClick={() => onChange(day)}
              className={`aspect-square rounded-full text-sm font-semibold transition duration-200
                ${sel ? 'scale-105 bg-brand text-white shadow-glow' : ok ? 'bg-white/5 hover:bg-white/15' : 'text-neutral-700'}
                ${day === today && !sel ? 'ring-1 ring-brand' : ''}`}>
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
