import { MapPin, MessageCircle, Navigation } from 'lucide-react';
import { Instagram, PageHero, Reveal } from '../components/ui';
import { BUSINESS, HOURS, MAPS_EMBED, MAPS_URL, WAZE_URL } from '../lib/config';

export default function Contact() {
  const wa = BUSINESS.whatsapp ? `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent('Hola Barba Roja, quisiera agendar una cita 💈')}` : null;
  return (
    <>
      <PageHero eyebrow="Visítanos" title="Contacto" sub="Estamos en Rohrmoser. Llega en carro, a pie o con un clic en Waze." />
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 md:grid-cols-2">
        <Reveal className="card flex flex-col gap-5 !p-6">
          <p className="flex gap-3 text-lg text-neutral-200"><MapPin className="mt-1 shrink-0 text-brand" /> {BUSINESS.address}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href={WAZE_URL} target="_blank" rel="noreferrer" className="btn-primary"><Navigation size={18} /> Abrir en Waze</a>
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="btn-ghost"><MapPin size={18} /> Google Maps</a>
          </div>
          {wa
            ? <a href={wa} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-black hover:-translate-y-0.5"><MessageCircle size={18} /> Agendar por WhatsApp</a>
            : <p className="rounded-xl bg-white/5 p-3 text-xs text-neutral-500">El botón de WhatsApp aparecerá al configurar el número de la barbería.</p>}
          <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" className="btn-ghost"><Instagram size={18} /> @barberiabarbaroja</a>
          <div className="border-t border-white/10 pt-4">
            <p className="eyebrow">Horario</p>
            <ul className="space-y-2 text-sm">{HOURS.map((h) => <li key={h.d} className="flex justify-between"><span className="text-neutral-300">{h.d}</span><span className="font-semibold">{h.h}</span></li>)}</ul>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <iframe title="Mapa Barba Roja" src={MAPS_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="h-80 w-full rounded-2xl border border-white/10 grayscale transition duration-500 hover:grayscale-0 md:h-full md:min-h-[26rem]" />
        </Reveal>
      </section>
    </>
  );
}
