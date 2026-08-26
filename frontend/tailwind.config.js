/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mesob: {
          primary: '#1e3a8a',
          secondary: '#1e40af',
          accent: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
}
