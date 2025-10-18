import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import httpClient from './http';
import type {
  CurriculumSubject,
  LessonStatus,
  ProgressPingRequest,
  ProgressPingResponse,
  ExamStartResponse,
  ExamSubmitRequest,
  ExamSubmitResponse,
  RetakeResponse,
  NextAvailableResponse,
} from './types';

// Query Keys
export const queryKeys = {
  curriculum: ['curriculum'] as const,
  lessonStatus: (lessonId: string) => ['lesson-status', lessonId] as const,
  nextAvailable: ['next-available'] as const,
  examAttempt: (attemptId: string) => ['exam-attempt', attemptId] as const,
};

// Curriculum API
export const useCurriculum = () => {
  return useQuery({
    queryKey: queryKeys.curriculum,
    queryFn: async (): Promise<CurriculumSubject[]> => {
      // 실제 API가 구현되면 이 엔드포인트를 사용
      // const response = await httpClient.get('/me/curriculum');
      
      // 임시로 기존 API 조합으로 구현
      const nextResponse = await httpClient.get('/progress/next-available');
      const nextData = nextResponse.data as NextAvailableResponse;
      
      // Mock 데이터로 반환 (실제 구현 시 삭제)
      return [
        {
          subjectId: 'subject-math',
          subjectTitle: '수학',
          lessons: [
            {
              lessonId: 'lesson-1',
              lessonTitle: '1장: 수와 연산',
              progressPercent: 0,
              status: 'available',
              remainingTries: 3,
              remainDays: 30,
            },
            {
              lessonId: 'lesson-2',
              lessonTitle: '2장: 방정식',
              progressPercent: 0,
              status: 'locked',
              remainingTries: 3,
              remainDays: 30,
            },
            {
              lessonId: 'lesson-3',
              lessonTitle: '3장: 함수',
              progressPercent: 0,
              status: 'locked',
              remainingTries: 3,
              remainDays: 30,
            },
          ],
        },
      ];
    },
  });
};

// Lesson Status API
export const useLessonStatus = (lessonId: string) => {
  return useQuery({
    queryKey: queryKeys.lessonStatus(lessonId),
    queryFn: async (): Promise<LessonStatus> => {
      const response = await httpClient.get(`/progress/lessons/${lessonId}/status`);
      return response.data;
    },
    enabled: !!lessonId,
  });
};

// Next Available API
export const useNextAvailable = () => {
  return useQuery({
    queryKey: queryKeys.nextAvailable,
    queryFn: async (): Promise<NextAvailableResponse> => {
      const response = await httpClient.get('/progress/next-available');
      return response.data;
    },
  });
};

// Progress Ping Mutation
export const useProgressPing = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ProgressPingRequest): Promise<ProgressPingResponse> => {
      const response = await httpClient.post('/progress/ping', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 관련 쿼리들 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: queryKeys.lessonStatus(variables.lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum });
      queryClient.invalidateQueries({ queryKey: queryKeys.nextAvailable });
    },
  });
};

// Exam Start Mutation
export const useStartExam = () => {
  return useMutation({
    mutationFn: async (lessonId: string): Promise<ExamStartResponse> => {
      const response = await httpClient.post(`/exam/lessons/${lessonId}/start`);
      return response.data;
    },
  });
};

// Exam Submit Mutation
export const useSubmitExam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      attemptId, 
      data 
    }: { 
      attemptId: string; 
      data: ExamSubmitRequest; 
    }): Promise<ExamSubmitResponse> => {
      const response = await httpClient.post(`/exam/attempts/${attemptId}/submit`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // 시험 제출 후 관련 데이터 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.lessonStatus(data.lessonId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.curriculum });
      queryClient.invalidateQueries({ queryKey: queryKeys.nextAvailable });
    },
  });
};

// Exam Retake Mutation
export const useRetakeExam = () => {
  return useMutation({
    mutationFn: async (lessonId: string): Promise<ExamStartResponse> => {
      const response = await httpClient.post(`/exam/lessons/${lessonId}/retake`);
      return response.data;
    },
  });
};

export default {
  useCurriculum,
  useLessonStatus,
  useNextAvailable,
  useProgressPing,
  useStartExam,
  useSubmitExam,
  useRetakeExam,
};

