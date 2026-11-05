import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CalendarPlus, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { crc, fmtDateTime, STATUS } from '../lib/format';
import { disablePush, enablePush, getPushState } from '../lib/push';
import { demoAppointments, demoCancel, demoProfile, saveDemoProfile } from '../lib/demo';
import { DemoNotice } from '../components/ui';

export default function Profile() {
  const { ready, user, profile, signOut, refreshProfile } = useAuth();
  const { openAuth } = useApp();
  const demo = !supabase;
  const [appts, setAppts] = useState([]);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [push, setPush] = useState('off');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (demo) return setAppts(demoAppointments());
    if (!user) return;
    const { data } = await supabase.from('appointments').select('*, barbers(name), appointment_services(name, price_crc)').eq('client_id', user.id).order('start_at', { ascending: false });
    setAppts(data ?? []);
  }, [user, demo]);

  useEffect(() => { load(); if (!demo) getPushState().then(setPush); }, [load, demo]);
  useEffect(() => {
    if (demo) setForm(demoProfile());
    else if (profile) setForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' });
  }, [profile, demo]);

  if (!demo && !ready) return null;
  if (!demo && !user) return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="font-display text-6xl uppercase leading-none">Mis citas</h1>
      <p className="mb-6 mt-3 text-neutral-400">Inicia sesión para ver tu perfil y tus citas.</p>
      <button onClick={openAuth} className="btn-primary">Iniciar sesión</button>
    </div>
  );

  const save = async (e) => {
    e.preventDefault();
    if (demo) { saveDemoProfile(form); return setMsg('Perfil guardado'); }
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    setMsg(error ? error.message : 'Perfil actualizado'); refreshProfile();
  };
  const cancel = async (id) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    if (demo) { demoCancel(id); return load(); }
    const { error } = await supabase.rpc('cancel_my_appointment', { p_id: id });
    if (error) alert(error.message); else load();
  };
  const togglePush = async () => {
    try { if (push === 'on') await disablePush(); else await enablePush(user.id); setPush(await getPushState()); } catch (e) { alert(e.message); }
  };

  const now = Date.now();
  const upcoming = appts.filter((a) => new Date(a.end_at) > now && ['pending', 'confirmed'].includes(a.status)).reverse();
  const past = appts.filter((a) => !upcoming.includes(a));

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-5 py-10">
      <div>
        <p className="eyebrow">Tu cuenta</p>
        <h1 className="font-display text-6xl uppercase leading-none sm:text-7xl">Mis citas</h1>
      </div>
      <DemoNotice />

      <Section title="Próximas citas" empty={<div className="card text-center !py-8"><p className="text-neutral-400">No tienes citas próximas.</p><Link to="/agendar" className="btn-primary mt-4"><CalendarPlus size={16} /> Agendar ahora</Link></div>}>
        {upcoming.map((a) => <Appt key={a.id} a={a} onCancel={() => cancel(a.id)} />)}
      </Section>
      <Section title="Historial" empty={<p className="text-sm text-neutral-500">Aún no tienes citas pasadas o canceladas.</p>}>
        {past.map((a) => <Appt key={a.id} a={a} />)}
      </Section>

      <form onSubmit={save} className="card space-y-3 !p-5">
        <h2 className="font-display text-3xl uppercase tracking-wide">Mis datos</h2>
        <div><label className="label">Nombre</label><input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><label className="label">Teléfono</label><input className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        {user && <p className="text-xs text-neutral-500">{user.email}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary btn-sm">Guardar</button>
          {!demo && <>
            <button type="button" onClick={togglePush} disabled={push === 'unsupported' || push === 'denied'} className="btn-ghost btn-sm">
              {push === 'on' ? <><BellOff size={15} /> Desactivar avisos</> : <><Bell size={15} /> Activar avisos</>}
            </button>
            <button type="button" onClick={signOut} className="btn-ghost btn-sm ml-auto"><LogOut size={15} /> Salir</button>
          </>}
        </div>
        {push === 'unsupported' && <p className="text-xs text-neutral-500">En iPhone las notificaciones requieren instalar la app en la pantalla de inicio (iOS 16.4+).</p>}
        {push === 'denied' && <p className="text-xs text-amber-300">Bloqueaste las notificaciones; habilítalas en los ajustes del navegador.</p>}
        {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      </form>
    </div>
  );
}

const Section = ({ title, empty, children }) => (
  <section>
    <h2 className="mb-3 font-display text-3xl uppercase tracking-wide">{title}</h2>
    <div className="space-y-3">{Array.isArray(children) && children.length === 0 ? empty : children}</div>
  </section>
);

function Appt({ a, onCancel }) {
  const st = STATUS[a.status];
  return (
    <div className="card page-enter !p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl capitalize leading-tight tracking-wide">{fmtDateTime(a.start_at)}</p>
          <p className="text-sm text-neutral-400">con {a.barbers?.name} · {a.appointment_services.map((s) => s.name).join(', ')}</p>
        </div>
        <span className={`chip ${st.cls}`}>{st.label}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="price text-lg text-brand">{crc(a.total_crc)}</span>
        {onCancel && new Date(a.start_at) > Date.now() + 3600_000 && <button onClick={onCancel} className="btn-ghost btn-sm">Cancelar</button>}
      </div>
    </div>
  );
}
