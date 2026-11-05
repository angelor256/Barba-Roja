import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, LogIn, ShieldCheck, User } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function Header({ onLogin }) {
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink/90 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={40} />
          <span className="title-stamp text-2xl leading-none">Barba Roja</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAdmin && <Link to="/admin" className="btn-ghost btn-sm"><ShieldCheck size={16} /><span className="hidden sm:inline">Admin</span></Link>}
          {user ? (
            <Link to="/perfil" className="btn-ghost btn-sm"><User size={16} /><span className="hidden sm:inline">Mi perfil</span></Link>
          ) : (
            <button onClick={onLogin} className="btn-ghost btn-sm"><LogIn size={16} /> Entrar</button>
          )}
          <button onClick={() => nav('/?agendar=1')} className="btn-primary btn-sm"><CalendarDays size={16} /> Agendar</button>
        </nav>
      </div>
    </header>
  );
}
