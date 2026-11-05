import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, BellOff, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { crc, fmtDateTime, STATUS } from '../lib/format';
import { disablePush, enablePush, getPushState } from '../lib/push';

export default function Profile({ onLogin }) {
  const { ready, user, profile, signOut, refreshProfile } = useAuth();
  const [appts, setAppts] = useState([]);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [push, setPush] = useState('off');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('appointments')
      .select('*, barbers(name), appointment_services(name, price_crc)')
      .eq('client_id', user.id).order('start_at', { ascending: false });
    setAppts(data ?? []);
  }, [user]);

  useEffect(() => { load(); getPushState().then(setPush); }, [load]);
  useEffect(() => { if (profile) setForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' }); }, [profile]);

  if (!ready) return null;
  if (!user) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="mb-4 text-neutral-300">Inicia sesión para ver tu perfil y tus citas.</p>
      <button onClick={onLogin} className="btn-primary">Iniciar sesión</button>
    </div>
  );

  const save = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    setMsg(error ? error.message : 'Perfil actualizado'); refreshProfile();
  };
  const cancel = async (id) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    const { error } = await supabase.rpc('cancel_my_appointment', { p_id: id });
    if (error) alert(error.message); else load();
  };
  const togglePush = async () => {
    try { if (push === 'on') await disablePush(); else await enablePush(user.id); setPush(await getPushState()); }
    catch (e) { alert(e.message); }
  };

  const now = Date.now();
  const upcoming = appts.filter((a) => new Date(a.end_at) > now && ['pending', 'confirmed'].includes(a.status)).reverse();
  const past = appts.filter((a) => !upcoming.includes(a));

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <h1 className="title-stamp text-4xl">Mi perfil</h1>

      <form onSubmit={save} className="card space-y-3">
        <div><label className="label">Nombre</label><input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><label className="label">Teléfono</label><input className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <p className="text-xs text-neutral-500">{user.email}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary btn-sm">Guardar</button>
          <button type="button" onClick={togglePush} disabled={push === 'unsupported' || push === 'denied'} className="btn-ghost btn-sm">
            {push === 'on' ? <><BellOff size={16} /> Desactivar notificaciones</> : <><Bell size={16} /> Activar notificaciones</>}
          </button>
          <button type="button" onClick={signOut} className="btn-ghost btn-sm ml-auto"><LogOut size={16} /> Salir</button>
        </div>
        {push === 'unsupported' && <p className="text-xs text-neutral-500">En iPhone las notificaciones requieren instalar la app en la pantalla de inicio (iOS 16.4+).</p>}
        {push === 'denied' && <p className="text-xs text-amber-300">Bloqueaste las notificaciones; habilítalas en los ajustes del navegador.</p>}
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      </form>

      <Section title="Próximas citas" empty="No tienes citas próximas.">
        {upcoming.map((a) => <Appt key={a.id} a={a} onCancel={() => cancel(a.id)} />)}
      </Section>
      <Section title="Historial" empty="Aún no tienes citas pasadas.">
        {past.map((a) => <Appt key={a.id} a={a} />)}
      </Section>
    </div>
  );
}

const Section = ({ title, empty, children }) => (
  <section>
    <h2 className="font-heading mb-3 text-2xl">{title}</h2>
    <div className="space-y-3">{Array.isArray(children) && children.length === 0 ? <p className="text-sm text-neutral-500">{empty}</p> : children}</div>
  </section>
);

function Appt({ a, onCancel }) {
  const st = STATUS[a.status];
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-lg capitalize">{fmtDateTime(a.start_at)}</p>
          <p className="text-sm text-neutral-400">con {a.barbers?.name} · {a.appointment_services.map((s) => s.name).join(', ')}</p>
        </div>
        <span className={`chip ${st.cls}`}>{st.label}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-display text-xl text-brand">{crc(a.total_crc)}</span>
        {onCancel && new Date(a.start_at) > Date.now() + 3600_000 && <button onClick={onCancel} className="btn-ghost btn-sm">Cancelar</button>}
      </div>
    </div>
  );
}
