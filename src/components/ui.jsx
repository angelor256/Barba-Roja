import { useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { isConfigured } from '../lib/supabase';

/** Aparece suavemente al entrar en pantalla. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} style={{ '--d': `${delay}ms` }} className={`reveal ${className}`} {...rest}>{children}</Tag>;
}

export function SectionHeading({ eyebrow, title, sub, className = '' }) {
  return (
    <Reveal className={className}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {sub && <p className="mt-3 max-w-xl text-neutral-400">{sub}</p>}
    </Reveal>
  );
}

/** Encabezado de página interior. */
export function PageHero({ eyebrow, title, sub }) {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-[90px]" />
      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-12">
        <p className="eyebrow animate-fade-up">{eyebrow}</p>
        <h1 className="animate-fade-up font-display text-6xl uppercase leading-none tracking-wide sm:text-7xl" style={{ animationDelay: '.08s' }}>{title}</h1>
        {sub && <p className="mt-4 max-w-xl animate-fade-up text-neutral-400" style={{ animationDelay: '.16s' }}>{sub}</p>}
      </div>
    </section>
  );
}

const GRADS = ['from-brand to-rose-900', 'from-rose-500 to-brand-dark', 'from-orange-600 to-brand', 'from-brand-dark to-neutral-800'];
const initials = (n = '') => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

/** Foto del barbero o monograma con degradado si aún no hay foto. */
export function Avatar({ barber, size = 64, className = '' }) {
  if (barber.photo_url) return <img src={barber.photo_url} alt={barber.name} style={{ width: size, height: size }} className={`rounded-full object-cover ${className}`} />;
  const g = GRADS[(barber.sort_order ?? 0) % GRADS.length];
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.4 }} aria-label={barber.name}
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${g} font-display tracking-wider text-white shadow-glow ring-2 ring-white/10 ${className}`}>
      {initials(barber.name)}
    </span>
  );
}

export function DemoNotice({ className = '' }) {
  if (isConfigured) return null;
  return (
    <p className={`flex items-start gap-2 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-neutral-300 ${className}`}>
      <Info size={14} className="mt-0.5 shrink-0 text-brand" />
      <span><b className="text-white">Modo demostración:</b> barberos y horarios son ficticios y las citas se guardan solo en este dispositivo.</span>
    </p>
  );
}

export function Instagram({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" />
    </svg>
  );
}
