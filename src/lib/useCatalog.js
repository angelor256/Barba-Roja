import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { FALLBACK_SERVICES } from './config';

/** Servicios, barberos activos, horarios y ausencias (lectura pública). */
export function useCatalog() {
  const [data, setData] = useState({ services: FALLBACK_SERVICES, barbers: [], schedules: [], timeOff: [], loading: !!supabase });

  const load = useCallback(async () => {
    if (!supabase) return;
    const [s, b, sc, t] = await Promise.all([
      supabase.from('services').select('*').eq('active', true).order('sort_order'),
      supabase.from('barbers').select('*').eq('active', true).order('sort_order'),
      supabase.from('barber_schedules').select('*'),
      supabase.from('time_off').select('*').gte('end_date', new Date(Date.now() - 86400000).toISOString().slice(0, 10)),
    ]);
    setData({
      services: s.data?.length ? s.data : FALLBACK_SERVICES,
      barbers: b.data ?? [], schedules: sc.data ?? [], timeOff: t.data ?? [], loading: false,
    });
  }, []);

  useEffect(() => { load(); }, [load]);
  return { ...data, reload: load };
}
