'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import type Player from 'video.js/dist/types/player';

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
 * - SeekBar 제한: 수강한 구간만 이동 가능 (method #1: snap-back)
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
  const playerRef = useRef<Player | null>(null);
  
  // ✅ No-skip forward logic state
  const maxWatchedTimeRef = useRef(maxReachedSeconds || 0);
  const isUserSeekingRef = useRef(false);
  const FORWARD_TOLERANCE = 2; // seconds
  
  const [isReady, setIsReady] = useState(false);

  // Update maxWatchedTime when props change
  useEffect(() => {
    if (maxReachedSeconds > maxWatchedTimeRef.current) {
      maxWatchedTimeRef.current = maxReachedSeconds;
    }
  }, [maxReachedSeconds]);

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
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      console.log('🎬 [VideoPlayer] Initializing Video.js player');
      
      const videoElement = videoRef.current;
      
      const player = videojs(videoElement, {
        controls: true,
        autoplay: autoPlay,
        preload: 'metadata',
        fluid: true,
        responsive: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          volumePanel: {
            inline: false
          }
        }
      });

      playerRef.current = player;

      // ========================================
      // No-skip forward logic (method #1)
      // ========================================

      // 1. timeupdate event: track watched progress
      player.on('timeupdate', () => {
        if (!player) return;
        
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;

        // Only update maxWatchedTime during normal playback (not seeking)
        if (!isUserSeekingRef.current) {
          const timeDiff = currentTime - maxWatchedTimeRef.current;
          
          // If moving forward smoothly (within tolerance)
          if (timeDiff > 0 && timeDiff < FORWARD_TOLERANCE) {
            maxWatchedTimeRef.current = currentTime;
            
            // Call onProgress callback
            if (onProgress) {
              onProgress({
                currentTime,
                maxReachedSeconds: currentTime,
                videoDuration: duration
              });
            }
            
            console.log('📊 [VideoPlayer] Progress updated:', {
              currentTime: currentTime.toFixed(2),
              maxWatched: maxWatchedTimeRef.current.toFixed(2)
            });
          }
        }
      });

      // 2. seeking event: prevent forward seeking beyond maxWatchedTime
      player.on('seeking', () => {
        if (!player) return;
        
        isUserSeekingRef.current = true;
        const currentTime = player.currentTime() || 0;
        const maxAllowed = maxWatchedTimeRef.current + 0.1;

        // If trying to seek beyond watched area, snap back
        if (currentTime > maxAllowed) {
          console.warn('🔒 [VideoPlayer] Forward seek blocked, snapping back', {
            requested: currentTime.toFixed(2),
            maxWatched: maxWatchedTimeRef.current.toFixed(2)
          });
          
          player.currentTime(maxWatchedTimeRef.current);
        } else {
          console.log('✅ [VideoPlayer] Backward seek allowed', {
            requested: currentTime.toFixed(2),
            maxWatched: maxWatchedTimeRef.current.toFixed(2)
          });
        }
      });

      // 3. seeked event: reset seeking flag
      player.on('seeked', () => {
        isUserSeekingRef.current = false;
        console.log('✅ [VideoPlayer] Seek completed');
      });

      // 4. loadedmetadata: set initial position if resuming
      player.on('loadedmetadata', () => {
        if (!player) return;
        
        const resumeTime = maxReachedSeconds || 0;
        if (resumeTime > 0) {
          console.log('🎯 [VideoPlayer] Resuming from', resumeTime.toFixed(2));
          player.currentTime(resumeTime);
        }
      });

      // 5. pause event: save progress
      player.on('pause', () => {
        if (!player) return;
        
        const currentTime = player.currentTime() || 0;
        const duration = player.duration() || 0;
        
        if (onProgress) {
          onProgress({
            currentTime,
            maxReachedSeconds: Math.max(maxWatchedTimeRef.current, currentTime),
            videoDuration: duration
          });
        }
      });

      player.ready(() => {
        console.log('✅ [VideoPlayer] Player ready');
        setIsReady(true);
      });
    }

    // Cleanup function
    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        console.log('🗑️ [VideoPlayer] Disposing player');
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [videoUrl, autoPlay, maxReachedSeconds, onProgress]);

  return (
    <div data-vjs-player style={{ width: '100%', maxWidth: '100%' }}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
        <p className="vjs-no-js">
          To view this video please enable JavaScript, and consider upgrading to a
          web browser that supports HTML5 video
        </p>
      </video>
    </div>
  );
}
