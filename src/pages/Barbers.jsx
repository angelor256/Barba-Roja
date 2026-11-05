import { PageHero, Reveal } from '../components/ui';
import { BarberCard } from '../components/cards';
import { useApp } from '../context/AppContext';

export default function Barbers() {
  const { barbers, loading } = useApp().catalog;
  return (
    <>
      <PageHero eyebrow="El equipo" title="Barberos" sub="Profesionales con estilo propio. Elige con quién quieres sentarte." />
      <section className="mx-auto max-w-6xl px-5 py-12">
        {!loading && barbers.length === 0 && <p className="text-neutral-400">Pronto presentaremos a nuestro equipo.</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {barbers.map((b, i) => <Reveal key={b.id} delay={i * 70}><BarberCard b={b} /></Reveal>)}
        </div>
      </section>
    </>
  );
}
