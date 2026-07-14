/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#dbe6ff',
          500: '#3b6cff',
          600: '#2b57e6',
          700: '#1f45b8',
          900: '#0f2359'
        }
      }
    }
  },
  plugins: []
};
