/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#E51E25', dark: '#B3141A', light: '#FF3B42' },
        ink: { DEFAULT: '#0D0D0D', 900: '#121212', 800: '#1F1F1F', 700: '#2A2A2A', 600: '#3A3A3A' },
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // sombra "desplazada" roja, como la del logo
        stamp: '4px 4px 0 0 #E51E25',
        'stamp-sm': '3px 3px 0 0 #E51E25',
      },
    },
  },
  plugins: [],
};
