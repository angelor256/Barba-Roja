import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Footer, Header, TabBar } from './components/Layout';
import InstallBanner from './components/InstallBanner';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Services from './pages/Services';
import Barbers from './pages/Barbers';
import BarberDetail from './pages/BarberDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Book from './pages/Book';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <AppProvider>
      <ScrollToTop />
      <Header />
      <main key={pathname.startsWith('/admin') ? '/admin' : pathname} className="page-enter min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/barberos" element={<Barbers />} />
          <Route path="/barberos/:id" element={<BarberDetail />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/agendar" element={<Book />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <TabBar />
      <InstallBanner />
    </AppProvider>
  );
}
