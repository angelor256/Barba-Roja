import { CalendarDays, MapPin } from 'lucide-react';
import Logo from '../components/Logo';
import ServicesList from '../components/ServicesList';
import LocationSection from '../components/LocationSection';

export default function Home({ catalog, onBook }) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink-700">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#E51E2533,transparent_60%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center">
          <Logo size={140} className="shadow-stamp" />
          <h1 className="title-stamp mt-8 text-5xl sm:text-7xl">Barba Roja</h1>
          <p className="mt-3 max-w-md text-lg text-neutral-300">El mejor servicio al mejor precio. Barbería en Rohrmoser, San José.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={onBook} className="btn-primary text-lg"><CalendarDays /> Agendar cita</button>
            <a href="#ubicacion" className="btn-ghost text-lg"><MapPin /> Cómo llegar</a>
          </div>
        </div>
      </section>
      <ServicesList services={catalog.services} />
      <LocationSection />
      <footer className="border-t border-ink-700 py-8 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} Barba Roja · Rohrmoser, San José, Costa Rica
      </footer>
    </>
  );
}
