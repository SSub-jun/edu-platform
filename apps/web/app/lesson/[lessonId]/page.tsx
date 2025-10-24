'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLessonStatus } from '../../../src/hooks/useLessonStatus';
import { useDebouncedProgressPing } from '../../../src/hooks/useProgressPing';
import { useNextAvailable } from '../../../src/hooks/useNextAvailable';
import VideoPlayer from '../../../src/components/VideoPlayer';
import StatusBadge from '../../../src/components/ui/StatusBadge';
import { getErrorMessage } from '../../../src/utils/errorMap';
import styles from './page.module.css';

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
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonVideo} />
          <div className={styles.skeletonContent} />
        </div>
      </div>
    );
  }

  if (statusError) {
    const errorMessage = getErrorMessage(statusError);
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorCard}>
            <h3 className={styles.errorTitle}>{errorMessage.title}</h3>
            <p className={styles.errorDescription}>{errorMessage.description}</p>
            <div className={styles.errorActions}>
              <button 
                className={styles.button}
                onClick={() => window.location.reload()}
              >
                {errorMessage.actionLabel || '다시 시도'}
              </button>
              <Link href="/curriculum" className={styles.buttonSecondary}>
                커리큘럼으로
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lessonStatus) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h3>레슨을 찾을 수 없습니다</h3>
          <Link href="/curriculum" className={styles.button}>
            커리큘럼으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { progressPercent, unlocked, remainingTries, blockers, maxReachedSeconds, subjectId, videoParts } = lessonStatus;
  
  // 🎯 실제 표시할 진도율: 낙관적 상태 우선, 없으면 서버 상태
  const displayProgressPercent = optimisticProgress?.progressPercent ?? progressPercent;

  // 비디오 URL 추출 (1개 레슨 = 1개 영상)
  const videoUrl: string | undefined = videoParts?.[0]?.videoUrl || undefined; // null을 undefined로 변환
  
  // videoDuration은 VideoPlayer가 비디오를 로드한 후 onProgress 콜백으로 제공됩니다

  return (
    <div className={styles.container}>
      {/* 상단 헤더 */}
      <div className={styles.header}>
        <nav className={styles.breadcrumb}>
          <Link href="/curriculum" className={styles.breadcrumbLink}>
            커리큘럼
          </Link>
          <span className={styles.breadcrumbSeparator}>→</span>
          <span className={styles.breadcrumbCurrent}>
            레슨 {lessonId}
          </span>
        </nav>

        <div className={styles.lessonInfo}>
          <h1 className={styles.lessonTitle}>레슨 {lessonId}</h1>
          <div className={styles.lessonMeta}>
            <StatusBadge 
              status={
                !unlocked ? 'locked' : 
                displayProgressPercent >= 100 ? 'passed' :
                displayProgressPercent > 0 ? 'in-progress' : 'available'
              } 
            />
            <span className={styles.progressText}>
              진도율 {Math.round(displayProgressPercent)}%
            </span>
          </div>
        </div>

        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${Math.min(displayProgressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={styles.content}>
        <div className={styles.videoSection}>
          <VideoPlayer
            src={videoUrl}
            title={`레슨 ${lessonId}`}
            maxReachedSeconds={maxReachedSeconds || 0}
            videoDuration={0} // VideoPlayer가 로드 후 실제 duration을 onProgress로 전달
            onProgress={(data) => handleVideoProgress(data.maxReachedSeconds, data.videoDuration)}
            autoPlay={false}
          />
          
        </div>

        {/* 사이드바 */}
        <div className={styles.sidebar}>
          {/* 레슨 진행 정보 */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>학습 진행 상황</h3>
            <div className={styles.cardContent}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>현재 진도율</span>
                <span className={styles.infoValue}>
                  {Math.round(displayProgressPercent)}%
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>학습 상태</span>
                <span className={styles.infoValue}>
                  {displayProgressPercent >= 90 ? '완료' : '진행 중'}
                </span>
              </div>
            </div>
          </div>

          {/* 다음 레슨 정보 */}
          {!nextLoading && nextAvailable?.lock && nextAvailable.blockedBy && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>다음 레슨 상태</h3>
              <div className={styles.cardContent}>
                <div className={styles.nextLessonInfo}>
                  <p className={styles.blockedMessage}>
                    <strong>{nextAvailable.blockedBy.lessonTitle}</strong> 완료 후 
                    다음 레슨이 해금됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 진도 차단 사유 */}
          {blockers && blockers.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>접근 제한</h3>
              <div className={styles.cardContent}>
                {blockers.map((blocker, index) => (
                  <div key={index} className={styles.blockerItem}>
                    <span className={styles.blockerIcon}>⚠️</span>
                    <span className={styles.blockerMessage}>
                      {blocker.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 과목 시험 안내 */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>💡 시험 안내</h3>
            <div className={styles.cardContent}>
              <p className={styles.examNotice}>
                과목의 <strong>모든 레슨</strong>을 90% 이상 완료하면<br/>
                <Link href="/curriculum" className={styles.curriculumLink}>
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