import { useQuery } from '@tanstack/react-query';
import { http } from '../lib/http';
import { queryKeys } from '../lib/queryClient';
import { NextAvailableResponse } from '../types/api';

export function useNextAvailable(subjectId?: string) {
  return useQuery({
    queryKey: queryKeys.nextAvailable(subjectId),
    queryFn: async (): Promise<NextAvailableResponse['data']> => {
      const params = subjectId ? `?subjectId=${subjectId}` : '';
      const response = await http.get(`/progress/next-available${params}`);
      
      console.log('🔍 [useNextAvailable] Response:', {
        status: response.status,
        data: response.data,
      });
      
      // 백엔드에서 직접 데이터 객체를 반환하므로 response.data를 그대로 사용
      if (!response.data) {
        throw new Error(`No data in response: ${JSON.stringify(response)}`);
      }
      
      return response.data;
    },
    staleTime: 60 * 1000, // 1분
  });
}

