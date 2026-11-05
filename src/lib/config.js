export const BUSINESS = {
  name: 'Barba Roja',
  address: '200 metros Oeste de Plaza Mayor, a un costado del Parque Llama del Bosque; Rohrmoser. San José, Costa Rica.',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '',
  instagram: 'https://www.instagram.com/barberiabarbaroja/',
};

export const WAZE_URL = 'https://waze.com/ul?q=Barba%20Roja%20Barberia%20Rohrmoser&navigate=yes';
export const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Barberia+Barba+Roja+Rohrmoser+San+Jose+Costa+Rica';
export const MAPS_EMBED = 'https://maps.google.com/maps?q=Plaza+Mayor+Rohrmoser+San+Jose&z=16&output=embed';

// Costa Rica: UTC-6 todo el año (sin horario de verano)
export const TZ = 'America/Costa_Rica';
export const TZ_OFFSET = '-06:00';
export const SLOT_STEP_MIN = 15;

export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Respaldo si Supabase aún no está configurado (modo demo)
export const FALLBACK_SERVICES = [
  { id: 's1', name: 'Barba Express', description: 'Menos de 15 minutos', price_crc: 7000, duration_min: 15 },
  { id: 's2', name: 'Barba', description: 'Perfilado y arreglo completo', price_crc: 8250, duration_min: 30 },
  { id: 's3', name: 'Pelo', description: 'Corte a tu estilo', price_crc: 8750, duration_min: 40 },
  { id: 's4', name: 'Combo Barba + Pelo', description: 'El paquete completo', price_crc: 13750, duration_min: 60 },
  { id: 's5', name: 'Mascarilla Facial', description: 'Limpieza e hidratación', price_crc: 6000, duration_min: 20 },
  { id: 's6', name: 'Depilación de Nariz', description: '', price_crc: 3000, duration_min: 10 },
  { id: 's7', name: 'Depilación de Orejas', description: '', price_crc: 2500, duration_min: 10 },
];

export const HOURS = [
  { d: 'Lunes a viernes', h: '9:00 a. m. – 7:00 p. m.' },
  { d: 'Sábado', h: '9:00 a. m. – 5:00 p. m.' },
  { d: 'Domingo', h: 'Cerrado' },
];
