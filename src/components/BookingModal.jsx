import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, ChevronLeft, Clock, Scissors, User, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import Calendar from './Calendar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { crc, fmtDate, fmtTime } from '../lib/format';
import { crDate } from '../lib/dates';
import { freeSlots, worksOn } from '../lib/availability';
import { enablePush, pushSupported } from '../lib/push';

const STEPS = ['Servicio', 'Barbero', 'Fecha y hora', 'Confirmar'];
const ANY = 'any';

export default function BookingModal({ catalog, onClose, onNeedAuth }) {
  const { user } = useAuth();
  const { services, barbers, schedules, timeOff } = catalog;

  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState([]);           // ids de servicios
  const [barberId, setBarberId] = useState(null);     // uuid | ANY
  const [day, setDay] = useState(null);
  const [busy, setBusy] = useState([]);
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [slot, setSlot] = useState(null);             // { start: Date, barberId }
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [pushMsg, setPushMsg] = useState('');

  const chosen = services.filter((s) => picked.includes(s.id));
  const total = chosen.reduce((a, s) => a + s.price_crc, 0);
  const duration = chosen.reduce((a, s) => a + s.duration_min, 0);
  const candidateIds = useMemo(
    () => (barberId === ANY ? barbers.map((b) => b.id) : barberId ? [barberId] : []), [barberId, barbers]);

  // Citas ocupadas del día elegido (RPC sin datos personales)
  const fetchBusy = async (d) => {
    if (!supabase || !d) return;
    setLoadingBusy(true);
    const { data } = await supabase.rpc('get_busy_slots', {
      p_from: crDate(d, '00:00').toISOString(), p_to: crDate(d, '23:59').toISOString(), p_barber: null,
    });
    setBusy(data ?? []);
    setLoadingBusy(false);
  };
  useEffect(() => { setSlot(null); fetchBusy(day); }, [day]); // eslint-disable-line

  // Horas disponibles; con "cualquier barbero" se unen y se asigna el primero libre
  const slots = useMemo(() => {
    if (!day || !duration) return [];
    const map = new Map();
    for (const id of candidateIds) {
      for (const t of freeSlots({ day, barberId: id, schedules, busy, timeOff, durationMin: duration })) {
        if (!map.has(t.getTime())) map.set(t.getTime(), { start: t, barberId: id });
      }
    }
    return [...map.values()].sort((a, b) => a.start - b.start);
  }, [day, candidateIds, schedules, busy, timeOff, duration]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const barberName = (id) => barbers.find((b) => b.id === id)?.name;

  const canNext = [picked.length > 0, !!barberId, !!slot, true][step];

  const confirm = async () => {
    setError('');
    if (!user) return onNeedAuth();
    setSaving(true);
    const { error: err } = await supabase.rpc('book_appointment', {
      p_barber: slot.barberId, p_start: slot.start.toISOString(), p_service_ids: picked, p_notes: notes || null,
    });
    setSaving(false);
    if (!err) return setDone(true);
    if (err.code === '23P01') { setError('Ese horario acaba de ser reservado por otra persona. Elige otro.'); setStep(2); setSlot(null); fetchBusy(day); }
    else setError(err.message);
  };

  const activatePush = async () => {
    try { await enablePush(user.id); setPushMsg('¡Listo! Te avisaremos antes de tu cita.'); }
    catch (e) { setPushMsg(e.message); }
  };

  // ---------- Éxito ----------
  if (done) {
    return (
      <Modal title="¡Cita agendada!" onClose={onClose}>
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand"><Check size={36} /></div>
          <p className="font-heading text-2xl">{fmtDate(slot.start)}</p>
          <p className="font-display text-4xl text-brand">{fmtTime(slot.start)}</p>
          <p className="mt-2 text-neutral-400">con {barberName(slot.barberId)} · {chosen.map((s) => s.name).join(', ')}</p>
          <p className="mt-1 text-sm text-neutral-500">Estado: pendiente de confirmación por la barbería.</p>
          {pushSupported() && !pushMsg && (
            <button onClick={activatePush} className="btn-ghost mt-5 w-full"><Bell size={18} /> Activar recordatorio de mi cita</button>
          )}
          {pushMsg && <p className="mt-4 text-sm text-neutral-300">{pushMsg}</p>}
          <Link to="/perfil" onClick={onClose} className="btn-primary mt-4 w-full">Ver mis citas</Link>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Agendar cita" onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          {step > 0 && <button onClick={() => setStep(step - 1)} className="btn-ghost"><ChevronLeft size={18} /></button>}
          <div className="flex-1 text-sm">
            {picked.length > 0 && <><p className="font-display text-xl text-brand">{crc(total)}</p><p className="flex items-center gap-1 text-xs text-neutral-400"><Clock size={12} /> {duration} min</p></>}
          </div>
          {step < 3
            ? <button disabled={!canNext} onClick={() => setStep(step + 1)} className="btn-primary">Continuar</button>
            : <button disabled={saving} onClick={confirm} className="btn-primary">{saving ? 'Reservando…' : user ? 'Confirmar cita' : 'Inicia sesión'}</button>}
        </div>
      }>
      {/* Indicador de pasos */}
      <ol className="mb-5 flex gap-1">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1 rounded ${i <= step ? 'bg-brand' : 'bg-ink-700'}`} />
            <span className={`mt-1 block text-[10px] font-bold uppercase ${i === step ? 'text-white' : 'text-neutral-600'}`}>{i + 1}. {s}</span>
          </li>
        ))}
      </ol>

      {!supabase && <p className="mb-3 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">Modo demo: conecta Supabase para reservar de verdad.</p>}
      {error && <p className="mb-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {/* Paso 1 */}
      {step === 0 && (
        <ul className="space-y-2">
          {services.map((s) => {
            const on = picked.includes(s.id);
            return (
              <li key={s.id}>
                <button onClick={() => toggle(s.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${on ? 'border-brand bg-brand/10' : 'border-ink-700 bg-ink-800 hover:border-ink-600'}`}>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${on ? 'border-brand bg-brand' : 'border-ink-600'}`}>{on && <Check size={16} />}</span>
                  <span className="flex-1"><span className="block font-heading text-lg leading-tight">{s.name}</span>
                    <span className="text-xs text-neutral-400">{s.duration_min} min</span></span>
                  <span className="font-display text-xl">{crc(s.price_crc)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Paso 2 */}
      {step === 1 && (
        <div className="space-y-2">
          {barbers.length === 0 && <p className="text-neutral-400">Aún no hay barberos disponibles para reservar en línea.</p>}
          {barbers.length > 0 && (
            <BarberOption active={barberId === ANY} onClick={() => { setBarberId(ANY); setSlot(null); }} icon={<Users />} title="Cualquier barbero disponible" sub="Te asignamos el primero libre" />
          )}
          {barbers.map((b) => (
            <BarberOption key={b.id} active={barberId === b.id} onClick={() => { setBarberId(b.id); setSlot(null); }}
              img={b.photo_url} icon={<User />} title={b.name} sub={b.specialty} />
          ))}
        </div>
      )}

      {/* Paso 3 */}
      {step === 2 && (
        <div className="space-y-5">
          <Calendar value={day} onChange={setDay} isEnabled={(d) => worksOn({ day: d, barberIds: candidateIds, schedules, timeOff })} />
          {day && (
            <div>
              <p className="label">{fmtDate(crDate(day, '12:00'))}</p>
              {loadingBusy ? <p className="text-sm text-neutral-500">Buscando horas…</p>
                : slots.length === 0 ? <p className="text-sm text-neutral-400">No hay horas libres este día. Prueba otra fecha.</p>
                : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => {
                      const on = slot?.start.getTime() === s.start.getTime();
                      return (
                        <button key={s.start.getTime()} onClick={() => setSlot(s)}
                          className={`rounded-lg border py-2 text-sm font-bold ${on ? 'border-brand bg-brand' : 'border-ink-700 bg-ink-800 hover:border-brand'}`}>
                          {fmtTime(s.start)}
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Paso 4 */}
      {step === 3 && slot && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <div><p className="label">Cuándo</p><p className="font-heading text-xl capitalize">{fmtDate(slot.start)} · {fmtTime(slot.start)}</p></div>
            <div><p className="label">Barbero</p><p className="flex items-center gap-2"><Scissors size={16} className="text-brand" />{barberName(slot.barberId)}</p></div>
            <div>
              <p className="label">Servicios</p>
              <ul className="space-y-1 text-sm">{chosen.map((s) => <li key={s.id} className="flex justify-between"><span>{s.name}</span><span>{crc(s.price_crc)}</span></li>)}</ul>
              <p className="mt-2 flex justify-between border-t border-ink-700 pt-2 font-bold"><span>Total ({duration} min)</span><span className="text-brand">{crc(total)}</span></p>
            </div>
          </div>
          <div><label className="label">Notas (opcional)</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. degradado bajo, barba con navaja…" /></div>
          {!user && <p className="text-sm text-amber-300">Necesitas iniciar sesión o crear una cuenta para confirmar.</p>}
        </div>
      )}
    </Modal>
  );
}

function BarberOption({ active, onClick, img, icon, title, sub }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${active ? 'border-brand bg-brand/10' : 'border-ink-700 bg-ink-800 hover:border-ink-600'}`}>
      {img ? <img src={img} alt="" className="h-12 w-12 rounded-full object-cover" />
        : <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-700 text-neutral-300">{icon}</span>}
      <span><span className="block font-heading text-lg leading-tight">{title}</span>{sub && <span className="text-xs text-neutral-400">{sub}</span>}</span>
    </button>
  );
}
