import { Link, NavLink } from 'react-router-dom';
import { CalendarPlus, Home, MapPin, ShieldCheck, Scissors, User, UserCircle2, Users } from 'lucide-react';
import Logo from './Logo';
import { Instagram } from './ui';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { isConfigured } from '../lib/supabase';
import { BUSINESS, HOURS } from '../lib/config';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/servicios', label: 'Servicios' },
  { to: '/barberos', label: 'Barberos' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

export function Header() {
  const { user, isAdmin } = useAuth();
  const { openAuth } = useApp();
  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={38} />
          <span className="font-display text-2xl leading-none tracking-[.18em]">Barba Roja</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin && <Link to="/admin" className="btn-ghost btn-sm"><ShieldCheck size={15} /><span className="hidden sm:inline">Admin</span></Link>}
          {user || !isConfigured
            ? <Link to="/perfil" aria-label="Mi perfil" className="btn-ghost btn-sm"><User size={15} /><span className="hidden sm:inline">Mis citas</span></Link>
            : <button onClick={openAuth} className="btn-ghost btn-sm"><UserCircle2 size={15} /> Entrar</button>}
          <Link to="/agendar" className="btn-primary btn-sm hidden sm:inline-flex"><CalendarPlus size={15} /> Agendar</Link>
        </div>
      </div>
    </header>
  );
}

/** Barra inferior estilo app (solo móvil) */
export function TabBar() {
  const tabs = [
    { to: '/', icon: Home, label: 'Inicio', end: true },
    { to: '/servicios', icon: Scissors, label: 'Servicios' },
    { to: '/agendar', icon: CalendarPlus, label: 'Agendar', main: true },
    { to: '/barberos', icon: Users, label: 'Barberos' },
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];
  return (
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(.6rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="glass mx-auto flex max-w-md items-end justify-between rounded-3xl px-2 py-1.5 shadow-soft">
        {tabs.map(({ to, icon: I, label, end, main }) => (
          <NavLink key={to} to={to} end={end} className="flex-1">
            {({ isActive }) => main ? (
              <span className="-mt-6 flex flex-col items-center gap-1">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-brand-light to-brand shadow-glow-lg ring-4 ring-ink"><I size={24} /></span>
                <span className="text-[10px] font-semibold text-white">{label}</span>
              </span>
            ) : (
              <span className={`flex flex-col items-center gap-1 py-1.5 transition ${isActive ? 'text-white' : 'text-neutral-500'}`}>
                <I size={21} className={isActive ? 'text-brand' : ''} />
                <span className="text-[10px] font-semibold">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-white/5 bg-black/40 pb-28 pt-12 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3"><Logo size={44} /><span className="font-display text-3xl tracking-[.18em]">Barba Roja</span></div>
          <p className="mt-4 max-w-xs text-sm text-neutral-400">El mejor servicio al mejor precio. Barbería en Rohrmoser, San José.</p>
          <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="btn-ghost btn-sm mt-4"><Instagram size={15} /> @barberiabarbaroja</a>
        </div>
        <div>
          <p className="eyebrow">Explora</p>
          <ul className="space-y-2 text-sm text-neutral-300">
            {[...LINKS, { to: '/agendar', label: 'Agendar cita' }].map((l) => <li key={l.to}><Link to={l.to} className="transition hover:text-brand">{l.label}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Visítanos</p>
          <p className="flex gap-2 text-sm text-neutral-300"><MapPin size={16} className="mt-0.5 shrink-0 text-brand" />{BUSINESS.address}</p>
          <ul className="mt-3 space-y-1 text-sm text-neutral-400">{HOURS.map((h) => <li key={h.d} className="flex justify-between gap-4"><span>{h.d}</span><span>{h.h}</span></li>)}</ul>
        </div>
      </div>
      <div className="mt-10 space-y-2 border-t border-white/5 pt-6 text-center text-xs text-neutral-600">
        <p>© {new Date().getFullYear()} Barba Roja · Rohrmoser, San José, Costa Rica</p>
        <p>
          Creado por{' '}
          <a href="https://angelor256.github.io/buildbeetech/#inicio" target="_blank" rel="noopener noreferrer"
            className="font-semibold text-neutral-400 underline decoration-brand/50 underline-offset-4 transition hover:text-brand">Buildbee</a>
        </p>
      </div>
    </footer>
  );
}
