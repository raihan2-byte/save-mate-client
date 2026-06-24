/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 40px rgba(16,185,129,0.35)',
        'glow-emerald-sm': '0 0 20px rgba(16,185,129,0.25)',
        'glow-emerald-lg': '0 0 80px rgba(16,185,129,0.4)',
        'card': '0 0 80px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'grid-overlay': "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
}
