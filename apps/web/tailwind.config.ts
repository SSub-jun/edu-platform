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
        // Background & Surface (Light Theme)
        'bg-primary': '#FFFFFF',      // 최상위 페이지 배경 (화이트)
        'surface': '#F6F8FB',         // 카드·입력 필드 배경 (아주 옅은 그레이/블루 톤)
        'bg-surface': '#F6F8FB',      // 카드·입력 필드 배경
        'bg-elevated': '#FFFFFF',     // 강조 영역 배경 (화이트 유지)
        
        // Primary (네이비 포인트)
        'primary': '#1F2A44',         // 네이비 포인트
        'primary-600': '#223154',     // hover
        'primary-700': '#1A2340',     // active
        
        // Border (Light Theme)
        'border': '#E5E7EB',          // 기본 테두리(라이트)
        'border-light': '#D8DEE6',    // 미묘한 구분선
        'border-focus': '#223154',    // focus ring (primary-600과 동일)
        
        // Text (Light Theme - 짙은 텍스트)
        'text-primary': '#1A1D21',    // 본문 기본(짙은 무채)
        'text-secondary': '#4B5563',  // 보조 텍스트
        'text-tertiary': '#6B7280',   // 힌트/비활성
        
        // Accent (골드 강조 - 최소 사용)
        'accent': '#A67C52',
        
        // Semantic (Light Theme 대응)
        'success': '#0E9F6E',
        'success-bg': '#ECFDF5',      // 연한 녹색 배경
        'warning': '#B45309',
        'warning-bg': '#FFFBEB',      // 연한 노란색 배경
        'error': '#DC2626',
        'error-bg': '#FEF2F2',        // 연한 빨간색 배경
        'info': '#2563EB',
        'info-bg': '#EFF6FF',         // 연한 파란색 배경
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

