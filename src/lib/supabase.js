import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// flowType 'pkce': el retorno de Google llega en ?code= (compatible con HashRouter).
// null si Supabase no está configurado -> la app corre en modo demostración (barberos y citas ficticios).
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null;
export const isConfigured = Boolean(supabase);
