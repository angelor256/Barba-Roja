import { Link } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { PageHero, Reveal } from '../components/ui';
import { ServiceCard } from '../components/cards';
import { useApp } from '../context/AppContext';

export default function Services() {
  const { services } = useApp().catalog;
  return (
    <>
      <PageHero eyebrow="Precios" title="Servicios" sub="Precios claros, sin sorpresas. Elige uno o combina varios al reservar." />
      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="space-y-3">
          {services.map((s, i) => <Reveal key={s.id} delay={(i % 4) * 60}><ServiceCard s={s} index={i} /></Reveal>)}
        </div>
        <Reveal className="mt-10 text-center"><Link to="/agendar" className="btn-primary px-8 py-4"><CalendarPlus size={18} /> Agendar mi cita</Link></Reveal>
      </section>
    </>
  );
}
