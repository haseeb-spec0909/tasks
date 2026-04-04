/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tmc': {
          'primary': '#3B82F6',
          'one-on-one': '#3B82F6',
          'team-meeting': '#7C3AED',
          'external': '#EC4899',
          'personal': '#FB7185',
          'google-task': '#10B981',
          'projectflow': '#0D9488',
          'focus': '#4F46E5',
          'habit': '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
