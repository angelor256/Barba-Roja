import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronDown, Gem, Heart, Wallet } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { BUSINESS, HOURS } from '../lib/config';

const VALUES = [
  { icon: Gem, t: 'Precisión', d: 'Cada corte y cada barba con detalle, sin apuros.' },
  { icon: Wallet, t: 'Buen precio', d: 'El mejor servicio al mejor precio, siempre a la vista.' },
  { icon: Heart, t: 'Buen ambiente', d: 'Un lugar donde te sientes en casa mientras te arreglas.' },
];
const FAQ = [
  ['¿Necesito cita?', 'Reservar te garantiza tu espacio con el barbero que prefieres. Puedes agendar en línea en menos de un minuto.'],
  ['¿Puedo cancelar o cambiar mi cita?', 'Sí. Desde “Mis citas” puedes cancelar con más de 1 hora de anticipación para liberar el espacio.'],
  ['¿Cuánto dura cada servicio?', 'Barba Express toma menos de 15 minutos; un corte ronda 40 minutos y el combo Barba + Pelo cerca de una hora.'],
  ['¿Dónde están ubicados?', BUSINESS.address],
  ['¿Puedo agendar por WhatsApp?', 'Sí, en la página de contacto encontrarás el botón directo.'],
];

export default function About() {
  const [open, setOpen] = useState(0);
  return (
    <>
      <PageHero eyebrow="Nosotros" title="Barba Roja" sub="Una barbería de barrio en Rohrmoser con una idea simple: que salgas viéndote y sintiéndote mejor." />
      <section className="mx-auto max-w-4xl px-5 py-12">
        <Reveal className="text-lg leading-relaxed text-neutral-300">
          <p>En Barba Roja creemos que un buen corte no tiene por qué costar de más. Nuestro equipo combina técnica clásica y tendencias actuales para ofrecerte
            <b className="text-white"> el mejor servicio al mejor precio</b>, en un ambiente cómodo y con atención personalizada.</p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {VALUES.map(({ icon: I, t, d }, i) => (
            <Reveal key={t} delay={i * 90} className="card !p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand"><I /></span>
              <p className="mt-4 font-display text-3xl tracking-wide">{t}</p>
              <p className="mt-1 text-sm text-neutral-400">{d}</p>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-[1fr_.8fr]">
          <div>
            <h2 className="section-title mb-6">Preguntas frecuentes</h2>
            <div className="space-y-2">
              {FAQ.map(([q, a], i) => (
                <div key={q} className="card !p-0 overflow-hidden">
                  <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 p-4 text-left font-semibold" aria-expanded={open === i}>
                    {q}<ChevronDown size={18} className={`shrink-0 text-brand transition duration-300 ${open === i ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <p className="overflow-hidden px-4 text-sm text-neutral-400"><span className="block pb-4">{a}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Reveal className="card h-fit !p-6">
            <p className="eyebrow">Horario</p>
            <ul className="space-y-3 text-sm">{HOURS.map((h) => <li key={h.d} className="flex justify-between"><span className="text-neutral-300">{h.d}</span><span className="font-semibold">{h.h}</span></li>)}</ul>
            <Link to="/agendar" className="btn-primary mt-6 w-full"><CalendarPlus size={17} /> Agendar cita</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
