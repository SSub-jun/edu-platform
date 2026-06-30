import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Field-worker friendly light theme: high contrast, calm, trustworthy.
        'bg-primary': '#F3F6F5',
        'surface': '#FFFFFF',
        'bg-surface': '#FFFFFF',
        'bg-elevated': '#F9FBFA',
        
        // Primary (trust navy)
        'primary': '#143B52',
        'primary-600': '#0F3146',
        'primary-700': '#0A2638',
        
        // Border
        'border': '#D8E2DF',
        'border-light': '#B9C8C4',
        'border-focus': '#0F3146',
        
        // Text
        'text-primary': '#13201D',
        'text-secondary': '#42514D',
        'text-tertiary': '#687873',
        
        // Accent (safety amber, used sparingly)
        'accent': '#D69E2E',
        
        // Semantic
        'success': '#147A55',
        'success-bg': '#EAF7F0',
        'warning': '#A15C00',
        'warning-bg': '#FFF7E6',
        'error': '#C92A2A',
        'error-bg': '#FFF0F0',
        'info': '#1C6C8C',
        'info-bg': '#EAF6FA',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'base': '8px',
        'btn': '6px',
        'card': '10px',
      },
      keyframes: {
        slideDown: {
          'from': {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
