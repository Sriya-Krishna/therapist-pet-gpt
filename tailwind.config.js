/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sage: {
          50: '#f2f7f5',
          100: '#e0ede8',
          200: '#c3dbd3',
          300: '#9bc2b5',
          400: '#6ea393',
          500: '#4A7C6F',
          600: '#3d6a5e',
          700: '#34584f',
          800: '#2d4842',
          900: '#273c38',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
