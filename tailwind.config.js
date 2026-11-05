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
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 30px -8px rgba(229,30,37,.6)',
        'glow-lg': '0 20px 60px -12px rgba(229,30,37,.55)',
        soft: '0 10px 40px -15px rgba(0,0,0,.8)',
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        blob: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(30px,-20px) scale(1.15)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        float: 'float 5s ease-in-out infinite',
        blob: 'blob 12s ease-in-out infinite',
        'fade-up': 'fadeUp .6s cubic-bezier(.2,.8,.2,1) backwards',
      },
    },
  },
  plugins: [],
};
