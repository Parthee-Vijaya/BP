/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kalundborg Kommune brand colors
        kalundborg: {
          50: '#fdf5f3',
          100: '#fce8e4',
          200: '#fad4cc',
          300: '#f5b5a7',
          400: '#ed8a74',
          500: '#e16347',
          600: '#cd4a2e',
          700: '#B54A32', // Primary brand color
          800: '#8f3d2a',
          900: '#773728',
          950: '#411911',
        },
        primary: {
          50: '#fdf5f3',
          100: '#fce8e4',
          200: '#fad4cc',
          300: '#f5b5a7',
          400: '#ed8a74',
          500: '#e16347',
          600: '#B54A32', // Kalundborg primary
          700: '#9a3f2b',
          800: '#8f3d2a',
          900: '#773728',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
