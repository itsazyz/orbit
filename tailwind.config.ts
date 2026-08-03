import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        space: {
          void: '#05060a',
          deep: '#0a0d16',
          nebula: '#12162a',
          panel: '#161a2e',
          border: '#232842',
        },
        star: {
          DEFAULT: '#f5f3ff',
          dim: '#9aa0c3',
        },
        accent: {
          DEFAULT: '#7c8cff',
          warm: '#ff9d6c',
          calm: '#6cd9ff',
          creative: '#c78cff',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'Tahoma', 'sans-serif'],
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        driftSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 12px var(--glow-color))' },
          '50%': { filter: 'drop-shadow(0 0 28px var(--glow-color))' },
        },
        dustDrift: {
          '0%, 100%': {
            transform: 'translate(0, 0)',
            opacity: '0.15',
          },
          '50%': {
            transform: 'translate(var(--dust-x, 20px), var(--dust-y, -30px))',
            opacity: '0.45',
          },
        },
        fadeRise: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        twinkle: 'twinkle 3.5s ease-in-out infinite',
        'drift-slow': 'driftSlow 240s linear infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'dust-drift': 'dustDrift 24s ease-in-out infinite',
        'fade-rise': 'fadeRise 0.9s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
