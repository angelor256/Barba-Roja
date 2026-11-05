import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE=/nombre-del-repo/ al publicar en GitHub Pages; '/' en cualquier otro hosting
export default defineConfig({ base: process.env.VITE_BASE || '/', plugins: [react()] });
