import { Clock } from 'lucide-react';
import { crc } from '../lib/format';

export default function ServicesList({ services }) {
  return (
    <section id="servicios" className="mx-auto max-w-5xl px-4 py-12">
      <h2 className="title-stamp mb-6 text-4xl">Precios</h2>
      <ul className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800">
        {services.map((s) => (
          <li key={s.id} className="flex items-center gap-3 border-b border-ink-700 px-4 py-4 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="font-heading text-xl leading-tight">{s.name}</p>
              <p className="flex items-center gap-1 text-xs text-neutral-400">
                <Clock size={12} /> {s.duration_min} min{s.description ? ` · ${s.description}` : ''}
              </p>
            </div>
            <span className="font-display text-2xl text-brand">{crc(s.price_crc)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
