import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../lib/http';
import { queryKeys } from '../lib/queryClient';
import { 
  StartExamResponse, 
  SubmitExamRequest, 
  SubmitExamResponse, 
  RetakeExamResponse 
} from '../types/api';

export function useStartExam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lessonId: string): Promise<StartExamResponse['data']> => {
      const response = await http.post<StartExamResponse>(`/exam/lessons/${lessonId}/start`);
      
      console.log('🔍 [useStartExam] Response:', {
        status: response.status,
        data: response.data,
      });
      
      // 백엔드에서 직접 데이터 객체를 반환하므로 response.data를 그대로 사용
      if (!response.data) {
        throw new Error(`No data in response: ${JSON.stringify(response)}`);
      }
      
      return response.data;
    },
    onSuccess: (data, lessonId) => {
      // 레슨 상태 갱신
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lessonStatus(lessonId) 
      });
    },
  });
}

export function useSubmitExam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      answers 
    }: { 
      attemptId: string; 
      answers: SubmitExamRequest['answers'] 
    }): Promise<SubmitExamResponse['data']> => {
      const response = await http.post<SubmitExamResponse>(
        `/exam/attempts/${attemptId}/submit`, 
        { answers }
      );
      
      console.log('🔍 [useSubmitExam] Response:', {
        status: response.status,
        data: response.data,
      });
      
      // 백엔드에서 직접 데이터 객체를 반환하므로 response.data를 그대로 사용
      if (!response.data) {
        throw new Error(`No data in response: ${JSON.stringify(response)}`);
      }
      
      return response.data;
    },
    onSuccess: () => {
      // 커리큘럼과 next-available 상태 갱신
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.curriculum 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.nextAvailable() 
      });
    },
  });
}

export function useRetakeExam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lessonId: string): Promise<RetakeExamResponse['data']> => {
      const response = await http.post<RetakeExamResponse>(`/exam/lessons/${lessonId}/retake`);
      
      console.log('🔍 [useRetakeExam] Response:', {
        status: response.status,
        data: response.data,
      });
      
      // 백엔드에서 직접 데이터 객체를 반환하므로 response.data를 그대로 사용
      if (!response.data) {
        throw new Error(`No data in response: ${JSON.stringify(response)}`);
      }
      
      return response.data;
    },
    onSuccess: (data, lessonId) => {
      // 레슨 상태 갱신
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lessonStatus(lessonId) 
      });
    },
  });
}