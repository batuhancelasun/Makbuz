/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        dark: {
          900: '#0a0e17',
          800: '#0f1420',
          700: '#151b2b',
          600: '#1c2438',
          500: '#242e47',
        },
        accent: {
          pink: '#F472B6',
          purple: '#A78BFA',
          blue: '#60A5FA',
          cyan: '#22D3EE',
          green: '#34D399',
          yellow: '#FBBF24',
          orange: '#FB923C',
          red: '#F87171',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

