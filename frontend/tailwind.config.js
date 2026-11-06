/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        loom: {
          surface: '#ffffff',
          panel: '#f8fafc',
          border: '#e2e8f0',
          darkBg: '#090d16',
          darkCard: '#111726',
          darkBorder: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans Gujarati', 'Noto Sans Devanagari', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        display: ['Rajdhani', 'Noto Sans Gujarati', 'Noto Sans Devanagari', 'Outfit', 'sans-serif']
      },
      animation: {
        'shuttle-fast': 'shuttleMove 0.42s ease-in-out infinite',
        'shuttle-slow': 'shuttleMove 1.2s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite'
      },
      keyframes: {
        shuttleMove: {
          '0%': { transform: 'translateX(-14px)' },
          '50%': { transform: 'translateX(14px)' },
          '100%': { transform: 'translateX(-14px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      }
    },
  },
  plugins: [],
}

