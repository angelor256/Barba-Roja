import { useEffect, useState } from 'react';
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
  const [env] = useState(detect);
  const [deferred, setDeferred] = useState(null);
  const [hidden, setHidden] = useState(() => {
    const t = Number(read());
    return isStandalone() || (t && Date.now() - t < 7 * 86400_000); // reaparece tras 7 días
  });
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (hidden) return null;
  // Mostrar solo si hay algo útil que decir
  if (!deferred && !env.iOS && !env.android) return null;

  const dismiss = () => { write(); setHidden(true); };
  const install = async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice; setDeferred(null); }
    else setShowSteps((s) => !s);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg rounded-2xl border border-brand bg-ink-800 p-4 shadow-2xl shadow-black">
        <div className="flex items-start gap-3">
          <Logo size={44} />
          <div className="flex-1">
            <p className="font-heading text-lg leading-tight">Lleva Barba Roja en tu celular</p>
            <p className="text-sm text-neutral-400">Reserva más rápido y recibe recordatorios de tu cita.</p>
          </div>
          <button onClick={dismiss} aria-label="Cerrar" className="text-neutral-500 hover:text-white"><X size={20} /></button>
        </div>

        {showSteps && env.iOS && (
          <ol className="mt-3 space-y-2 rounded-lg bg-ink-900 p-3 text-sm text-neutral-300">
            {!env.iosSafari && <li className="font-semibold text-brand-light">Abre esta página en Safari para poder instalarla.</li>}
            <li className="flex items-center gap-2">1. Toca <Share size={16} className="text-sky-400" /> <b>Compartir</b> en la barra de Safari.</li>
            <li className="flex items-center gap-2">2. Elige <PlusSquare size={16} /> <b>“Añadir a pantalla de inicio”</b>.</li>
            <li>3. Toca <b>Añadir</b>. Abre la app desde el nuevo ícono para activar las notificaciones.</li>
          </ol>
        )}
        {showSteps && !env.iOS && (
          <ol className="mt-3 space-y-2 rounded-lg bg-ink-900 p-3 text-sm text-neutral-300">
            <li>1. Abre el menú <b>⋮</b> de Chrome (arriba a la derecha).</li>
            <li>2. Toca <b>“Instalar app”</b> o <b>“Añadir a la pantalla de inicio”</b>.</li>
            <li>3. Confirma con <b>Instalar</b>.</li>
          </ol>
        )}

        <button onClick={install} className="btn-primary mt-3 w-full">
          <Download size={18} /> {deferred ? 'Instalar app' : env.iOS ? 'Añadir a pantalla de inicio' : 'Cómo instalar'}
        </button>
      </div>
    </div>
  );
}
