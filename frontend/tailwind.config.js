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
        cyber: {
          bg: '#080d1a',
          surface: '#0f172a',
          card: '#131e36',
          border: '#1e293b',
          borderBright: '#334155',
          accent: '#00f0ff',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-blue': '0 0 20px -3px rgba(59, 130, 246, 0.3)',
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.3)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.3)',
      }
    },
  },
  plugins: [],
}
