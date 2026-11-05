import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, CalendarPlus, MapPin, Scissors, Sparkles, UserCheck } from 'lucide-react';
import { Reveal, SectionHeading } from '../components/ui';
import { BarberCard, ServiceCard } from '../components/cards';
import { useApp } from '../context/AppContext';
import { crc } from '../lib/format';

const STEPS = [
  { icon: Scissors, t: 'Elige tu servicio', d: 'Barba, pelo, combo o lo que necesites, con precio claro.' },
  { icon: UserCheck, t: 'Escoge barbero', d: 'Tu favorito o cualquiera disponible.' },
  { icon: CalendarCheck, t: 'Reserva tu hora', d: 'Ve los espacios libres en tiempo real y confirma.' },
];

export default function Home() {
  const { catalog } = useApp();
  const { services, barbers } = catalog;
  const from = services.length ? Math.min(...services.map((s) => s.price_crc)) : 0;
  const words = ['Barba', 'Pelo', 'Combo', 'Mascarilla facial', 'Depilación', 'Rohrmoser', 'Barba Roja'];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 animate-blob rounded-full bg-brand/30 blur-[110px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 animate-blob rounded-full bg-rose-700/25 blur-[110px]" style={{ animationDelay: '-6s' }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_.9fr] md:pt-20">
          <div>
            <p className="eyebrow animate-fade-up">Barbería · Rohrmoser, San José</p>
            <h1 className="animate-fade-up font-display text-[5.2rem] uppercase leading-[.86] tracking-wide sm:text-[8rem]" style={{ animationDelay: '.1s' }}>
              Tu estilo.<br /><span className="bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">Tu barba.</span><br />Tu cita.
            </h1>
            <p className="mt-6 max-w-md animate-fade-up text-lg text-neutral-300" style={{ animationDelay: '.2s' }}>
              El mejor servicio al mejor precio. Reserva en menos de un minuto y llega directo a tu silla.
            </p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3" style={{ animationDelay: '.3s' }}>
              <Link to="/agendar" className="btn-primary px-8 py-4 text-base"><CalendarPlus size={20} /> Agendar cita</Link>
              <Link to="/servicios" className="btn-ghost px-8 py-4 text-base">Ver precios <ArrowRight size={18} /></Link>
            </div>
            <dl className="mt-10 grid max-w-md animate-fade-up grid-cols-3 gap-4 border-t border-white/10 pt-6" style={{ animationDelay: '.4s' }}>
              {[[String(barbers.length || '—'), 'Barberos'], [crc(from), 'Desde'], ['Lun–Sáb', 'Abierto']].map(([n, l]) => (
                <div key={l}><dt className="price text-xl">{n}</dt><dd className="text-xs uppercase tracking-wider text-neutral-500">{l}</dd></div>
              ))}
            </dl>
          </div>
          <div className="relative mx-auto hidden aspect-square w-full max-w-sm md:block">
            <div className="absolute inset-0 rounded-full bg-brand/40 blur-[80px]" />
            <img src={`${import.meta.env.BASE_URL}icons/icon-512.png`} alt="Barba Roja" className="relative animate-float rounded-full shadow-glow-lg ring-1 ring-white/15" />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-white/5 bg-brand py-3" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-2xl uppercase tracking-[.2em]">
          {[...words, ...words, ...words, ...words].map((w, i) => <span key={i} className="flex items-center gap-8">{w}<Sparkles size={16} /></span>)}
        </div>
      </div>

      {/* SERVICIOS */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Lo que hacemos" title="Servicios" />
          <Reveal><Link to="/servicios" className="btn-ghost btn-sm">Ver todos <ArrowRight size={14} /></Link></Reveal>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {services.slice(0, 4).map((s, i) => <Reveal key={s.id} delay={i * 80}><ServiceCard s={s} index={i} /></Reveal>)}
        </div>
      </section>

      {/* BARBEROS */}
      {barbers.length > 0 && (
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="El equipo" title="Nuestros barberos" />
              <Reveal><Link to="/barberos" className="btn-ghost btn-sm">Conócelos <ArrowRight size={14} /></Link></Reveal>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {barbers.slice(0, 4).map((b, i) => <Reveal key={b.id} delay={i * 80}><BarberCard b={b} /></Reveal>)}
            </div>
          </div>
        </section>
      )}

      {/* CÓMO FUNCIONA */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <SectionHeading eyebrow="Así de fácil" title="Reserva en 3 pasos" className="mb-10" />
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: I, t, d }, i) => (
            <Reveal key={t} delay={i * 100} className="card relative overflow-hidden !p-6">
              <span className="absolute -right-2 -top-4 font-display text-9xl text-white/[0.04]">{i + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand"><I /></span>
              <p className="mt-4 font-display text-3xl tracking-wide">{t}</p>
              <p className="mt-1 text-sm text-neutral-400">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Reveal className="mx-auto max-w-6xl px-5 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-light via-brand to-brand-dark p-8 shadow-glow-lg sm:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
          <h2 className="relative font-display text-5xl uppercase leading-none tracking-wide sm:text-7xl">¿Listo para el corte?</h2>
          <p className="relative mt-3 max-w-md text-white/85">Escoge tu barbero y tu hora. Te esperamos en Rohrmoser, a un costado del Parque Llama del Bosque.</p>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Link to="/agendar" className="btn bg-white px-8 py-4 text-base text-brand hover:-translate-y-0.5"><CalendarPlus size={20} /> Agendar ahora</Link>
            <Link to="/contacto" className="btn border border-white/40 px-8 py-4 text-base text-white hover:bg-white/10"><MapPin size={18} /> Cómo llegar</Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}
