/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            DEFAULT: '#0f2942',
            light: '#1e3a5f',
            dark: '#0a1d30',
          },
          saffron: {
            DEFAULT: '#c05621',
            light: '#dd6b20',
          },
          green: {
            DEFAULT: '#15803d',
            light: '#16a34a',
            bg: '#f0fdf4',
          },
          amber: {
            DEFAULT: '#b45309',
            light: '#d97706',
            bg: '#fffbeb',
          },
          red: {
            DEFAULT: '#b91c1c',
            light: '#dc2626',
            bg: '#fef2f2',
          },
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
