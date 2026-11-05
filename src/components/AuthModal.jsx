import { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { isConfigured } from '../lib/supabase';

export default function AuthModal({ onClose, onDone }) {
  const { signIn, signUp, signInGoogle } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setInfo(''); setBusy(true);
    const { data, error } = mode === 'login' ? await signIn(f.email, f.password) : await signUp(f.email, f.password, f.name);
    setBusy(false);
    if (error) return setErr(error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos' : error.message);
    if (mode === 'signup' && !data.session) return setInfo('Revisa tu correo para confirmar la cuenta y luego inicia sesión.');
    onDone?.(); onClose();
  };

  return (
    <Modal title={mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'} onClose={onClose}>
      {!isConfigured && <p className="mb-3 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">Modo demo: configura Supabase (.env) para habilitar cuentas.</p>}
      <button type="button" onClick={signInGoogle} disabled={!isConfigured} className="btn-ghost w-full">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.500 42.600 14.600 48 24 48z"/></svg>
        Continuar con Google
      </button>
      <div className="my-4 flex items-center gap-3 text-xs uppercase text-neutral-500"><span className="h-px flex-1 bg-ink-700" /> o <span className="h-px flex-1 bg-ink-700" /></div>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (<div><label className="label">Nombre</label><input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></div>)}
        <div><label className="label">Correo</label><input className="input" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></div>
        <div><label className="label">Contraseña</label><input className="input" type="password" required minLength={6} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}
        <button className="btn-primary w-full" disabled={busy || !isConfigured}>{busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      </form>
      <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }} className="mt-4 w-full text-center text-sm text-neutral-400 hover:text-white">
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </Modal>
  );
}
