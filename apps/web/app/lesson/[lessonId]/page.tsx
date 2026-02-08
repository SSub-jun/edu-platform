'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLessonStatus } from '../../../src/hooks/useLessonStatus';
import { useDebouncedProgressPing } from '../../../src/hooks/useProgressPing';
import { useNextAvailable } from '../../../src/hooks/useNextAvailable';
import VideoPlayer from '../../../src/components/VideoPlayer';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import { getErrorMessage } from '../../../src/utils/errorMap';

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  
  const { 
    data: lessonStatus, 
    isLoading: statusLoading, 
    error: statusError
  } = useLessonStatus(lessonId);
  
  const { 
    data: nextAvailable, 
    isLoading: nextLoading 
  } = useNextAvailable();
  
  const { debouncedPing, flushPing } = useDebouncedProgressPing();

  // 🎯 낙관적 UI 업데이트: 로컬 진도율 상태
  const [optimisticProgress, setOptimisticProgress] = useState<{
    maxReachedSeconds: number;
    videoDuration: number;
    progressPercent: number;
  } | null>(null);

  // ⏱️ 마지막 UI 업데이트 시간 추적 (10초 throttle)
  const lastUIUpdateRef = React.useRef<number>(0);

  // 컴포넌트 언마운트 시 남은 진도 전송
  useEffect(() => {
    return () => {
      flushPing();
    };
  }, []); // flushPing이 안정적이므로 의존성에서 제거

  const handleVideoProgress = useCallback((maxReachedSeconds: number, videoDuration: number) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUIUpdateRef.current;
    
    // ✅ 10초마다 한 번씩만 UI 업데이트 (10000ms throttle)
    if (timeSinceLastUpdate >= 10000 || lastUIUpdateRef.current === 0) {
      console.log('🎯 [LessonPage] UI Progress updated:', { 
        lessonId, 
        maxReachedSeconds, 
        videoDuration,
        timeSinceLastUpdate: `${(timeSinceLastUpdate / 1000).toFixed(1)}s`
      });
      
      const progressPercent = videoDuration > 0 ? (maxReachedSeconds / videoDuration) * 100 : 0;
      setOptimisticProgress({
        maxReachedSeconds,
        videoDuration,
        progressPercent
      });
      
      lastUIUpdateRef.current = now;
    }
    
    // ⏱️ 백그라운드에서 서버 동기화 (3초 디바운스) - 항상 실행
    debouncedPing({
      lessonId,
      partId: 'part-1',
      maxReachedSeconds,
      videoDuration
    });
  }, [lessonId, debouncedPing]);


  if (statusLoading) {
    return (
      <div className="min-h-screen py-6 px-4 bg-bg-primary">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface rounded w-1/4"></div>
            <div className="h-96 bg-surface rounded"></div>
            <div className="h-32 bg-surface rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (statusError) {
    const errorMessage = getErrorMessage(statusError);
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
        <div className="bg-surface border border-error rounded-xl p-8 max-w-md text-center">
          <h3 className="text-xl font-bold text-error mb-3">{errorMessage.title}</h3>
          <p className="text-base text-text-secondary mb-6">{errorMessage.description}</p>
          <div className="flex gap-3">
              <button 
              className="flex-1 px-5 py-3 bg-primary text-text-primary rounded-lg font-semibold transition-colors hover:bg-primary-600"
                onClick={() => window.location.reload()}
              >
                {errorMessage.actionLabel || '다시 시도'}
              </button>
            <Link href="/curriculum" className="flex-1 px-5 py-3 bg-bg-primary text-text-secondary border border-border rounded-lg font-semibold text-center transition-all hover:bg-surface hover:text-text-primary">
                커리큘럼으로
              </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lessonStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary">
        <div className="text-center bg-surface border border-border rounded-xl p-10">
          <h3 className="text-xl font-bold text-text-primary mb-6">레슨을 찾을 수 없습니다</h3>
          <Link href="/curriculum" className="inline-block px-6 py-3 bg-primary text-text-primary rounded-lg font-semibold transition-colors hover:bg-primary-600">
            커리큘럼으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { progressPercent, unlocked, remainingTries, blockers, maxReachedSeconds, subjectId, videoParts } = lessonStatus;
  
  // 🔍 디버깅: 서버에서 받은 데이터 확인
  console.log('🔍 [LessonPage] lessonStatus:', {
    lessonId,
    progressPercent,
    maxReachedSeconds,
    videoParts: videoParts?.length
  });
  
  // 🎯 실제 표시할 진도율: 낙관적 상태 우선, 없으면 서버 상태
  const displayProgressPercent = optimisticProgress?.progressPercent ?? progressPercent;

  // 비디오 재생 URL (Supabase signed URL)
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | undefined>();
  const signedUrlRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const videoPartId = videoParts?.[0]?.id;
  const rawVideoUrl = videoParts?.[0]?.videoUrl;

  useEffect(() => {
    if (!videoPartId) return;

    // 이미 절대 URL인 경우 (Supabase 대시보드에서 직접 입력한 URL)
    if (rawVideoUrl?.startsWith('http')) {
      setSignedVideoUrl(rawVideoUrl);
      return;
    }

    // API에서 signed URL 발급
    const fetchSignedUrl = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${apiUrl}/media/videos/${videoPartId}/signed-url`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success && json.data?.signedUrl) {
          setSignedVideoUrl(json.data.signedUrl);
        }
      } catch (error) {
        console.error('[LessonPage] Signed URL 발급 실패:', error);
      }
    };

    fetchSignedUrl();

    // 90분마다 signed URL 갱신 (2시간 만료 대비)
    signedUrlRefreshRef.current = setInterval(fetchSignedUrl, 90 * 60 * 1000);

    return () => {
      if (signedUrlRefreshRef.current) {
        clearInterval(signedUrlRefreshRef.current);
      }
    };
  }, [videoPartId, rawVideoUrl]);

  return (
    <div className="min-h-screen py-4 px-4 bg-bg-primary">
      <div className="max-w-7xl mx-auto">
      {/* 상단 헤더 */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm mb-4">
            <Link href="/curriculum" className="text-primary hover:text-primary-600 font-medium transition-colors">
            커리큘럼
          </Link>
            <span className="text-text-tertiary">→</span>
            <span className="text-text-primary font-medium">
            레슨 {lessonId}
          </span>
        </nav>

          <div className="bg-surface border border-border rounded-xl p-5">
            <h1 className="text-2xl font-bold text-text-primary mb-3">레슨 {lessonId}</h1>
            <div className="flex items-center gap-4 mb-4">
            <StatusBadge 
              status={
                !unlocked ? 'locked' : 
                displayProgressPercent >= 100 ? 'passed' :
                displayProgressPercent > 0 ? 'in-progress' : 'available'
              } 
            />
              <span className="text-sm font-medium text-text-secondary">
              진도율 {Math.round(displayProgressPercent)}%
            </span>
        </div>

            <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden border border-border">
          <div 
                className="h-full bg-primary rounded-full transition-[width] duration-300 ease-linear"
            style={{ width: `${Math.min(displayProgressPercent, 100)}%` }}
          />
            </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section - DO NOT MODIFY INTERNAL UI */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-xl overflow-hidden">
          <VideoPlayer
            src={signedVideoUrl}
            title={`레슨 ${lessonId}`}
            maxReachedSeconds={maxReachedSeconds || 0}
            videoDuration={0} // VideoPlayer가 로드 후 실제 duration을 onProgress로 전달
            onProgress={(data) => {
              console.log('🎯 [LessonPage] VideoPlayer onProgress:', data);
              handleVideoProgress(data.maxReachedSeconds, data.videoDuration);
            }}
            autoPlay={false}
          />
            </div>
        </div>

        {/* 사이드바 */}
          <div className="flex flex-col gap-4">
          {/* 레슨 진행 정보 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-lg font-bold text-text-primary mb-4">학습 진행 상황</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">현재 진도율</span>
                  <span className="text-base font-bold text-text-primary">
                  {Math.round(displayProgressPercent)}%
                </span>
              </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">학습 상태</span>
                  <span className="text-base font-semibold text-text-primary">
                  {displayProgressPercent >= 90 ? '완료' : '진행 중'}
                </span>
              </div>
            </div>
          </div>

          {/* 다음 레슨 정보 */}
          {!nextLoading && nextAvailable?.lock && nextAvailable.blockedBy && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h3 className="text-lg font-bold text-text-primary mb-4">다음 레슨 상태</h3>
                <div className="bg-bg-primary border border-border rounded-lg p-4">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">{nextAvailable.blockedBy.lessonTitle}</strong> 완료 후 
                    다음 레슨이 해금됩니다.
                  </p>
              </div>
            </div>
          )}

          {/* 진도 차단 사유 */}
          {blockers && blockers.length > 0 && (
              <div className="bg-surface border border-error rounded-xl p-5">
                <h3 className="text-lg font-bold text-error mb-4">접근 제한</h3>
                <div className="flex flex-col gap-2">
                {blockers.map((blocker, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-error-bg border border-error rounded-lg">
                      <span className="text-lg flex-shrink-0">⚠️</span>
                      <span className="text-sm text-error">
                      {blocker.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 과목 시험 안내 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-lg font-bold text-text-primary mb-4">💡 시험 안내</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                과목의 <strong className="text-text-primary">모든 레슨</strong>을 90% 이상 완료하면<br/>
                <Link href="/curriculum" className="text-primary hover:text-primary-600 font-medium underline transition-colors">
                  커리큘럼 페이지
                </Link>에서 시험을 응시할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
