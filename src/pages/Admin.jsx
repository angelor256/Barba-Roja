import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarDays, Clock, Scissors, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Agenda from './admin/Agenda';
import Barbers from './admin/Barbers';
import Schedules from './admin/Schedules';
import Services from './admin/Services';
import PushPanel from './admin/PushPanel';

const TABS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays, C: Agenda },
  { id: 'barberos', label: 'Barberos', icon: Scissors, C: Barbers },
  { id: 'horarios', label: 'Horarios', icon: Clock, C: Schedules },
  { id: 'servicios', label: 'Servicios', icon: Tag, C: Services },
  { id: 'push', label: 'Notificaciones', icon: Bell, C: PushPanel },
];

export default function Admin() {
  const { ready, isAdmin } = useAuth();
  const [tab, setTab] = useState('agenda');
  if (!ready) return null;
  if (!isAdmin) return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="mb-4 text-neutral-300">Esta sección es solo para administradores.</p>
      <Link to="/" className="btn-ghost">Volver al inicio</Link>
    </div>
  );
  const Active = TABS.find((t) => t.id === tab).C;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <p className="eyebrow">Administración</p>
      <h1 className="mb-5 font-display text-6xl uppercase leading-none">Panel</h1>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(({ id, label, icon: I }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`btn btn-sm shrink-0 ${tab === id ? 'bg-brand text-white shadow-glow' : 'border border-white/10 bg-white/5 text-neutral-300'}`}>
            <I size={16} /> {label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}
