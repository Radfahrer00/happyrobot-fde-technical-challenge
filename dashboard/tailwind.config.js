/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'acme-navy': '#1B2E5E',
        'acme-orange': '#F97316',
        'hr-dark': '#0F1117',
        'hr-card': '#1A1D27',
        'hr-teal': '#00D4B4',
        'hr-border': '#2A2D3A',
      },
    },
  },
  plugins: [],
}
