/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        light: 'var(--color-light)',
        silver: 'var(--color-silver)',
        gray: 'var(--color-gray)',
        granite: 'var(--color-granite)',
        dark: 'var(--color-dark)',
      }
    },
  },
  plugins: [],
}
