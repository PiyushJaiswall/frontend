/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0D0F11',
        'secondary': '#1A1D21',
        'accent': '#3662E3',
        'light-gray': '#E5E7EB',
        'medium-gray': '#6B7280',
        'dark-gray': '#374151',
      },
    },
  },
  plugins: [],
}
