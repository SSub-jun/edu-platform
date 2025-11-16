'use client';

import { useEffect, useRef } from 'react';
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
    hasSyncedInitialTimeRef.current = false;
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const clampTimeToDuration = (time: number) => {
      const duration = video.duration || videoDurationRef.current || 0;
      if (!duration || duration <= 0) return Math.max(time, 0);
      return Math.min(Math.max(time, 0), Math.max(duration - 0.2, 0));
    };

    const forceSeek = (time: number, reason: string) => {
      const target = clampTimeToDuration(time);
      isProgrammaticSeekRef.current = true;
      try {
        video.currentTime = target;
      } catch (err) {
        console.warn('[VideoPlayer] forceSeek failed', { reason, err });
      }
      lastSafeTimeRef.current = target;
      window.setTimeout(() => {
        isProgrammaticSeekRef.current = false;
      }, 60);
    };

    const applyInitialSeek = (reason: string) => {
      if (hasSyncedInitialTimeRef.current) return;
      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;

      const resumeTarget = clampTimeToDuration(resumeTimeRef.current);
      if (resumeTarget <= 0) {
        hasSyncedInitialTimeRef.current = true;
        return;
      }

      console.log('🎯 [VideoPlayer] Initial seek requested:', {
        reason,
        target: resumeTarget.toFixed(2),
        duration: duration.toFixed(2),
      });

      forceSeek(resumeTarget, reason);
      maxAllowedRef.current = Math.max(maxAllowedRef.current, resumeTarget);
      hasSyncedInitialTimeRef.current = true;
    };

    const guardDrift = (current: number) => {
      const guardTarget = Math.max(resumeTimeRef.current, maxAllowedRef.current);
      if (guardTarget > 0 && current + 0.3 < guardTarget) {
        console.warn('⚠️ [VideoPlayer] Drift detected, restoring position', {
          current: current.toFixed(2),
          guardTarget: guardTarget.toFixed(2),
        });
        forceSeek(guardTarget, 'drift-guard');
        return true;
      }
      return false;
    };

    let previousTime = resumeTimeRef.current || 0;

    const handleLoadedMetadata = () => {
      videoDurationRef.current = video.duration || 0;
      applyInitialSeek('loadedmetadata');
    };

    const handleLoadedData = () => {
      applyInitialSeek('loadeddata');
    };

    const handleCanPlay = () => {
      applyInitialSeek('canplay');
    };

    const handlePlay = () => {
      const guardTarget = Math.max(resumeTimeRef.current, maxAllowedRef.current);
      const current = video.currentTime || 0;
      if (guardTarget > 0 && current + 0.3 < guardTarget) {
        forceSeek(guardTarget, 'play-ensure');
      }
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime || 0;
      const duration = video.duration || 0;
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
        onProgressRef.current?.({
          currentTime,
          maxReachedSeconds: currentTime,
          videoDuration: duration,
        });
      }
    };

    const handleSeeking = () => {
      if (isProgrammaticSeekRef.current) return;
      isUserSeekingRef.current = true;
      seekStartRef.current = lastSafeTimeRef.current;
    };

    const handleSeeked = () => {
      const currentTime = video.currentTime || 0;

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
      forceSeek(rollback, 'seek-guard');
      isUserSeekingRef.current = false;
    };

    const handlePause = () => {
      const currentTime = video.currentTime || 0;
      lastSafeTimeRef.current = currentTime;
      onProgressRef.current?.({
        currentTime,
        maxReachedSeconds: Math.max(maxAllowedRef.current, currentTime),
        videoDuration: video.duration || videoDurationRef.current || 0,
      });
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('pause', handlePause);

    // Auto play when requested
    if (autoPlay) {
      video.play().catch(() => {
        /* ignore auto play block */
      });
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoUrl, autoPlay]);

  return (
    <div data-vjs-player className={styles.playerWrapper}>
      <video
        ref={videoRef}
        className={styles.html5Video}
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
      />
    </div>
  );
}
