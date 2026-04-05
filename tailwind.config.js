/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // AVN Track design system — "Luminescent Sanctuary"
        surface: '#0d1228',
        'surface-dim': '#0d1228',
        'surface-container-lowest': '#070c23',
        'surface-container-low': '#151a31',
        'surface-container': '#191e35',
        'surface-container-high': '#242940',
        'surface-container-highest': '#2f334c',
        'surface-bright': '#333850',
        'on-surface': '#dde1ff',
        'on-surface-variant': '#d7c3ae',
        'outline': '#9f8e7a',
        'outline-variant': '#524534',
        primary: '#ffc880',
        'primary-container': '#f5a623',
        'on-primary': '#452b00',
        'on-primary-container': '#644000',
        secondary: '#ecbf85',
        'secondary-container': '#5f4112',
        'on-secondary-container': '#d9ae75',
        error: '#ffb4ab',
        'error-container': '#93000a',
        background: '#0d1228',
        'on-background': '#dde1ff',
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
