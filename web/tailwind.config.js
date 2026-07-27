/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0D0D0D',
          card: '#1A1A1A',
          raised: '#222222',
        },
        border: {
          DEFAULT: '#2C2C2C',
        },
        primary: {
          DEFAULT: '#F5A623',
          dark: '#3a2000',
          text: '#111111',
        },
        muted: '#8A8A8A',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
