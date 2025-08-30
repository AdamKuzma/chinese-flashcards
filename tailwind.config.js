/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Opacity-aware colors using CSS variables
        light: 'rgb(var(--color-light-rgb) / <alpha-value>)',
        silver: 'rgb(var(--color-silver-rgb) / <alpha-value>)',
        gray: 'rgb(var(--color-gray-rgb) / <alpha-value>)',
        granite: 'rgb(var(--color-granite-rgb) / <alpha-value>)',
        dark: 'rgb(var(--color-dark-rgb) / <alpha-value>)',
        // Optional aliases to use "-custom" names with opacity modifiers
        'light-custom': 'rgb(var(--color-light-rgb) / <alpha-value>)',
        'silver-custom': 'rgb(var(--color-silver-rgb) / <alpha-value>)',
        'gray-custom': 'rgb(var(--color-gray-rgb) / <alpha-value>)',
        'granite-custom': 'rgb(var(--color-granite-rgb) / <alpha-value>)',
        'dark-custom': 'rgb(var(--color-dark-rgb) / <alpha-value>)',
      }
    },
  },
  plugins: [],
}
