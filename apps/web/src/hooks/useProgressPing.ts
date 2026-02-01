import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../lib/http';
import { queryKeys } from '../lib/queryClient';
import { ProgressPingRequest, ProgressPingResponse } from '../types/api';
import { useCallback, useRef } from 'react';

// ============================================
// localStorage 백업 유틸리티
// ============================================
const PROGRESS_STORAGE_KEY = 'edu_progress_backup';

interface StoredProgress {
  lessonId: string;
  partId?: string;
  maxReachedSeconds: number;
  videoDuration: number;
  savedAt: number; // timestamp
}

export function saveProgressToLocalStorage(data: ProgressPingRequest): void {
  try {
    const stored: StoredProgress = {
      lessonId: data.lessonId,
      partId: data.partId,
      maxReachedSeconds: data.maxReachedSeconds,
      videoDuration: data.videoDuration,
      savedAt: Date.now()
    };
    const key = `${PROGRESS_STORAGE_KEY}_${data.lessonId}`;
    localStorage.setItem(key, JSON.stringify(stored));
    console.log('💾 [LocalStorage] Progress saved:', stored);
  } catch (e) {
    console.warn('💾 [LocalStorage] Failed to save progress:', e);
  }
}

export function getProgressFromLocalStorage(lessonId: string): StoredProgress | null {
  try {
    const key = `${PROGRESS_STORAGE_KEY}_${lessonId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data) as StoredProgress;
      // 24시간 이내 데이터만 유효
      if (Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
        console.log('💾 [LocalStorage] Progress loaded:', parsed);
        return parsed;
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('💾 [LocalStorage] Failed to load progress:', e);
  }
  return null;
}

export function clearProgressFromLocalStorage(lessonId: string): void {
  try {
    const key = `${PROGRESS_STORAGE_KEY}_${lessonId}`;
    localStorage.removeItem(key);
  } catch (e) {
    // ignore
  }
}

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
      // 서버 저장 성공 시 localStorage 백업 삭제
      clearProgressFromLocalStorage(variables.lessonId);
      // 메모이제이션된 함수 사용
      invalidateQueries(variables.lessonId);
    },
    onError: (error, variables) => {
      console.error('❌ [useProgressPing] Error:', error, variables);
    },
  });
}

// 설정 상수
const DEBOUNCE_MS = 3000;        // 디바운스: 3초
const FORCE_SAVE_MS = 30000;     // 강제 저장: 30초마다

// 디바운스된 ping 훅 (3초 간격 + 30초 강제 저장 + localStorage 백업)
export function useDebouncedProgressPing() {
  const progressPingMutation = useProgressPing();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedDataRef = useRef<ProgressPingRequest | null>(null);
  const lastServerSaveRef = useRef<number>(0);
  const mutationRef = useRef(progressPingMutation);

  // mutation 참조를 최신 상태로 유지
  mutationRef.current = progressPingMutation;

  // 서버로 전송하는 내부 함수
  const sendToServer = useCallback(() => {
    if (accumulatedDataRef.current) {
      console.log('📤 [useDebouncedProgressPing] Sending to server');
      mutationRef.current.mutate(accumulatedDataRef.current);
      lastServerSaveRef.current = Date.now();
      accumulatedDataRef.current = null;
    }
  }, []);

  const debouncedPing = useCallback((data: ProgressPingRequest) => {
    console.log('⏱️ [useDebouncedProgressPing] Received data:', data);

    // 이전 디바운스 타이머 취소
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
    } else {
      accumulatedDataRef.current = { ...data };
    }

    // ✅ 즉시 localStorage에 백업 저장 (네트워크 끊김 대비)
    saveProgressToLocalStorage(accumulatedDataRef.current);

    // 3초 디바운스 후 서버 전송
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ [useDebouncedProgressPing] Debounce timeout reached');
      sendToServer();
    }, DEBOUNCE_MS);

    // ✅ 30초마다 강제 저장 (타이머가 없으면 설정)
    if (!forceSaveTimeoutRef.current) {
      forceSaveTimeoutRef.current = setTimeout(() => {
        console.log('⏰ [useDebouncedProgressPing] Force save triggered (30s)');
        forceSaveTimeoutRef.current = null;

        // 디바운스 타이머 취소하고 즉시 전송
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        sendToServer();
      }, FORCE_SAVE_MS);
    }
  }, [sendToServer]);

  // 즉시 전송 (컴포넌트 언마운트 시 등)
  const flushPing = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (forceSaveTimeoutRef.current) {
      clearTimeout(forceSaveTimeoutRef.current);
      forceSaveTimeoutRef.current = null;
    }

    sendToServer();
  }, [sendToServer]);

  // ✅ 페이지 종료 시 저장 (localStorage 백업 + keepalive fetch)
  const flushPingSync = useCallback(() => {
    if (accumulatedDataRef.current) {
      // 1. localStorage에 최종 저장 (가장 확실한 백업)
      saveProgressToLocalStorage(accumulatedDataRef.current);
      console.log('💾 [useDebouncedProgressPing] Final localStorage save on exit');

      // 2. keepalive fetch 시도 (인증 헤더 포함 가능)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        if (token) {
          fetch(`${apiUrl}/progress/ping`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(accumulatedDataRef.current),
            keepalive: true  // 페이지 종료 후에도 전송 시도
          }).catch(() => {
            // 실패해도 무시 - localStorage에 백업됨
          });
        }
      } catch (e) {
        // 실패해도 무시 - localStorage에 백업됨
      }

      accumulatedDataRef.current = null;
    }
  }, []);

  return {
    debouncedPing,
    flushPing,
    flushPingSync,
    isLoading: progressPingMutation.isPending,
  };
}

