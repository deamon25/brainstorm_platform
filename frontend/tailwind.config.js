/** @type {import('tailwindcss').Config} */
// Force Vite HMR reload
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          navy: '#042C53',
          'navy-mid': '#185FA5',
          'navy-light': '#E6F1FB',
          teal: '#1D9E75',
          'teal-light': '#E1F5EE',
        },
        entity: {
          'sprint-bg': '#EEEDFE',
          'sprint-text': '#3C3489',
          'issue-bg': '#FAEEDA',
          'issue-text': '#633806',
          'tool-bg': '#E1F5EE',
          'tool-text': '#085041',
        },
        hesitation: {
          'low': '#EAF3DE',
          'low-text': '#27500A',
          'med': '#FAEEDA',
          'med-text': '#633806',
          'high': '#FCEBEB',
          'high-text': '#791F1F',
          'bar': '#EF9F27',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-right': 'slideRight 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(24,95,165,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(24,95,165,0.4)' },
        },
      },
    },
  },
  plugins: [],
}