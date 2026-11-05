import { MapPin, MessageCircle, Navigation } from 'lucide-react';
import { BUSINESS, MAPS_EMBED, MAPS_URL, WAZE_URL } from '../lib/config';

export default function LocationSection() {
  const wa = BUSINESS.whatsapp
    ? `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent('Hola Barba Roja, quisiera agendar una cita 💈')}` : null;
  return (
    <section id="ubicacion" className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="title-stamp mb-6 text-4xl">Ubicación</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card flex flex-col gap-4">
          <p className="flex gap-3 text-neutral-200"><MapPin className="mt-1 shrink-0 text-brand" /> {BUSINESS.address}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href={WAZE_URL} target="_blank" rel="noreferrer" className="btn-ghost"><Navigation size={18} /> Waze</a>
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="btn-ghost"><MapPin size={18} /> Google Maps</a>
          </div>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-black"><MessageCircle size={18} /> Agendar por WhatsApp</a>}
        </div>
        <iframe title="Mapa Barba Roja" src={MAPS_EMBED} loading="lazy"
          className="h-64 w-full rounded-xl border border-ink-700 grayscale md:h-full" referrerPolicy="no-referrer-when-downgrade" />
      </div>
    </section>
  );
}
