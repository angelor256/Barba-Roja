import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ChevronLeft, Clock, Scissors, Users, User } from 'lucide-react';
import Calendar from './Calendar';
import { Avatar, DemoNotice } from './ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { crc, fmtDate, fmtTime } from '../lib/format';
import { crDate } from '../lib/dates';
import { freeSlots, worksOn } from '../lib/availability';
import { enablePush, pushSupported } from '../lib/push';
import { demoBook, demoBusy, demoProfile } from '../lib/demo';

const STEPS = ['Servicio', 'Barbero', 'Fecha', 'Confirmar'];
const ANY = 'any';

export default function BookingFlow({ initial = {} }) {
  const { user } = useAuth();
  const { catalog, openAuth } = useApp();
  const { services, barbers, schedules, timeOff } = catalog;
  const demo = !supabase;

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(initial.services ?? []);
  const [barberId, setBarberId] = useState(initial.barber ?? null);
  const [day, setDay] = useState(null);
  const [busy, setBusy] = useState([]);
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [slot, setSlot] = useState(null);                       // { start: Date, barberId }
  const [notes, setNotes] = useState('');
  const [guest, setGuest] = useState(() => (demo ? demoProfile() : { full_name: '', phone: '' }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pushMsg, setPushMsg] = useState('');
  const slotsRef = useRef(null);

  const chosen = services.filter((s) => picked.includes(s.id));
  const total = chosen.reduce((a, s) => a + s.price_crc, 0);
  const duration = chosen.reduce((a, s) => a + s.duration_min, 0);
  const candidateIds = useMemo(() => (barberId === ANY ? barbers.map((b) => b.id) : barberId ? [barberId] : []), [barberId, barbers]);
  const barberName = (id) => barbers.find((b) => b.id === id)?.name;

  const fetchBusy = async (d) => {
    if (!d) return;
    setLoadingBusy(true);
    if (demo) { await new Promise((r) => setTimeout(r, 250)); setBusy(demoBusy(d)); }
    else {
      const { data } = await supabase.rpc('get_busy_slots', { p_from: crDate(d, '00:00').toISOString(), p_to: crDate(d, '23:59').toISOString(), p_barber: null });
      setBusy(data ?? []);
    }
    setLoadingBusy(false);
  };
  useEffect(() => { setSlot(null); fetchBusy(day); }, [day]); // eslint-disable-line
  // Al elegir un día, llevar las horas a la vista (en móvil quedan debajo del calendario)
  useEffect(() => { if (day && !loadingBusy) slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [day, loadingBusy]);

  // Con "cualquier barbero" se unen los horarios y se asigna el primero libre
  const slots = useMemo(() => {
    if (!day || !duration) return [];
    const map = new Map();
    for (const id of candidateIds)
      for (const t of freeSlots({ day, barberId: id, schedules, busy, timeOff, durationMin: duration }))
        if (!map.has(t.getTime())) map.set(t.getTime(), { start: t, barberId: id });
    return [...map.values()].sort((a, b) => a.start - b.start);
  }, [day, candidateIds, schedules, busy, timeOff, duration]);

  useEffect(() => { if (done) window.scrollTo({ top: 0, behavior: 'smooth' }); }, [done]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const canNext = [chosen.length > 0, !!barberId, !!slot, true][step];
  const needsName = demo && !guest.full_name.trim();

  const confirm = async () => {
    setError('');
    if (!demo && !user) return openAuth();
    setSaving(true);
    if (demo) {
      await new Promise((r) => setTimeout(r, 600));
      demoBook({ barber: barbers.find((b) => b.id === slot.barberId), start: slot.start, services: chosen, name: guest.full_name.trim(), phone: guest.phone, notes });
      setSaving(false); return setDone(true);
    }
    const { error: err } = await supabase.rpc('book_appointment', { p_barber: slot.barberId, p_start: slot.start.toISOString(), p_service_ids: picked, p_notes: notes || null });
    setSaving(false);
    if (!err) return setDone(true);
    if (err.code === '23P01') { setError('Ese horario acaba de ser reservado por otra persona. Elige otro.'); setStep(2); setSlot(null); fetchBusy(day); }
    else setError(err.message);
  };

  const activatePush = async () => {
    try { await enablePush(user.id); setPushMsg('¡Listo! Te avisaremos antes de tu cita.'); } catch (e) { setPushMsg(e.message); }
  };

  /* ---------- Éxito ---------- */
  if (done) {
    return (
      <div className="mx-auto max-w-lg px-5 py-12 text-center page-enter">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-brand-light to-brand shadow-glow-lg"><Check size={40} /></div>
        <h1 className="font-display text-6xl uppercase leading-none">¡Cita agendada!</h1>
        <div className="card mt-8 !p-6">
          <p className="text-sm capitalize text-neutral-400">{fmtDate(slot.start)}</p>
          <p className="price text-5xl text-brand">{fmtTime(slot.start)}</p>
          <p className="mt-3 text-neutral-300">con <b className="text-white">{barberName(slot.barberId)}</b></p>
          <p className="text-sm text-neutral-400">{chosen.map((s) => s.name).join(' + ')} · {crc(total)}</p>
        </div>
        <p className="mt-3 text-xs text-neutral-500">{demo ? 'Cita de demostración guardada en este dispositivo.' : 'Estado: pendiente de confirmación por la barbería.'}</p>
        {!demo && pushSupported() && !pushMsg && <button onClick={activatePush} className="btn-ghost mt-5 w-full"><Bell size={18} /> Activar recordatorio de mi cita</button>}
        {pushMsg && <p className="mt-4 text-sm text-neutral-300">{pushMsg}</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to="/perfil" className="btn-primary">Ver mis citas</Link>
          <Link to="/" className="btn-ghost">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 pb-36 md:pb-10">
      <p className="eyebrow">Reserva en línea</p>
      <h1 className="mb-6 font-display text-6xl uppercase leading-none sm:text-7xl">Agendar cita</h1>
      <DemoNotice className="mb-5" />

      <ol className="mb-6 flex gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className="h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-brand transition-all duration-500 ${i <= step ? 'w-full' : 'w-0'}`} /></div>
            <span className={`mt-1.5 block text-[10px] font-bold uppercase tracking-wider transition ${i === step ? 'text-white' : 'text-neutral-600'}`}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>

      {error && <p className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      <div key={step} className="page-enter">
        {step === 0 && (
          <ul className="space-y-2">
            {services.map((s) => {
              const on = picked.includes(s.id);
              return (
                <li key={s.id}>
                  <button onClick={() => toggle(s.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition duration-300 ${on ? 'border-brand bg-brand/10 shadow-glow' : 'border-white/10 bg-white/[0.04] hover:border-white/25'}`}>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${on ? 'border-brand bg-brand' : 'border-white/20'}`}>{on && <Check size={14} />}</span>
                    <span className="flex-1"><span className="block font-display text-2xl leading-tight tracking-wide">{s.name}</span>
                      <span className="flex items-center gap-1 text-xs text-neutral-400"><Clock size={11} /> {s.duration_min} min</span></span>
                    <span className="price">{crc(s.price_crc)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {step === 1 && (
          <div className="space-y-2">
            {barbers.length === 0 && <p className="text-neutral-400">Aún no hay barberos disponibles para reservar en línea.</p>}
            {barbers.length > 0 && <BarberOption active={barberId === ANY} onClick={() => { setBarberId(ANY); setSlot(null); }} icon={<Users size={22} />} title="Cualquier barbero disponible" sub="Te asignamos el primero libre" />}
            {barbers.map((b) => <BarberOption key={b.id} active={barberId === b.id} onClick={() => { setBarberId(b.id); setSlot(null); }} barber={b} title={b.name} sub={b.specialty} />)}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="card !p-4"><Calendar value={day} onChange={setDay} isEnabled={(d) => worksOn({ day: d, barberIds: candidateIds, schedules, timeOff })} /></div>
            {day && (
              <div ref={slotsRef}>
                <p className="mb-2 text-sm font-semibold text-neutral-300 first-letter:uppercase">{fmtDate(crDate(day, '12:00'))}</p>
                {loadingBusy ? <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />)}</div>
                  : slots.length === 0 ? <p className="text-sm text-neutral-400">No hay horas libres este día. Prueba otra fecha.</p>
                  : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((s) => {
                        const on = slot?.start.getTime() === s.start.getTime();
                        return <button key={s.start.getTime()} onClick={() => setSlot(s)} className={`rounded-xl border py-2.5 text-sm font-semibold transition duration-200 ${on ? 'border-brand bg-brand shadow-glow' : 'border-white/10 bg-white/5 hover:border-brand/60'}`}>{fmtTime(s.start)}</button>;
                      })}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {step === 3 && slot && (
          <div className="space-y-4">
            <div className="card space-y-4 !p-5">
              <div><p className="label">Cuándo</p><p className="font-display text-3xl capitalize leading-tight">{fmtDate(slot.start)} · {fmtTime(slot.start)}</p></div>
              <div><p className="label">Barbero</p><p className="flex items-center gap-2"><Scissors size={16} className="text-brand" />{barberName(slot.barberId)}</p></div>
              <div>
                <p className="label">Servicios</p>
                <ul className="space-y-1 text-sm">{chosen.map((s) => <li key={s.id} className="flex justify-between"><span>{s.name}</span><span className="price">{crc(s.price_crc)}</span></li>)}</ul>
                <p className="mt-3 flex justify-between border-t border-white/10 pt-3 font-bold"><span>Total ({duration} min)</span><span className="price text-lg text-brand">{crc(total)}</span></p>
              </div>
            </div>
            {demo && (
              <div className="card grid gap-3 !p-5 sm:grid-cols-2">
                <div><label className="label">Tu nombre</label><input className="input" value={guest.full_name} onChange={(e) => setGuest({ ...guest, full_name: e.target.value })} placeholder="Ej. Juan Pérez" autoComplete="name" /></div>
                <div><label className="label">Teléfono (opcional)</label><input className="input" inputMode="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} placeholder="8888-8888" autoComplete="tel" /></div>
              </div>
            )}
            <div><label className="label">Notas (opcional)</label><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. degradado bajo, barba con navaja…" /></div>
            {!demo && !user && <p className="text-sm text-amber-300">Necesitas iniciar sesión o crear una cuenta para confirmar.</p>}
          </div>
        )}
      </div>

      {/* Barra de acción fija sobre la barra inferior */}
      <div className="glass fixed inset-x-3 bottom-24 z-30 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl p-3 shadow-soft md:sticky md:inset-x-0 md:bottom-4 md:mt-8">
        {step > 0 && <button onClick={() => setStep(step - 1)} className="btn-ghost !px-3.5" aria-label="Atrás"><ChevronLeft size={18} /></button>}
        <div className="min-w-0 flex-1 pl-1">
          {chosen.length > 0 ? <><p className="price text-lg text-brand">{crc(total)}</p><p className="flex items-center gap-1 text-xs text-neutral-400"><Clock size={11} /> {duration} min</p></>
            : <p className="text-sm text-neutral-500">Elige al menos un servicio</p>}
        </div>
        {step < 3
          ? <button disabled={!canNext} onClick={() => setStep(step + 1)} className="btn-primary">Continuar</button>
          : <button disabled={saving || needsName} onClick={confirm} className="btn-primary">{saving ? 'Reservando…' : demo || user ? 'Confirmar cita' : 'Iniciar sesión'}</button>}
      </div>
    </div>
  );
}

function BarberOption({ active, onClick, barber, icon, title, sub }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-4 rounded-2xl border p-3.5 text-left transition duration-300 ${active ? 'border-brand bg-brand/10 shadow-glow' : 'border-white/10 bg-white/[0.04] hover:border-white/25'}`}>
      {barber ? <Avatar barber={barber} size={52} /> : <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-white/10 text-neutral-300">{icon || <User />}</span>}
      <span><span className="block font-display text-2xl leading-tight tracking-wide">{title}</span>{sub && <span className="text-xs text-neutral-400">{sub}</span>}</span>
    </button>
  );
}
