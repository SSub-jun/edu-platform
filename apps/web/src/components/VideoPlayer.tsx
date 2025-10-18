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
 * VideoPlayer - Video.js + CustomSeekBar (클램프 방식)
 * 
 * Phase 1: SeekBar 클램프 구현
 * - CustomSeekBar에서 사전 차단
 * - "되돌리기" 로직 없음
 * - 영상 멈춤 방지
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
  const maxReachedRef = useRef(maxReachedSeconds);
  const videoDurationRef = useRef(videoDuration);
  const onProgressRef = useRef(onProgress); // ✅ onProgress를 ref로 관리

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
    // SSR 환경에서는 실행하지 않음
    if (!videoRef.current || typeof window === 'undefined') return;

    // Video.js를 동적으로 로드
    let player: any;
    let watchedOverlay: HTMLElement | null = null;
    
    const initPlayer = async () => {
      const videojs = (await import('video.js')).default;
      
      if (!videoRef.current) return;

      // Video.js 플레이어 초기화
      player = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        responsive: true,
        playbackRates: [1.0], // 🔒 배속 고정
        userActions: {
          hotkeys: false, // 🔒 키보드 단축키 비활성화
          doubleClick: false, // 🔒 더블클릭 풀스크린 비활성화
        },
        sources: [
          {
            src: videoUrl,
            type: 'video/mp4',
          },
        ],
      });

      playerRef.current = player;

      // Watched Overlay 업데이트 함수
      const updateWatchedOverlay = () => {
        if (!watchedOverlay) return;
        const duration = player.duration() || 0;
        if (duration <= 0) return;

        const maxPct = (maxReachedRef.current / duration) * 100;
        watchedOverlay.style.width = `${Math.min(maxPct, 100)}%`;
      };

      // 🔒 SeekBar 클램프 설정
      const setupSeekBarClamp = () => {
        const progressControl = player.controlBar.progressControl;
        const seekBar = progressControl?.seekBar;
        
        if (!seekBar) return;

        // calculateDistance 메서드 오버라이드
        const originalCalculateDistance = seekBar.calculateDistance.bind(seekBar);
        
        seekBar.calculateDistance = function(event: MouseEvent | TouchEvent) {
          const distance = originalCalculateDistance(event);
          const duration = player.duration() || 0;
          
          if (duration <= 0) return distance;

          // maxReached를 비율로 변환 (+ 0.5초 버퍼)
          const maxPct = (maxReachedRef.current + 0.5) / duration;
          
          // 🔒 클램프: 사용자가 미수강 구간 클릭 시 maxReached로 제한
          const clampedDistance = Math.min(distance, maxPct);
          
          // 디버그 로그 (클램프 발생 시에만)
          if (distance > maxPct) {
            console.log('🔒 [SeekBar] Clamped:', {
              requested: `${(distance * 100).toFixed(1)}%`,
              allowed: `${(maxPct * 100).toFixed(1)}%`,
              maxReached: maxReachedRef.current.toFixed(2),
            });
          }
          
          return clampedDistance;
        };
      };

      // ✅ Watched Overlay 생성 (진행바에 파란색 영역 표시)
      player.ready(() => {
        const progressControl = player.controlBar.progressControl;
        const progressHolder = progressControl?.el()?.querySelector('.vjs-progress-holder');
        
        if (progressHolder) {
          watchedOverlay = videojs.dom.createEl('div', {
            className: 'vjs-watched-overlay',
          }) as HTMLElement;
          
          progressHolder.appendChild(watchedOverlay);
          
          // 초기 오버레이 업데이트
          updateWatchedOverlay();
        }

        // 🔒 SeekBar 클램프: 진행바 클릭/드래그 제한
        setupSeekBarClamp();
      });

      // 🔒 키보드 이벤트 차단 (화살표, 숫자키)
      const handleKeyDown = (e: Event) => {
        const kbEvent = e as KeyboardEvent;
        const blockedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        if (blockedKeys.includes(kbEvent.key)) {
          kbEvent.preventDefault();
          kbEvent.stopPropagation();
        }
      };

      player.el()?.addEventListener('keydown', handleKeyDown as EventListener, true);

      // 🔒 배속 강제 고정
      player.on('ratechange', () => {
        if (player.playbackRate() !== 1.0) {
          player.playbackRate(1.0);
        }
      });

      // 📊 Metadata 로드 완료: 이어보기
      player.on('loadedmetadata', () => {
        const duration = player.duration() || 0;
        videoDurationRef.current = duration;

        // 이어보기: maxReached 위치로 이동
        if (maxReachedRef.current > 0 && maxReachedRef.current < duration) {
          player.currentTime(maxReachedRef.current);
        }

        // Watched Overlay 업데이트
        updateWatchedOverlay();
      });

      // 📊 timeupdate: maxReached 갱신 (정상 재생 시에만)
      let lastTime = 0;
      let updateCount = 0;

      player.on('timeupdate', () => {
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;

        // ✅ 조건: 연속 재생 (5초 이내 점프) && currentTime > maxReached
        const timeDiff = currentTime - lastTime;

        // 조건 완화: 2초 → 5초 (초기 로딩/버퍼링 고려)
        if (timeDiff > 0 && timeDiff < 5 && currentTime > maxReachedRef.current) {
          const oldMax = maxReachedRef.current;
          maxReachedRef.current = currentTime;
          videoDurationRef.current = duration;

          console.log('✅ [VideoPlayer] Progress updated:', {
            from: oldMax.toFixed(2),
            to: maxReachedRef.current.toFixed(2),
            duration: duration.toFixed(2),
            progressPercent: ((currentTime / duration) * 100).toFixed(2),
          });

          // Watched Overlay 업데이트
          updateWatchedOverlay();

          // 🎯 서버에 진도율 전송 → LessonPage에서 즉시 로컬 상태 업데이트
          onProgressRef.current?.({
            currentTime,
            maxReachedSeconds: currentTime,
            videoDuration: duration,
          });
        }

        lastTime = currentTime;
      });
    };

    initPlayer();

    // Cleanup
    return () => {
      if (watchedOverlay) {
        watchedOverlay.remove();
        watchedOverlay = null;
      }
      if (player && !player.isDisposed?.()) {
        player.dispose();
      }
    };
  }, [videoUrl]); // ✅ videoUrl만 의존성으로 설정 (불필요한 재초기화 방지)

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
