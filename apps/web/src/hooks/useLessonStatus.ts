import { useQuery } from '@tanstack/react-query';
import { http } from '../lib/http';
import { queryKeys } from '../lib/queryClient';
import { LessonStatusResponse } from '../types/api';

export function useLessonStatus(lessonId: string) {
  return useQuery({
    queryKey: queryKeys.lessonStatus(lessonId),
    queryFn: async (): Promise<LessonStatusResponse['data']> => {
      const response = await http.get(`/progress/lessons/${lessonId}/status`);
      
      // 응답 데이터 구조 검증 및 로깅
      console.log('🔍 [useLessonStatus] Response:', {
        status: response.status,
        data: response.data,
      });
      
      // 백엔드에서 직접 데이터 객체를 반환하므로 response.data를 그대로 사용
      if (!response.data) {
        throw new Error(`No data in response: ${JSON.stringify(response)}`);
      }
      
      return response.data;
    },
    enabled: !!lessonId,
    staleTime: 0, // 항상 최신 데이터 fetch (페이지 재진입 시 진도율 최신화)
    refetchOnMount: 'always', // 컴포넌트 마운트 시 항상 refetch
  });
}

