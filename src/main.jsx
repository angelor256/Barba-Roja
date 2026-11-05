import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// PWA: service worker (solo en producción para no cachear durante el desarrollo)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(console.error));
}

// Pantalla de carga: se oculta cuando React montó, cargó la página y las fuentes (mínimo 1.4 s para que se disfrute)
(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const MIN_MS = 1400, MAX_MS = 5000, t0 = performance.now();
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true }));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, MAX_MS));   // por si las fuentes/red tardan demasiado
  Promise.race([Promise.all([loaded, fonts]), timeout]).then(() => {
    setTimeout(() => {
      splash.classList.add('splash-hide');
      setTimeout(() => splash.remove(), 700);
    }, Math.max(0, MIN_MS - (performance.now() - t0)));
  });
})();
