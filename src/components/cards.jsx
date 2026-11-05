import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { Avatar } from './ui';
import { crc } from '../lib/format';

export function ServiceCard({ s, index = 0 }) {
  return (
    <Link to={`/agendar?s=${s.id}`} className="card card-hover group flex items-center gap-4 !p-5">
      <span className="font-display text-4xl leading-none text-white/15 transition group-hover:text-brand">{String(index + 1).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl leading-tight tracking-wide">{s.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-400"><Clock size={12} /> {s.duration_min} min{s.description ? ` · ${s.description}` : ''}</p>
      </div>
      <div className="text-right">
        <p className="price text-lg text-white">{crc(s.price_crc)}</p>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-brand">Reservar <ArrowRight size={12} className="transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

export function BarberCard({ b }) {
  return (
    <Link to={`/barberos/${b.id}`} className="card card-hover group flex flex-col items-center !p-6 text-center">
      <Avatar barber={b} size={96} className="transition duration-500 group-hover:scale-105" />
      <p className="mt-4 font-display text-3xl leading-none tracking-wide">{b.name}</p>
      {b.nickname && <p className="mt-1 text-xs font-semibold uppercase tracking-[.2em] text-brand">“{b.nickname}”</p>}
      <p className="mt-2 text-sm text-neutral-400">{b.specialty}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-300 transition group-hover:text-brand">Ver perfil <ArrowRight size={13} className="transition group-hover:translate-x-1" /></span>
    </Link>
  );
}
