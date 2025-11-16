'use client';

import { useEffect, useRef } from 'react';
import 'video.js/dist/video-js.css';
import './videojs/CustomSeekBar.css';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src?: string;
  title: string;
  maxReachedSeconds?: number;
  videoDuration?: number;
  onProgress?: (data: { currentTime: number; maxReachedSeconds: number; videoDuration: number }) => void;
  autoPlay?: boolean;
}

/**
 * VideoPlayer - Video.js 기반 비디오 플레이어
 * 
 * 기능:
 * - 이어보기: maxReachedSeconds 위치부터 재생
 * - SeekBar 제한: 수강한 구간만 이동 가능
 * - 진도 추적: maxReachedSeconds 실시간 업데이트
 */
export default function VideoPlayer({
  src,
  title,
  maxReachedSeconds = 0,
  videoDuration = 0,
  onProgress,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);

  const resumeTimeRef = useRef(maxReachedSeconds || 0);
  const maxAllowedRef = useRef(maxReachedSeconds || 0);
  const lastSafeTimeRef = useRef(maxReachedSeconds || 0);
  const seekStartRef = useRef(maxReachedSeconds || 0);

  const isUserSeekingRef = useRef(false);
  const isProgrammaticSeekRef = useRef(false);
  const hasSyncedInitialTimeRef = useRef(false);

  const videoDurationRef = useRef(videoDuration);
  const onProgressRef = useRef(onProgress); // ✅ onProgress를 ref로 관리

  // ✅ maxReachedSeconds props 변경 시 ref 업데이트
  useEffect(() => {
    const resume = maxReachedSeconds || 0;
    resumeTimeRef.current = resume;
    if (resume > maxAllowedRef.current) {
      maxAllowedRef.current = resume;
    }
    if (resume > lastSafeTimeRef.current) {
      lastSafeTimeRef.current = resume;
    }
    console.log('🎯 [VideoPlayer] Props received:', {
      maxReachedSeconds,
      videoDuration,
      src: src?.substring(0, 50) + '...',
    });
  }, [maxReachedSeconds, videoDuration, src]);

  useEffect(() => {
    videoDurationRef.current = videoDuration;
  }, [videoDuration]);

  // ✅ onProgress를 항상 최신 값으로 유지
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // API 서버 URL 추가
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const videoUrl = src ? (src.startsWith('http') ? src : `${apiUrl}${src}`) : undefined;

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

  useEffect(() => {
    if (!videoRef.current || typeof window === 'undefined') return;

    let player: any;
    let watchedOverlay: HTMLElement | null = null;
    let disposed = false;
    let detachKeyboard: (() => void) | null = null;

    const initPlayer = async () => {
      const videojs = (await import('video.js')).default;
      if (!videoRef.current || disposed) return;

      player = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        responsive: true,
        autoplay: autoPlay,
        playbackRates: [1.0],
        userActions: {
          hotkeys: false,
          doubleClick: false,
        },
        sources: [
          {
            src: videoUrl,
            type: 'video/mp4',
          },
        ],
      });

      playerRef.current = player;
      const tech = player.tech?.(true);
      nativeVideoRef.current =
        (tech?.el() as HTMLVideoElement | null) ??
        (player.el()?.querySelector('video') as HTMLVideoElement | null);

      const clampTimeToDuration = (time: number) => {
        const duration = player.duration() || videoDurationRef.current || 0;
        if (!duration || duration <= 0) return Math.max(time, 0);
        return Math.min(Math.max(time, 0), Math.max(duration - 0.2, 0));
      };

      const updateWatchedOverlay = () => {
        if (!watchedOverlay) return;
        const duration = player.duration() || videoDurationRef.current || 0;
        if (!duration) return;
        const maxPct = (maxAllowedRef.current / duration) * 100;
        watchedOverlay.style.width = `${Math.min(maxPct, 100)}%`;
      };

      const forceSeekBoth = (time: number, reason: string) => {
        const playerInstance = playerRef.current;
        const nativeVideo = nativeVideoRef.current;
        if (!playerInstance || !nativeVideo) return;

        const target = clampTimeToDuration(time);
        isProgrammaticSeekRef.current = true;

        try {
          nativeVideo.currentTime = target;
        } catch (err) {
          console.warn('[VideoPlayer] Native seek failed', { reason, err });
        }

        try {
          playerInstance.currentTime(target);
        } catch (err) {
          console.warn('[VideoPlayer] Player seek failed', { reason, err });
        }

        lastSafeTimeRef.current = target;

        window.setTimeout(() => {
          isProgrammaticSeekRef.current = false;
        }, 80);
      };

      const applyInitialSeek = () => {
        if (hasSyncedInitialTimeRef.current) return;
        const duration = player.duration() || 0;
        if (!duration) return;

        const resumeTarget = clampTimeToDuration(resumeTimeRef.current);
        if (resumeTarget <= 0) {
          hasSyncedInitialTimeRef.current = true;
          return;
        }

        console.log('🎯 [VideoPlayer] Initial seek requested:', {
          target: resumeTarget.toFixed(2),
          duration: duration.toFixed(2),
        });

        forceSeekBoth(resumeTarget, 'initial');
        maxAllowedRef.current = Math.max(maxAllowedRef.current, resumeTarget);
        updateWatchedOverlay();
        hasSyncedInitialTimeRef.current = true;
      };

      const guardDrift = (current: number) => {
        const guardTarget = Math.max(resumeTimeRef.current, maxAllowedRef.current);
        if (guardTarget > 0 && current + 0.3 < guardTarget) {
          console.warn('⚠️ [VideoPlayer] Drift detected, restoring position', {
            current: current.toFixed(2),
            guardTarget: guardTarget.toFixed(2),
          });
          forceSeekBoth(guardTarget, 'drift-guard');
          return true;
        }
        return false;
      };

      let previousTime = resumeTimeRef.current || 0;

      const handleTimeUpdate = () => {
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;
        videoDurationRef.current = duration;

        if (isProgrammaticSeekRef.current) {
          previousTime = currentTime;
          lastSafeTimeRef.current = currentTime;
          return;
        }

        if (guardDrift(currentTime)) {
          previousTime = currentTime;
          return;
        }

        const delta = currentTime - previousTime;
        previousTime = currentTime;
        lastSafeTimeRef.current = currentTime;

        if (!isUserSeekingRef.current && delta > 0 && delta < 5 && currentTime > maxAllowedRef.current) {
          maxAllowedRef.current = currentTime;
          updateWatchedOverlay();
          onProgressRef.current?.({
            currentTime,
            maxReachedSeconds: currentTime,
            videoDuration: duration,
          });
        }
      };

      const setupSeekingGuards = () => {
        const handleSeeking = () => {
          if (isProgrammaticSeekRef.current) return;
          isUserSeekingRef.current = true;
          seekStartRef.current = lastSafeTimeRef.current;
        };

        const handleSeeked = () => {
          const currentTime = player.currentTime() || 0;

          if (isProgrammaticSeekRef.current) {
            isUserSeekingRef.current = false;
            lastSafeTimeRef.current = currentTime;
            return;
          }

          const allowed = maxAllowedRef.current + 0.2;
          if (currentTime <= allowed) {
            lastSafeTimeRef.current = currentTime;
            isUserSeekingRef.current = false;
            return;
          }

          const rollback = Math.max(seekStartRef.current, maxAllowedRef.current);
          console.warn('🔒 [VideoPlayer] Seek blocked beyond allowed progress', {
            requested: currentTime.toFixed(2),
            allowed: maxAllowedRef.current.toFixed(2),
            rollback: rollback.toFixed(2),
          });
          forceSeekBoth(rollback, 'seek-guard');
          isUserSeekingRef.current = false;
        };

        player.on('seeking', handleSeeking);
        player.on('seeked', handleSeeked);
      };

      const attachKeyboardGuard = () => {
        const handleKeyDown = (e: Event) => {
          const kbEvent = e as KeyboardEvent;
          const blockedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
          if (blockedKeys.includes(kbEvent.key)) {
            kbEvent.preventDefault();
            kbEvent.stopPropagation();
          }
        };

        player.el()?.addEventListener('keydown', handleKeyDown as EventListener, true);

        return () => {
          player.el()?.removeEventListener('keydown', handleKeyDown as EventListener, true);
        };
      };

      detachKeyboard = attachKeyboardGuard();
      player.on('ratechange', () => {
        if (player.playbackRate() !== 1.0) {
          player.playbackRate(1.0);
        }
      });

      player.on('loadedmetadata', () => {
        const duration = player.duration() || 0;
        videoDurationRef.current = duration;
        updateWatchedOverlay();
        applyInitialSeek();
      });

      player.on('canplay', applyInitialSeek);
      player.one('play', applyInitialSeek);
      player.on('play', () => {
        const guardTarget = Math.max(resumeTimeRef.current, maxAllowedRef.current);
        const current = player.currentTime() || 0;
        if (guardTarget > 0 && current + 0.3 < guardTarget) {
          forceSeekBoth(guardTarget, 'play-ensure');
        }
      });

      player.on('timeupdate', handleTimeUpdate);
      setupSeekingGuards();

      player.ready(() => {
        const progressControl = player.controlBar.progressControl;
        const progressHolder = progressControl?.el()?.querySelector('.vjs-progress-holder');

        if (progressHolder) {
          watchedOverlay = videojs.dom.createEl('div', {
            className: 'vjs-watched-overlay',
          }) as HTMLElement;

          progressHolder.appendChild(watchedOverlay);
          updateWatchedOverlay();
        }
      });

      if (disposed) {
        if (watchedOverlay) {
          watchedOverlay.remove();
          watchedOverlay = null;
        }
        if (detachKeyboard) {
          detachKeyboard();
        }
        if (player && !player.isDisposed?.()) {
          player.dispose();
        }
      }
    };

    initPlayer();

    return () => {
      disposed = true;
      if (watchedOverlay) {
        watchedOverlay.remove();
        watchedOverlay = null;
      }
      if (detachKeyboard) {
        detachKeyboard();
        detachKeyboard = null;
      }
      if (player && !player.isDisposed?.()) {
        player.dispose();
      }
    };
  }, [videoUrl, autoPlay]);

  return (
    <div data-vjs-player className={styles.playerWrapper}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        playsInline
        preload="metadata"
      />
    </div>
  );
}
