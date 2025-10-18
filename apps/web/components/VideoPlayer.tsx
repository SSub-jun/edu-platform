'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src?: string;
  title: string;
  onProgress?: (playedMs: number) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  autoPlay?: boolean;
  debugMode?: boolean; // 개발용: 빠른 재생으로 테스트
}

export default function VideoPlayer({
  src,
  title,
  onProgress,
  onTimeUpdate,
  autoPlay = false,
  debugMode = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playedMs, setPlayedMs] = useState(0);
  const lastTimeRef = useRef(0);

  // 재생 시간 추적
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;
      
      setCurrentTime(current);
      
      // 진행된 시간(ms) 계산
      if (current > lastTimeRef.current) {
        const progressMs = (current - lastTimeRef.current) * 1000;
        const newPlayedMs = playedMs + progressMs;
        setPlayedMs(newPlayedMs);
        
        // 콜백 호출
        onProgress?.(progressMs);
        onTimeUpdate?.(current, total);
      }
      
      lastTimeRef.current = current;
    }
  }, [playedMs, onProgress, onTimeUpdate]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 개발 모드: 더미 비디오 진행 시뮬레이션
  useEffect(() => {
    if (debugMode && !src) {
      const interval = setInterval(() => {
        const progressMs = 1000; // 1초씩 진행
        setPlayedMs(prev => prev + progressMs);
        setCurrentTime(prev => {
          const newTime = prev + 1;
          onTimeUpdate?.(newTime, 300); // 5분 더미 비디오
          return newTime > 300 ? 0 : newTime; // 5분 후 리셋
        });
        onProgress?.(progressMs);
      }, debugMode ? 100 : 1000); // 디버그 모드에서는 빠르게

      return () => clearInterval(interval);
    }
  }, [debugMode, src, onProgress, onTimeUpdate]);

  // 실제 비디오가 없으면 더미 플레이어 표시
  if (!src) {
    return (
      <div className={styles.dummyPlayer}>
        <div className={styles.dummyContent}>
          <div className={styles.dummyIcon}>▶️</div>
          <h3 className={styles.dummyTitle}>{title}</h3>
          <p className={styles.dummyDescription}>
            {debugMode ? '디버그 모드: 자동 진행 중...' : '비디오 콘텐츠가 준비 중입니다'}
          </p>
          
          {debugMode && (
            <div className={styles.dummyProgress}>
              <div className={styles.progressInfo}>
                <span>재생 시간: {formatTime(currentTime)}</span>
                <span>누적 재생: {Math.round(playedMs / 1000)}초</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.videoContainer}>
      <video
        ref={videoRef}
        src={src}
        className={styles.video}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        autoPlay={autoPlay}
        preload="metadata"
      >
        비디오를 지원하지 않는 브라우저입니다.
      </video>

      <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={handlePlayPause}
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div 
          className={styles.progressContainer}
          onClick={handleSeek}
        >
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className={styles.volumeContainer}>
          <span className={styles.volumeIcon}>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeSlider}
            aria-label="음량 조절"
          />
        </div>
      </div>

      {debugMode && (
        <div className={styles.debugInfo}>
          <div>누적 재생 시간: {Math.round(playedMs / 1000)}초</div>
          <div>현재 재생 위치: {formatTime(currentTime)}</div>
          <div>진행률: {Math.round(progressPercent)}%</div>
        </div>
      )}
    </div>
  );
}

