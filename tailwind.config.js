/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        bg: {
          DEFAULT: '#0f0f11',
          2: '#1a1a1f',
          3: '#222228',
        },
        border: '#2e2e38',
        // Text
        text: {
          DEFAULT: '#e8e8f0',
          muted: '#6b6b7e',
        },
        // Brand
        accent: {
          DEFAULT: '#7c6aff',
          pink: '#ff6a8e',
        },
        // Semantic
        success: '#4ade80',
        warning: '#fbbf24',
        info: '#60a5fa',
        danger: '#f87171',
        // TimeTune-style activity colors
        activity: {
          sleep:    '#6b7fff',
          wake:     '#4ade80',
          training: '#ff6a8e',
          eating:   '#fbbf24',
          hygiene:  '#22d3ee',
          study:    '#a78bfa',
          break:    '#94a3b8',
          commute:  '#f97316',
          work:     '#34d399',
          write:    '#fb7185',
        },
      },
      fontFamily: {
        sans: ['DMSans_400Regular', 'System'],
        'sans-medium': ['DMSans_500Medium', 'System'],
        'sans-semibold': ['DMSans_600SemiBold', 'System'],
        mono: ['DMMonoRegular', 'Courier'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
