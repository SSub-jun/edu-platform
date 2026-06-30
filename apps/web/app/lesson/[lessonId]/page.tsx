'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLessonStatus } from '../../../src/hooks/useLessonStatus';
import { useDebouncedProgressPing, getProgressFromLocalStorage } from '../../../src/hooks/useProgressPing';
import { useNextAvailable } from '../../../src/hooks/useNextAvailable';
import VideoPlayer from '../../../src/components/VideoPlayer';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import { getErrorMessage } from '../../../src/utils/errorMap';
import { getStoredLocale, useLocale } from '../../../src/i18n/client';
import { translateStudentText } from '../../../src/i18n/studentTranslations';

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { locale } = useLocale();
  const t = (source: string) => translateStudentText(source, locale);
  
  const { 
    data: lessonStatus, 
    isLoading: statusLoading, 
    error: statusError
  } = useLessonStatus(lessonId);
  
  const { 
    data: nextAvailable, 
    isLoading: nextLoading 
  } = useNextAvailable();
  
  const { debouncedPing, flushPing, flushPingSync } = useDebouncedProgressPing();

  // 🎯 낙관적 UI 업데이트: 로컬 진도율 상태
  const [optimisticProgress, setOptimisticProgress] = useState<{
    maxReachedSeconds: number;
    videoDuration: number;
    progressPercent: number;
  } | null>(null);

  // ⏱️ 마지막 UI 업데이트 시간 추적 (10초 throttle)
  const lastUIUpdateRef = React.useRef<number>(0);

  // 비디오 재생 URL (Supabase signed URL) - Hook 순서 보장을 위해 최상단 배치
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | undefined>();
  const [subtitleTracks, setSubtitleTracks] = useState<Array<{
    id: string;
    locale: string;
    label: string;
    signedUrl: string;
    isDefault?: boolean;
  }>>([]);
  const signedUrlRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ localStorage에서 진도율 복구 (서버보다 높으면 사용)
  useEffect(() => {
    if (lessonId && lessonStatus) {
      const stored = getProgressFromLocalStorage(lessonId);
      if (stored && stored.maxReachedSeconds > (lessonStatus.maxReachedSeconds || 0)) {
        console.log('💾 [LessonPage] Restoring progress from localStorage:', stored);
        setOptimisticProgress({
          maxReachedSeconds: stored.maxReachedSeconds,
          videoDuration: stored.videoDuration,
          progressPercent: stored.videoDuration > 0
            ? (stored.maxReachedSeconds / stored.videoDuration) * 100
            : 0
        });
        // 복구된 진도를 서버에도 전송
        debouncedPing({
          lessonId,
          partId: stored.partId || 'part-1',
          maxReachedSeconds: stored.maxReachedSeconds,
          videoDuration: stored.videoDuration
        });
      }
    }
  }, [lessonId, lessonStatus, debouncedPing]);

  // 컴포넌트 언마운트 시 남은 진도 전송
  useEffect(() => {
    return () => {
      flushPing();
    };
  }, [flushPing]);

  // ✅ 페이지 종료/새로고침 시 sendBeacon으로 확실히 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPingSync();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [flushPingSync]);

  // Supabase signed URL 발급 및 갱신
  const videoPartId = lessonStatus?.videoParts?.[0]?.id;
  const rawVideoUrl = lessonStatus?.videoParts?.[0]?.videoUrl;

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

  useEffect(() => {
    if (!videoPartId) {
      setSubtitleTracks([]);
      return;
    }

    const fetchSubtitles = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const token = localStorage.getItem('accessToken');
        const locale = getStoredLocale();
        const res = await fetch(`${apiUrl}/media/videos/${videoPartId}/subtitles?signed=true`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        const subtitles = Array.isArray(json.data) ? json.data : [];
        const hasSelectedLocale = subtitles.some((subtitle: any) => subtitle.locale === locale);

        setSubtitleTracks(
          subtitles
            .filter((subtitle: any) => subtitle.signedUrl)
            .map((subtitle: any) => ({
              id: subtitle.id,
              locale: subtitle.locale,
              label: subtitle.label,
              signedUrl: subtitle.signedUrl,
              isDefault: hasSelectedLocale
                ? subtitle.locale === locale
                : subtitle.isDefault || subtitle.locale === 'ko',
            })),
        );
      } catch (error) {
        console.error('[LessonPage] 자막 목록 로드 실패:', error);
        setSubtitleTracks([]);
      }
    };

    fetchSubtitles();
  }, [videoPartId]);

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
      <div className="student-page">
        <div className="student-container">
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
      <div className="student-page flex items-center justify-center">
        <div className="student-panel max-w-md border-error p-8 text-center">
          <h3 className="text-xl font-bold text-error mb-3">{t(errorMessage.title)}</h3>
          <p className="text-base text-text-secondary mb-6">{t(errorMessage.description)}</p>
          <div className="flex gap-3">
              <button 
              className="student-button-primary flex-1"
                onClick={() => window.location.reload()}
              >
                {errorMessage.actionLabel ? t(errorMessage.actionLabel) : t('다시 시도')}
              </button>
            <Link href="/curriculum" className="student-button-secondary flex-1">
                {t('커리큘럼으로')}
              </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lessonStatus) {
    return (
      <div className="student-page flex items-center justify-center">
        <div className="student-panel p-10 text-center">
          <h3 className="text-xl font-bold text-text-primary mb-6">{t('레슨을 찾을 수 없습니다')}</h3>
          <Link href="/curriculum" className="student-button-primary">
            {t('커리큘럼으로 돌아가기')}
          </Link>
        </div>
      </div>
    );
  }

  const { progressPercent, unlocked, remainingTries, blockers, maxReachedSeconds, subjectId, videoParts } = lessonStatus;

  // 🎯 실제 표시할 진도율: 낙관적 상태 우선, 없으면 서버 상태
  const displayProgressPercent = optimisticProgress?.progressPercent ?? progressPercent;

  return (
    <div className="student-page">
      <div className="student-container">
      {/* 상단 헤더 */}
        <div className="mb-4 md:mb-6">
          <nav className="mb-3 flex items-center gap-2 text-xs md:mb-4 md:text-sm">
            <Link href="/curriculum" className="font-bold text-info transition-colors hover:text-primary">
            {t('커리큘럼')}
          </Link>
            <span className="text-text-tertiary">→</span>
            <span className="font-medium text-text-primary">
            {t(`레슨 ${lessonId}`)}
          </span>
        </nav>

          <div className="student-panel p-4 md:p-6">
            <div className="mb-3 flex flex-row items-start justify-between gap-3 md:mb-4 md:items-center">
              <div>
                <p className="student-kicker">{t('동영상 학습')}</p>
                <h1 className="student-title mt-1">{t(`레슨 ${lessonId}`)}</h1>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 md:flex-row md:items-center md:gap-3">
            <StatusBadge 
              status={
                !unlocked ? 'locked' : 
                displayProgressPercent >= 100 ? 'passed' :
                displayProgressPercent > 0 ? 'in-progress' : 'available'
              } 
            />
                <span className="text-sm font-black text-text-primary md:text-base">
              {t(`진도율 ${Math.round(displayProgressPercent)}%`)}
            </span>
              </div>
        </div>

            <div className="student-progress-track">
          <div 
                className="student-progress-bar"
            style={{ width: `${Math.min(displayProgressPercent, 100)}%` }}
          />
            </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Video Player Section - DO NOT MODIFY INTERNAL UI */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-lg bg-black shadow-md md:rounded-xl">
          <VideoPlayer
            src={signedVideoUrl}
            title={t(`레슨 ${lessonId}`)}
            subtitles={subtitleTracks}
            maxReachedSeconds={maxReachedSeconds || 0}
            videoDuration={0} // VideoPlayer가 로드 후 실제 duration을 onProgress로 전달
            onProgress={(data) => {
              // watchedSeconds: 진도 인정용 (실제 시청한 최대 시점)
              // positionSeconds: 이어보기용 (현재 재생 헤드 위치)
              console.log('🎯 [LessonPage] VideoPlayer onProgress:', {
                watchedSeconds: data.watchedSeconds,
                positionSeconds: data.positionSeconds,
                videoDuration: data.videoDuration
              });
              // 진도율 계산에는 watchedSeconds 사용 (점프로 인한 오염 방지)
              handleVideoProgress(data.watchedSeconds, data.videoDuration);
            }}
            autoPlay={false}
          />
            </div>
        </div>

        {/* 사이드바 */}
          <div className="flex flex-col gap-4">
          {/* 레슨 진행 정보 */}
            <div className="student-panel p-4 md:p-5">
              <h3 className="mb-3 text-base font-bold text-text-primary md:mb-4 md:text-lg">{t('학습 진행 상황')}</h3>
              <div className="flex flex-col gap-3">
                <div className="student-stat flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">{t('현재 진도율')}</span>
                  <span className="text-base font-bold text-text-primary">
                  {Math.round(displayProgressPercent)}%
                </span>
              </div>
                <div className="student-stat flex justify-between items-center">
                  <span className="text-sm text-text-tertiary">{t('학습 상태')}</span>
                  <span className="text-base font-semibold text-text-primary">
                  {displayProgressPercent >= 90 ? t('완료') : t('진행 중')}
                </span>
              </div>
            </div>
          </div>

          {/* 다음 레슨 정보 */}
          {!nextLoading && nextAvailable?.lock && nextAvailable.blockedBy && (
              <div className="student-panel p-4 md:p-5">
                <h3 className="mb-3 text-base font-bold text-text-primary md:mb-4 md:text-lg">{t('다음 레슨 상태')}</h3>
                <div className="student-muted-box">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-text-primary">{nextAvailable.blockedBy.lessonTitle}</strong> {t('완료 후')}{' '}
                    {t('다음 레슨이 해금됩니다.')}
                  </p>
              </div>
            </div>
          )}

          {/* 진도 차단 사유 */}
          {blockers && blockers.length > 0 && (
              <div className="student-panel border-error p-4 md:p-5">
                <h3 className="mb-3 text-base font-bold text-error md:mb-4 md:text-lg">{t('접근 제한')}</h3>
                <div className="flex flex-col gap-2">
                {blockers.map((blocker, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-lg border border-error bg-error-bg p-3">
                      <span className="text-sm text-error">
                      {blocker.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 과목 시험 안내 */}
            <div className="student-panel p-4 md:p-5">
              <h3 className="mb-3 text-base font-bold text-text-primary md:mb-4 md:text-lg">{t('시험 안내')}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {t('과목의')} <strong className="text-text-primary">{t('모든 레슨')}</strong>{t('을 90% 이상 완료하면')}<br/>
                <Link href="/curriculum" className="text-primary hover:text-primary-600 font-medium underline transition-colors">
                  {t('커리큘럼 페이지')}
                </Link>{t('에서 시험을 응시할 수 있습니다.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
