import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { addDays, crDate, crDay, parseYmd, startOfWeek, todayCR, weekdayOf, ymd } from '../../lib/dates';
import { crc, fmtDate, fmtTime, STATUS } from '../../lib/format';
import { WEEKDAYS } from '../../lib/config';

const VIEWS = { day: 'Día', week: 'Semana', month: 'Mes' };

function range(view, day) {
  if (view === 'day') return [day, day];
  if (view === 'week') { const s = startOfWeek(day); return [s, addDays(s, 6)]; }
  const d = parseYmd(day);
  const first = ymd(new Date(d.getFullYear(), d.getMonth(), 1));
  const last = ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return [first, last];
}

export default function Agenda() {
  const [view, setView] = useState('day');
  const [day, setDay] = useState(todayCR());
  const [barbers, setBarbers] = useState([]);
  const [barber, setBarber] = useState('all');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [from, to] = range(view, day);

  const load = useCallback(async () => {
    let q = supabase.from('appointments')
      .select('*, barbers(name), profiles(full_name, phone), appointment_services(name)')
      .gte('start_at', crDate(from, '00:00').toISOString())
      .lte('start_at', crDate(to, '23:59').toISOString())
      .order('start_at');
    if (barber !== 'all') q = q.eq('barber_id', barber);
    const { data } = await q;
    setRows(data ?? []);
  }, [from, to, barber]);

  useEffect(() => { supabase.from('barbers').select('id,name').order('sort_order').then(({ data }) => setBarbers(data ?? [])); }, []);
  useEffect(() => { load(); }, [load]);

  const step = (n) => {
    if (view === 'day') setDay(addDays(day, n));
    else if (view === 'week') setDay(addDays(day, 7 * n));
    else { const d = parseYmd(day); setDay(ymd(new Date(d.getFullYear(), d.getMonth() + n, 1))); }
  };

  const setStatus = async (id, status) => {
    setErr('');
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) setErr(error.code === '23P01' ? 'No se puede reactivar: el horario ya fue ocupado.' : error.message); else load();
  };

  const byDay = useMemo(() => {
    const m = {};
    rows.forEach((r) => { (m[crDay(r.start_at)] ||= []).push(r); });
    return m;
  }, [rows]);

  const title = view === 'month'
    ? parseYmd(day).toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })
    : view === 'week' ? `${fmtDate(crDate(from, '12:00'), { day: 'numeric', month: 'short' })} – ${fmtDate(crDate(to, '12:00'), { day: 'numeric', month: 'short' })}`
    : fmtDate(crDate(day, '12:00'));

  const Card = ({ a }) => (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="price text-base">{fmtTime(a.start_at)}–{fmtTime(a.end_at)}</span>
        <select value={a.status} onChange={(e) => setStatus(a.id, e.target.value)}
          className={`chip border-0 outline-none ${STATUS[a.status].cls}`}>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k} className="bg-ink-900 text-white">{v.label}</option>)}
        </select>
      </div>
      <p className="font-semibold">{a.profiles?.full_name || 'Cliente'}
        {a.profiles?.phone && <a href={`tel:${a.profiles.phone}`} className="ml-2 text-xs text-sky-400">{a.profiles.phone}</a>}</p>
      <p className="text-xs text-neutral-400">{a.barbers?.name} · {a.appointment_services.map((s) => s.name).join(', ')} · {crc(a.total_crc)}</p>
      {a.notes && <p className="mt-1 text-xs italic text-neutral-500">“{a.notes}”</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-ink-600">
          {Object.entries(VIEWS).map(([k, v]) => (
            <button key={k} onClick={() => setView(k)} className={`px-3 py-2 text-xs font-bold uppercase ${view === k ? 'bg-brand' : 'bg-ink-800'}`}>{v}</button>
          ))}
        </div>
        <select className="input !w-auto" value={barber} onChange={(e) => setBarber(e.target.value)}>
          <option value="all">Todos los barberos</option>
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => step(-1)} className="btn-ghost btn-sm" aria-label="Anterior"><ChevronLeft size={16} /></button>
          <button onClick={() => setDay(todayCR())} className="btn-ghost btn-sm">Hoy</button>
          <button onClick={() => step(1)} className="btn-ghost btn-sm" aria-label="Siguiente"><ChevronRight size={16} /></button>
        </div>
      </div>
      <h2 className="font-display text-4xl capitalize tracking-wide">{title}</h2>
      {err && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{err}</p>}

      {view === 'day' && (
        <div className="space-y-2">
          {rows.length === 0 && <p className="text-neutral-500">Sin citas este día.</p>}
          {rows.map((a) => <Card key={a.id} a={a} />)}
        </div>
      )}

      {view === 'week' && (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => addDays(from, i)).map((d) => (
            <div key={d} className="space-y-2">
              <button onClick={() => { setDay(d); setView('day'); }} className={`w-full rounded-lg px-2 py-1 text-left text-xs font-bold uppercase ${d === todayCR() ? 'bg-brand' : 'bg-ink-800'}`}>
                {WEEKDAYS[weekdayOf(d)].slice(0, 3)} {parseYmd(d).getDate()}
              </button>
              {(byDay[d] ?? []).map((a) => <Card key={a.id} a={a} />)}
            </div>
          ))}
        </div>
      )}

      {view === 'month' && (() => {
        const first = parseYmd(from); const n = parseYmd(to).getDate();
        return (
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => <span key={w} className="py-1 text-center text-xs font-bold text-neutral-500">{w.slice(0, 3)}</span>)}
            {Array.from({ length: first.getDay() }).map((_, i) => <span key={'b' + i} />)}
            {Array.from({ length: n }, (_, i) => {
              const d = ymd(new Date(first.getFullYear(), first.getMonth(), i + 1));
              const list = (byDay[d] ?? []).filter((a) => a.status !== 'cancelled');
              return (
                <button key={d} onClick={() => { setDay(d); setView('day'); }}
                  className={`min-h-16 rounded-lg border p-1.5 text-left ${d === todayCR() ? 'border-brand' : 'border-ink-700'} bg-ink-800 hover:bg-ink-700`}>
                  <span className="text-xs font-bold">{i + 1}</span>
                  {list.length > 0 && <span className="mt-1 block rounded bg-brand px-1 text-center text-[11px] font-bold">{list.length} cita{list.length > 1 ? 's' : ''}</span>}
                </button>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
