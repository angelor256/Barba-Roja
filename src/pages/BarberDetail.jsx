import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Clock, Scissors } from 'lucide-react';
import { Avatar, Reveal } from '../components/ui';
import { useApp } from '../context/AppContext';
import { WEEKDAYS } from '../lib/config';
import { crc } from '../lib/format';
import NotFound from './NotFound';

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function BarberDetail() {
  const { id } = useParams();
  const { barbers, schedules, services, loading } = useApp().catalog;
  const b = barbers.find((x) => x.id === id);
  if (!b) return loading ? null : <NotFound />;
  const mine = schedules.filter((s) => s.barber_id === b.id);

  return (
    <section className="mx-auto max-w-4xl px-5 py-10">
      <Link to="/barberos" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"><ArrowLeft size={16} /> Todos los barberos</Link>
      <div className="card relative overflow-hidden !p-8 sm:!p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/25 blur-[80px]" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <Avatar barber={b} size={140} />
          <div className="flex-1">
            {b.nickname && <p className="eyebrow !mb-1">“{b.nickname}”</p>}
            <h1 className="font-display text-6xl uppercase leading-none tracking-wide">{b.name}</h1>
            <p className="mt-2 flex items-center justify-center gap-2 text-neutral-300 sm:justify-start"><Scissors size={16} className="text-brand" /> {b.specialty}</p>
            {b.years && <p className="mt-1 text-sm text-neutral-500">{b.years} años de experiencia</p>}
          </div>
        </div>
        {b.bio && <p className="relative mt-8 max-w-2xl text-lg text-neutral-300">{b.bio}</p>}
        <Link to={`/agendar?b=${b.id}`} className="btn-primary relative mt-8 px-8 py-4"><CalendarPlus size={18} /> Agendar con {b.name.split(' ')[0]}</Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Reveal className="card !p-6">
          <p className="eyebrow flex items-center gap-2"><Clock size={14} /> Horario</p>
          <ul className="space-y-2 text-sm">
            {ORDER.map((d) => {
              const s = mine.find((x) => x.weekday === d);
              return <li key={d} className="flex justify-between border-b border-white/5 pb-2 last:border-0"><span className="text-neutral-300">{WEEKDAYS[d]}</span><span className={s ? 'text-white' : 'text-neutral-600'}>{s ? `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}` : 'Libre'}</span></li>;
            })}
          </ul>
        </Reveal>
        <Reveal delay={100} className="card !p-6">
          <p className="eyebrow">Servicios</p>
          <ul className="space-y-2 text-sm">
            {services.map((s) => <li key={s.id} className="flex justify-between border-b border-white/5 pb-2 last:border-0"><span className="text-neutral-300">{s.name}</span><span className="price">{crc(s.price_crc)}</span></li>)}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
