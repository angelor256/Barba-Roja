import { useState } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import InstallBanner from './components/InstallBanner';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { useCatalog } from './lib/useCatalog';

export default function App() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const [auth, setAuth] = useState(false);
  const booking = params.get('agendar') === '1';

  const openBooking = () => { setParams({ agendar: '1' }); };
  const closeBooking = () => { setParams({}); catalog.reload(); };

  return (
    <>
      <Header onLogin={() => setAuth(true)} />
      <main>
        <Routes>
          <Route path="/" element={<Home catalog={catalog} onBook={() => nav('/?agendar=1')} />} />
          <Route path="/perfil" element={<Profile onLogin={() => setAuth(true)} />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Home catalog={catalog} onBook={openBooking} />} />
        </Routes>
      </main>
      {booking && <BookingModal catalog={catalog} onClose={closeBooking} onNeedAuth={() => setAuth(true)} />}
      {auth && <AuthModal onClose={() => setAuth(false)} />}
      <InstallBanner />
    </>
  );
}
