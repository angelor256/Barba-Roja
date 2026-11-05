import { useEffect, useState } from 'react';
import { Send, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TEMPLATES = [
  { title: '¡Hoy 2x1! 💈', body: 'Combo Barba + Pelo en promo. ¡Reserva tu espacio!' },
  { title: 'Hoy tenemos espacios', body: 'Aún hay horas libres esta tarde. Agenda en segundos.' },
  { title: 'Recordatorio', body: 'Recuerda tu cita de hoy en Barba Roja. ¡Te esperamos!' },
];

export default function PushPanel() {
  const [f, setF] = useState({ title: '', body: '', url: '#/agendar' });
  const [count, setCount] = useState(null);
  const [state, setState] = useState({ busy: false, msg: '', err: false });

  useEffect(() => {
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).then(({ count: c }) => setCount(c));
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!confirm(`¿Enviar a ${count ?? 'todos los'} dispositivos?`)) return;
    setState({ busy: true, msg: '', err: false });
    const { data, error } = await supabase.functions.invoke('send-push', { body: f });
    if (error || data?.error) setState({ busy: false, msg: data?.error || error.message, err: true });
    else setState({ busy: false, msg: `Enviada a ${data.sent} de ${data.total} dispositivos${data.removed ? ` (${data.removed} caducados eliminados)` : ''}.`, err: false });
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="flex items-center gap-2 text-neutral-300"><Smartphone className="text-brand" /> {count ?? '…'} dispositivos con notificaciones activas</p>
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => <button key={t.title} onClick={() => setF({ ...f, ...t })} className="btn-ghost btn-sm normal-case">{t.title}</button>)}
      </div>
      <form onSubmit={send} className="card space-y-3">
        <div><label className="label">Título</label><input className="input" required maxLength={60} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><label className="label">Mensaje</label><textarea className="input" required rows={3} maxLength={160} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
        <div><label className="label">Al tocar, abrir</label><input className="input" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
        <button className="btn-primary w-full" disabled={state.busy}><Send size={18} /> {state.busy ? 'Enviando…' : 'Enviar a todos'}</button>
        {state.msg && <p className={`text-sm ${state.err ? 'text-red-400' : 'text-emerald-400'}`}>{state.msg}</p>}
      </form>
    </div>
  );
}
