import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

// React Query 기본 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 401, 403 등 인증/권한 오류는 재시도하지 않음
        if (error instanceof AxiosError) {
          if ([401, 403, 404].includes(error.response?.status || 0)) {
            return false;
          }
        }
        // 최대 2회 재시도
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
    },
    mutations: {
      retry: false, // mutation은 기본적으로 재시도하지 않음
      onError: (error) => {
        // 전역 에러 로깅
        console.error('Mutation error:', error);
      },
    },
  },
});

// 쿼리 키 팩토리
export const queryKeys = {
  // User & Auth
  me: ['me'] as const,
  curriculum: ['me', 'curriculum'] as const,
  
  // Progress
  lessonStatus: (lessonId: string) => ['progress', 'lessons', lessonId, 'status'] as const,
  nextAvailable: (subjectId?: string) => ['progress', 'next-available', subjectId] as const,
  
  // Exam
  examAttempts: (lessonId: string) => ['exam', 'attempts', 'lesson', lessonId] as const,
} as const;

export default queryClient;








