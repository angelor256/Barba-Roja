import { createContext, useContext, useState } from 'react';
import AuthModal from '../components/AuthModal';
import { useCatalog } from '../lib/useCatalog';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

/** Catálogo compartido (servicios, barberos, horarios) + modal de login accesible desde cualquier página. */
export function AppProvider({ children }) {
  const catalog = useCatalog();
  const [authOpen, setAuthOpen] = useState(false);
  return (
    <Ctx.Provider value={{ catalog, openAuth: () => setAuthOpen(true) }}>
      {children}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </Ctx.Provider>
  );
}
