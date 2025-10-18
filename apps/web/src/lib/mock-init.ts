// MSW 초기화 (개발 환경에서만)
export async function initMSW() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const { worker } = await import('./msw/browser');
    return worker.start({
      onUnhandledRequest: 'warn',
    });
  }
}








