import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <section className="mx-auto max-w-md px-5 py-24 text-center">
      <p className="font-display text-9xl leading-none text-brand">404</p>
      <p className="mt-2 font-display text-3xl uppercase tracking-wide">Esta página no existe</p>
      <Link to="/" className="btn-primary mt-8">Volver al inicio</Link>
    </section>
  );
}
