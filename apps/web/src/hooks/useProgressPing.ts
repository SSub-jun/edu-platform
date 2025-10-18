import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../lib/http';
import { queryKeys } from '../lib/queryClient';
import { ProgressPingRequest, ProgressPingResponse } from '../types/api';
import { useCallback, useRef } from 'react';

export function useProgressPing() {
  const queryClient = useQueryClient();
  
  // 쿼리 무효화 함수를 useCallback으로 메모이제이션
  const invalidateQueries = useCallback((lessonId: string) => {
    // 디바운싱을 적용해서 너무 자주 무효화되는 것을 방지
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.lessonStatus(lessonId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.curriculum 
      });
    }, 100); // 100ms 디바운싱
  }, [queryClient]);
  
  return useMutation({
    mutationFn: async (data: ProgressPingRequest): Promise<ProgressPingResponse['data']> => {
      console.log('📤 [useProgressPing] Sending request:', data);
      const response = await http.post('/progress/ping', data);
      
      console.log('📥 [useProgressPing] Response:', {
        status: response.status,
        data: response.data,
      });
      
      // 백엔드에서 직접 데이터 객체를 반환하므로 response.data를 그대로 사용
      if (!response.data) {
        throw new Error(`No data in response: ${JSON.stringify(response)}`);
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      console.log('✅ [useProgressPing] Success:', { data, lessonId: variables.lessonId });
      // 메모이제이션된 함수 사용
      invalidateQueries(variables.lessonId);
    },
    onError: (error, variables) => {
      console.error('❌ [useProgressPing] Error:', error, variables);
    },
  });
}

// 디바운스된 ping 훅 (3초 간격)
export function useDebouncedProgressPing() {
  const progressPingMutation = useProgressPing();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedDataRef = useRef<ProgressPingRequest | null>(null);
  const mutationRef = useRef(progressPingMutation);
  
  // mutation 참조를 최신 상태로 유지
  mutationRef.current = progressPingMutation;

  const debouncedPing = useCallback((data: ProgressPingRequest) => {
    console.log('⏱️ [useDebouncedProgressPing] Received data:', data);
    
    // 이전 타이머 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 데이터 누적 (같은 lessonId, partId에 대해 maxReachedSeconds는 최대값, videoDuration은 최신값 사용)
    if (accumulatedDataRef.current?.lessonId === data.lessonId && 
        accumulatedDataRef.current?.partId === data.partId) {
      // maxReachedSeconds는 항상 최대값 유지
      accumulatedDataRef.current.maxReachedSeconds = Math.max(
        accumulatedDataRef.current.maxReachedSeconds,
        data.maxReachedSeconds
      );
      // videoDuration은 최신값 사용 (일반적으로 동일하지만 업데이트될 수 있음)
      accumulatedDataRef.current.videoDuration = data.videoDuration;
      console.log('⏱️ [useDebouncedProgressPing] Updated accumulated data:', accumulatedDataRef.current);
    } else {
      accumulatedDataRef.current = { ...data };
      console.log('⏱️ [useDebouncedProgressPing] New accumulated data:', accumulatedDataRef.current);
    }

    // 3초 후 실행
    timeoutRef.current = setTimeout(() => {
      if (accumulatedDataRef.current) {
        console.log('⏰ [useDebouncedProgressPing] Debounce timeout reached, sending request');
        // ref를 통해 안정적인 참조 사용
        mutationRef.current.mutate(accumulatedDataRef.current);
        accumulatedDataRef.current = null;
      }
    }, 3000);
  }, []); // 의존성 배열을 비워서 함수 재생성 방지

  // 즉시 전송 (컴포넌트 언마운트 시 등)
  const flushPing = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (accumulatedDataRef.current) {
      // ref를 통해 안정적인 참조 사용
      mutationRef.current.mutate(accumulatedDataRef.current);
      accumulatedDataRef.current = null;
    }
  }, []); // 의존성 배열을 비워서 함수 재생성 방지

  return {
    debouncedPing,
    flushPing,
    isLoading: progressPingMutation.isPending,
  };
}

