import '@testing-library/jest-dom';
import { server } from './src/lib/msw/server';

// MSW 서버 설정
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Next.js 환경 변수 설정
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:4000';

// console 경고 무시 (테스트 중 불필요한 로그 제거)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// matchMedia 모킹 (CSS 미디어 쿼리 테스트용)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// IntersectionObserver 모킹
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};