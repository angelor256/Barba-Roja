import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WEEKDAYS } from '../../lib/config';
import { hhmm, todayCR } from '../../lib/dates';

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lunes primero
const DEFAULT = { on: false, start_time: '09:00', end_time: '19:00', break_start: '12:00', break_end: '13:00' };

export default function Schedules() {
  const [barbers, setBarbers] = useState([]);
  const [barberId, setBarberId] = useState('');
  const [week, setWeek] = useState({});
  const [timeOff, setTimeOff] = useState([]);
  const [msg, setMsg] = useState('');
  const [off, setOff] = useState({ barber_id: '', start_date: todayCR(), end_date: todayCR(), reason: '' });

  const loadOff = useCallback(async () => {
    const { data } = await supabase.from('time_off').select('*, barbers(name)').gte('end_date', todayCR()).order('start_date');
    setTimeOff(data ?? []);
  }, []);

  useEffect(() => {
    supabase.from('barbers').select('id,name').order('sort_order').then(({ data }) => { setBarbers(data ?? []); if (data?.[0]) setBarberId(data[0].id); });
    loadOff();
  }, [loadOff]);

  useEffect(() => {
    if (!barberId) return;
    supabase.from('barber_schedules').select('*').eq('barber_id', barberId).then(({ data }) => {
      const w = {};
      ORDER.forEach((d) => { w[d] = { ...DEFAULT }; });
      (data ?? []).forEach((s) => {
        w[s.weekday] = { on: true, start_time: hhmm(s.start_time), end_time: hhmm(s.end_time), break_start: hhmm(s.break_start), break_end: hhmm(s.break_end) };
      });
      setWeek(w);
    });
  }, [barberId]);

  const set = (d, k, v) => setWeek((w) => ({ ...w, [d]: { ...w[d], [k]: v } }));

  const save = async () => {
    setMsg('');
    const rows = ORDER.filter((d) => week[d].on).map((d) => ({
      barber_id: barberId, weekday: d, start_time: week[d].start_time, end_time: week[d].end_time,
      break_start: week[d].break_start || null, break_end: week[d].break_end || null,
    }));
    const offDays = ORDER.filter((d) => !week[d].on);
    const del = await supabase.from('barber_schedules').delete().eq('barber_id', barberId).in('weekday', offDays);
    const up = rows.length ? await supabase.from('barber_schedules').upsert(rows, { onConflict: 'barber_id,weekday' }) : {};
    const err = del.error || up.error;
    setMsg(err ? err.message : 'Horario guardado ✔');
  };

  const addOff = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('time_off').insert({ ...off, barber_id: off.barber_id || null, reason: off.reason || null });
    if (error) alert(error.message); else { loadOff(); setOff({ ...off, reason: '' }); }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Horario semanal</h2>
        <select className="input" value={barberId} onChange={(e) => setBarberId(e.target.value)}>
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="space-y-2">
          {barberId && ORDER.map((d) => week[d] && (
            <div key={d} className="card !p-3">
              <label className="flex items-center gap-2 font-bold">
                <input type="checkbox" className="accent-brand" checked={week[d].on} onChange={(e) => set(d, 'on', e.target.checked)} /> {WEEKDAYS[d]}
              </label>
              {week[d].on && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <T label="Abre" v={week[d].start_time} on={(v) => set(d, 'start_time', v)} />
                  <T label="Cierra" v={week[d].end_time} on={(v) => set(d, 'end_time', v)} />
                  <T label="Descanso desde" v={week[d].break_start} on={(v) => set(d, 'break_start', v)} />
                  <T label="Descanso hasta" v={week[d].break_end} on={(v) => set(d, 'break_end', v)} />
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={save} className="btn-primary w-full" disabled={!barberId}>Guardar horario</button>
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Feriados y ausencias</h2>
        <form onSubmit={addOff} className="card space-y-3">
          <select className="input" value={off.barber_id} onChange={(e) => setOff({ ...off, barber_id: e.target.value })}>
            <option value="">Toda la barbería (feriado)</option>
            {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Desde</label><input type="date" className="input" value={off.start_date} onChange={(e) => setOff({ ...off, start_date: e.target.value, end_date: e.target.value > off.end_date ? e.target.value : off.end_date })} /></div>
            <div><label className="label">Hasta</label><input type="date" className="input" min={off.start_date} value={off.end_date} onChange={(e) => setOff({ ...off, end_date: e.target.value })} /></div>
          </div>
          <input className="input" placeholder="Motivo (ej. Día de la Madre)" value={off.reason} onChange={(e) => setOff({ ...off, reason: e.target.value })} />
          <button className="btn-primary w-full">Bloquear fechas</button>
        </form>
        <ul className="space-y-2">
          {timeOff.map((t) => (
            <li key={t.id} className="card flex items-center justify-between !p-3">
              <div className="text-sm">
                <p className="font-bold">{t.start_date}{t.end_date !== t.start_date && ` → ${t.end_date}`}</p>
                <p className="text-xs text-neutral-400">{t.barbers?.name ?? 'Toda la barbería'}{t.reason && ` · ${t.reason}`}</p>
              </div>
              <button aria-label="Eliminar" onClick={async () => { await supabase.from('time_off').delete().eq('id', t.id); loadOff(); }} className="text-neutral-500 hover:text-brand"><Trash2 size={18} /></button>
            </li>
          ))}
          {timeOff.length === 0 && <p className="text-sm text-neutral-500">Sin bloqueos próximos.</p>}
        </ul>
      </section>
    </div>
  );
}

const T = ({ label, v, on }) => (
  <div><span className="label">{label}</span><input type="time" className="input" value={v ?? ''} onChange={(e) => on(e.target.value)} /></div>
);
