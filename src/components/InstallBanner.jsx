import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, PlusSquare, Share, X } from 'lucide-react';
import Logo from './Logo';

const DISMISS_KEY = 'br_install_dismissed';
const read = () => { try { return localStorage.getItem(DISMISS_KEY); } catch { return null; } };
const write = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* modo privado */ } };

function detect() {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  // En iOS solo Safari puede instalar PWAs (Chrome/Firefox/Edge iOS llevan CriOS/FxiOS/EdgiOS)
  const iosSafari = iOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return { iOS, android, iosSafari };
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export default function InstallBanner() {
  const { pathname } = useLocation();
  const [env] = useState(detect);
  const [deferred, setDeferred] = useState(null);
  const [hidden, setHidden] = useState(() => {
    const t = Number(read());
    return isStandalone() || (t && Date.now() - t < 7 * 86400_000); // reaparece tras 7 días
  });
  const [showSteps, setShowSteps] = useState(false);
  const [late, setLate] = useState(false);            // aparece a los 6 s para no tapar el primer vistazo
  useEffect(() => { const t = setTimeout(() => setLate(true), 6000); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (hidden || !late || pathname === '/agendar' || pathname.startsWith('/admin')) return null;   // no estorba la reserva
  // Mostrar solo si hay algo útil que decir
  if (!deferred && !env.iOS && !env.android) return null;

  const dismiss = () => { write(); setHidden(true); };
  const install = async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice; setDeferred(null); }
    else setShowSteps((s) => !s);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-50 px-3 md:bottom-4">
      <div className="mx-auto max-w-md rounded-2xl border border-brand/40 bg-ink-900/95 p-3 shadow-glow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">Instala Barba Roja</p>
            <p className="truncate text-xs text-neutral-400">Reserva más rápido y recibe avisos</p>
          </div>
          <button onClick={install} className="btn-primary btn-sm shrink-0"><Download size={14} /> {deferred ? 'Instalar' : 'Cómo'}</button>
          <button onClick={dismiss} aria-label="Cerrar" className="shrink-0 text-neutral-500 hover:text-white"><X size={18} /></button>
        </div>

        {showSteps && env.iOS && (
          <ol className="mt-3 space-y-2 rounded-xl bg-white/5 p-3 text-sm text-neutral-300">
            {!env.iosSafari && <li className="font-semibold text-brand-light">Abre esta página en Safari para poder instalarla.</li>}
            <li className="flex items-center gap-2">1. Toca <Share size={16} className="text-sky-400" /> <b>Compartir</b> en la barra de Safari.</li>
            <li className="flex items-center gap-2">2. Elige <PlusSquare size={16} /> <b>“Añadir a pantalla de inicio”</b>.</li>
            <li>3. Toca <b>Añadir</b>. Abre la app desde el nuevo ícono para activar las notificaciones.</li>
          </ol>
        )}
        {showSteps && !env.iOS && (
          <ol className="mt-3 space-y-2 rounded-xl bg-white/5 p-3 text-sm text-neutral-300">
            <li>1. Abre el menú <b>⋮</b> de Chrome (arriba a la derecha).</li>
            <li>2. Toca <b>“Instalar app”</b> o <b>“Añadir a la pantalla de inicio”</b>.</li>
            <li>3. Confirma con <b>Instalar</b>.</li>
          </ol>
        )}
      </div>
    </div>
  );
}
