'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src?: string;
  title: string;
  maxReachedSeconds?: number;
  videoDuration?: number;
  onProgress?: (data: {
    currentTime: number;
    maxReachedSeconds: number;
    videoDuration: number;
    positionSeconds: number;
    watchedSeconds: number;
  }) => void;
  autoPlay?: boolean;
}

// 설정값 (컴포넌트 외부에 상수로 선언)
const DELTA_TOLERANCE = 1.5;      // 연속 재생 판정: 이 이하면 정상 재생으로 인정 (초)
const FORWARD_EPSILON = 0.5;      // 앞으로 이동 허용 오차 (초)
const REVERT_COOLDOWN_MS = 300;   // 되돌리기 후 업데이트 금지 시간 (ms)
const INITIAL_LOAD_RETRY_DELAY_MS = 900;

/**
 * VideoPlayer - Video.js 기반 비디오 플레이어 (안정화 버전)
 *
 * 핵심 안정화 기능:
 * 1. seek-lock + lastValidTime: seeking 연타 레이스 방지
 * 2. 연속 재생(Δt) 조건: 점프가 아닌 정상 재생일 때만 진도 인정
 * 3. seeking 중 모든 업데이트 금지
 * 4. UI 레벨 progress bar 클릭 차단
 * 5. watchedSeconds/positionSeconds 분리
 */
export default function VideoPlayer({
  src,
  maxReachedSeconds = 0,
  onProgress,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);

  // ============================================
  // 핵심 상태 변수
  // ============================================
  const maxWatchedTimeRef = useRef(maxReachedSeconds || 0);
  const lastValidTimeRef = useRef(maxReachedSeconds || 0);
  const prevTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const isRevertingRef = useRef(false);
  const revertCooldownRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRetryCountRef = useRef(0);
  const initialLoadRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loadState, setLoadState] = useState<'loading' | 'retrying' | 'ready' | 'error'>(
    src ? 'loading' : 'ready',
  );

  // 🔑 onProgress를 ref로 관리 (의존성 배열에서 제거하기 위함)
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // 🔑 maxReachedSeconds를 ref로도 관리 (이벤트 핸들러에서 최신값 참조)
  const maxReachedSecondsRef = useRef(maxReachedSeconds);
  maxReachedSecondsRef.current = maxReachedSeconds;

  // API 서버 URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const videoUrl = src ? (src.startsWith('http') ? src : `${apiUrl}${src}`) : undefined;

  const retryVideoLoad = () => {
    const player = playerRef.current;
    if (!player || player.isDisposed() || !videoUrl) return;

    setLoadState('retrying');
    player.controls(false);
    player.error(undefined);
    player.src({ src: videoUrl, type: 'video/mp4' });
    player.load();
  };

  // props에서 maxReachedSeconds 변경 시 동기화
  useEffect(() => {
    if (maxReachedSeconds > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = maxReachedSeconds;
      lastValidTimeRef.current = maxReachedSeconds;
    }
  }, [maxReachedSeconds]);

  // 🔑 플레이어 초기화 (videoUrl이 있을 때 한 번만)
  useEffect(() => {
    // videoUrl이 없거나 이미 플레이어가 있으면 스킵
    if (!videoUrl) {
      return;
    }

    setLoadState('loading');
    initialLoadRetryCountRef.current = 0;

    // 이미 플레이어가 있으면 소스만 변경
    if (playerRef.current && !playerRef.current.isDisposed()) {
      console.log('🔄 [VideoPlayer] Updating source', { videoUrl });
      playerRef.current.controls(false);
      playerRef.current.error(undefined);
      playerRef.current.src({ src: videoUrl, type: 'video/mp4' });
      playerRef.current.load();
      // 상태 초기화
      maxWatchedTimeRef.current = maxReachedSecondsRef.current || 0;
      lastValidTimeRef.current = maxReachedSecondsRef.current || 0;
      prevTimeRef.current = 0;
      isSeekingRef.current = false;
      isRevertingRef.current = false;
      return;
    }

    // video element가 없으면 스킵
    if (!videoRef.current) {
      return;
    }

    console.log('🎬 [VideoPlayer] Initializing player', { videoUrl });

    const videoElement = videoRef.current;

    const player = videojs(videoElement, {
      controls: true,
      autoplay: autoPlay,
      preload: 'metadata',
      fluid: true,
      responsive: true,
      controlBar: {
        volumePanel: { inline: false },
        playbackRateMenuButton: false  // 배속 메뉴 비활성화
      },
      sources: [{ src: videoUrl, type: 'video/mp4' }]
    });

    playerRef.current = player;
    player.controls(false);

    // ============================================
    // UI 레벨 progress bar 클릭 차단 (해결책 B)
    // ============================================
    player.ready(() => {
      const playerWithControls = player as Player & {
        controlBar?: {
          progressControl?: {
            el: () => HTMLElement;
          };
        };
      };

      const progressControl = playerWithControls.controlBar?.progressControl;
      if (progressControl) {
        const progressEl = progressControl.el();

        progressEl.addEventListener('mousedown', (e: MouseEvent) => {
          const rect = progressEl.getBoundingClientRect();
          const clickRatio = (e.clientX - rect.left) / rect.width;
          const duration = player.duration() || 0;
          const targetTime = clickRatio * duration;
          const maxAllowed = maxWatchedTimeRef.current + FORWARD_EPSILON;

          if (targetTime > maxAllowed) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
      }

      console.log('✅ [VideoPlayer] Player ready');
    });

    // ============================================
    // 0. 초기 로딩 상태: 메타데이터 로드 전 클릭 방지
    // ============================================
    player.one('loadedmetadata', () => {
      if (!player || player.isDisposed()) return;

      setLoadState('ready');
      player.controls(true);
    });

    player.on('error', () => {
      if (!player || player.isDisposed()) return;

      if (initialLoadRetryCountRef.current < 1) {
        initialLoadRetryCountRef.current += 1;
        setLoadState('retrying');
        player.controls(false);

        if (initialLoadRetryTimeoutRef.current) {
          clearTimeout(initialLoadRetryTimeoutRef.current);
        }

        initialLoadRetryTimeoutRef.current = setTimeout(() => {
          if (!playerRef.current || playerRef.current.isDisposed() || !videoUrl) return;

          console.warn('🔄 [VideoPlayer] Retrying initial video load', { videoUrl });
          playerRef.current.error(undefined);
          playerRef.current.src({ src: videoUrl, type: 'video/mp4' });
          playerRef.current.load();
        }, INITIAL_LOAD_RETRY_DELAY_MS);
        return;
      }

      setLoadState('error');
      player.controls(false);
    });

    // ============================================
    // 1. timeupdate: 연속 재생(Δt)일 때만 진도 인정
    // ============================================
    player.on('timeupdate', () => {
      if (!player || player.isDisposed()) return;

      const currentTime = player.currentTime() || 0;
      const duration = player.duration() || 0;

      if (isSeekingRef.current || isRevertingRef.current) {
        return;
      }

      const delta = currentTime - prevTimeRef.current;
      prevTimeRef.current = currentTime;

      const isContinuousPlay = delta > 0 && delta <= DELTA_TOLERANCE;

      if (isContinuousPlay && currentTime > maxWatchedTimeRef.current) {
        maxWatchedTimeRef.current = currentTime;
        lastValidTimeRef.current = currentTime;

        // ref를 통해 최신 콜백 호출
        onProgressRef.current?.({
          currentTime,
          maxReachedSeconds: maxWatchedTimeRef.current,
          videoDuration: duration,
          positionSeconds: currentTime,
          watchedSeconds: maxWatchedTimeRef.current
        });
      } else if (isContinuousPlay) {
        lastValidTimeRef.current = currentTime;
      }
    });

    // ============================================
    // 2. seeking: seek-lock + lastValidTime으로 되돌리기
    // ============================================
    player.on('seeking', () => {
      if (!player || player.isDisposed()) return;

      if (isRevertingRef.current) {
        return;
      }

      isSeekingRef.current = true;
      const targetTime = player.currentTime() || 0;
      const maxAllowed = maxWatchedTimeRef.current + FORWARD_EPSILON;

      if (targetTime > maxAllowed) {

        isRevertingRef.current = true;
        player.currentTime(lastValidTimeRef.current);

        if (revertCooldownRef.current) {
          clearTimeout(revertCooldownRef.current);
        }
        revertCooldownRef.current = setTimeout(() => {
          isRevertingRef.current = false;
          isSeekingRef.current = false;
        }, REVERT_COOLDOWN_MS);
      }
    });

    // ============================================
    // 3. seeked: seeking 플래그 해제
    // ============================================
    player.on('seeked', () => {
      if (!player || player.isDisposed()) return;

      const currentTime = player.currentTime() || 0;

      if (!isRevertingRef.current) {
        isSeekingRef.current = false;
        if (currentTime <= maxWatchedTimeRef.current + FORWARD_EPSILON) {
          lastValidTimeRef.current = currentTime;
          prevTimeRef.current = currentTime;
        }
      }
    });

    // ============================================
    // 4. loadedmetadata: 이어보기 위치 설정
    // ============================================
    player.on('loadedmetadata', () => {
      if (!player || player.isDisposed()) return;

      const resumeTime = maxReachedSecondsRef.current || 0;
      if (resumeTime > 0) {
        console.log('🎯 [VideoPlayer] Resuming from', resumeTime.toFixed(2));
        maxWatchedTimeRef.current = resumeTime;
        lastValidTimeRef.current = resumeTime;
        prevTimeRef.current = resumeTime;
        player.currentTime(resumeTime);
      }
    });

    // ============================================
    // 5. pause: 일시정지 시 진도 저장
    // ============================================
    player.on('pause', () => {
      if (!player || player.isDisposed()) return;
      if (isSeekingRef.current || isRevertingRef.current) return;

      const currentTime = player.currentTime() || 0;
      const duration = player.duration() || 0;

      const safePosition = Math.min(currentTime, maxWatchedTimeRef.current);

      onProgressRef.current?.({
        currentTime: safePosition,
        maxReachedSeconds: maxWatchedTimeRef.current,
        videoDuration: duration,
        positionSeconds: safePosition,
        watchedSeconds: maxWatchedTimeRef.current
      });
    });

    // ============================================
    // 6. ended: 영상 끝까지 시청
    // ============================================
    player.on('ended', () => {
      if (!player || player.isDisposed()) return;

      const duration = player.duration() || 0;

      maxWatchedTimeRef.current = duration;
      lastValidTimeRef.current = duration;

      onProgressRef.current?.({
        currentTime: duration,
        maxReachedSeconds: duration,
        videoDuration: duration,
        positionSeconds: duration,
        watchedSeconds: duration
      });

      console.log('🏁 [VideoPlayer] Video ended, progress = 100%');
    });

    // Cleanup (컴포넌트 언마운트 시에만)
    return () => {
      if (revertCooldownRef.current) {
        clearTimeout(revertCooldownRef.current);
      }
      if (initialLoadRetryTimeoutRef.current) {
        clearTimeout(initialLoadRetryTimeoutRef.current);
      }
      const p = playerRef.current;
      if (p && !p.isDisposed()) {
        console.log('🗑️ [VideoPlayer] Disposing player');
        p.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl, autoPlay]); // 🔑 onProgress, maxReachedSeconds 제거

  // 등록된 영상이 없으면 안내 메시지
  if (!videoUrl) {
    return (
      <div style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        background: '#f9fafb',
        borderRadius: '8px',
        border: '2px dashed #d1d5db',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
          등록된 영상이 없습니다
        </h3>
        <p style={{ color: '#6b7280' }}>
          강사가 영상을 업로드하면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div data-vjs-player className={styles.playerShell}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        playsInline
      >
        <p className="vjs-no-js">
          To view this video please enable JavaScript, and consider upgrading to a
          web browser that supports HTML5 video
        </p>
      </video>
      {loadState !== 'ready' && (
        <div className={styles.loadingOverlay} aria-live="polite">
          <div className={styles.loadingPanel}>
            {loadState === 'error' ? (
              <>
                <h3 className={styles.loadingTitle}>영상을 불러오지 못했습니다</h3>
                <p className={styles.loadingText}>
                  네트워크 상태를 확인한 뒤 다시 시도해주세요.
                </p>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={retryVideoLoad}
                >
                  다시 불러오기
                </button>
              </>
            ) : (
              <>
                <div className={styles.spinner} aria-hidden="true" />
                <h3 className={styles.loadingTitle}>
                  {loadState === 'retrying' ? '영상을 다시 준비 중입니다' : '영상 준비 중입니다'}
                </h3>
                <p className={styles.loadingText}>
                  준비가 끝나면 재생 버튼이 활성화됩니다.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
