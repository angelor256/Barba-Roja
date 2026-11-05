import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: la app funciona en cualquier ruta (GitHub Pages en /Repo/, dominio propio, Vercel…)
export default defineConfig({ base: './', plugins: [react()] });
