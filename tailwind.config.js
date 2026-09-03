/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0b0d12',
          darkAlt: '#12151c',
          card: '#151922',
          cardHover: '#1c222e',
          border: '#242a38',
          borderGlow: 'rgba(230, 51, 41, 0.35)',
          accent: '#e63329',
          accentLight: '#ff4a3d',
          accentDim: 'rgba(230, 51, 41, 0.12)',
          accentMid: 'rgba(230, 51, 41, 0.35)',
          teal: '#00f2fe',
          tealDim: 'rgba(0, 242, 254, 0.12)',
          blue: '#2563eb',
          blueDim: 'rgba(37, 99, 235, 0.12)',
          purple: '#8b5cf6',
          purpleDim: 'rgba(139, 92, 246, 0.12)',
          green: '#10b981',
          greenDim: 'rgba(16, 185, 129, 0.12)',
          warning: '#f59e0b',
          warningDim: 'rgba(245, 158, 11, 0.12)',
          danger: '#ef4444',
          dangerDim: 'rgba(239, 68, 68, 0.12)'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Poppins', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
