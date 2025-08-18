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
        primary: {
          400: 'rgb(var(--color-primary) / 0.9)',
          500: 'rgb(var(--color-primary))',
          600: 'rgb(var(--color-primary-hover))',
          700: 'rgb(var(--color-primary-active))',
        },
        success: {
          400: 'rgb(var(--color-success) / 0.9)',
          500: 'rgb(var(--color-success))',
          600: 'rgb(var(--color-success))',
        },
        error: {
          500: 'rgb(var(--color-error))',
          600: 'rgb(var(--color-error))',
        },
        warning: {
          500: 'rgb(var(--color-warning))',
          600: 'rgb(var(--color-warning))',
        },
        info: {
          500: 'rgb(var(--color-info))',
          600: 'rgb(var(--color-info))',
        },
      },
    },
  },
  plugins: [],
}
