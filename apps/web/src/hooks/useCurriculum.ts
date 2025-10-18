import { useQuery } from '@tanstack/react-query';
import { http } from '../lib/http';
import { queryKeys } from '../lib/queryClient';
import { CurriculumResponse } from '../types/api';

export function useCurriculum() {
  return useQuery({
    queryKey: queryKeys.curriculum,
    queryFn: async (): Promise<CurriculumResponse['data']> => {
      const response = await http.get<CurriculumResponse>('/me/curriculum');
      
      console.log('🔍 [useCurriculum] Response:', {
        status: response.status,
        data: response.data,
        dataStructure: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data'
      });
      
      if (!response.data || !response.data.data) {
        throw new Error(`Invalid curriculum response: ${JSON.stringify(response.data)}`);
      }
      
      console.log('🔍 [useCurriculum] lesson-1 data:', 
        response.data.data[0]?.lessons?.find(l => l.id === 'lesson-1')
      );
      
      return response.data.data;
    },
    staleTime: 0, // 캐시 비활성화 (디버깅용)
  });
}

