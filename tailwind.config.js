
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },

        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          700: '#c2410c',
          800: '#9a3412',
        },

        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          700: '#15803d',
          800: '#166534',
        },

        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          800: '#92400e',
        },

        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          700: '#b91c1c',
          800: '#991b1b',
        },
      },

      keyframes: {
        'fade-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },

      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },

  plugins: [],
};
