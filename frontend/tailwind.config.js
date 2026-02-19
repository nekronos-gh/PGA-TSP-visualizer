/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          900: '#0f172a',
        },
        primary: {
          400: '#38bdf8', // Cyan
          500: '#0ea5e9',
          600: '#0284c7',
        },
        success: {
          400: '#4ade80', // Emerald
        },
        accent: {
          400: '#f472b6', // Pink
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
