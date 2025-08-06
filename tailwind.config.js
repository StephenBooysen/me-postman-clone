/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf7ed',
          100: '#faecd4',
          200: '#f4d5a9',
          300: '#ecb872',
          400: '#e4984a',
          500: '#df7d26',
          600: '#d0651b',
          700: '#ad4c18',
          800: '#8a3d1a',
          900: '#70341a',
        }
      }
    },
  },
  plugins: [],
}