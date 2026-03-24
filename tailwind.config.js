/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          start: '#0EA5E9',
          end: '#38BDF8',
        },
        secondary: {
          bg: '#F1F5F9',
        },
        accent: {
          yellow: '#FACC15',
          purple: '#8B5CF6',
        },
        text: {
          dark: '#0F172A',
        },
        app: {
          fg: 'rgb(var(--app-fg-rgb) / <alpha-value>)',
        },
        glass: 'rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'sky-gradient': 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
        'sky-gradient-soft': 'linear-gradient(180deg, #0EA5E9 0%, #38BDF8 50%, #7DD3FC 100%)',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    function appNightVariant({ addVariant }) {
      addVariant('app-night', '.weather-app.app-night &');
    },
  ],
}
