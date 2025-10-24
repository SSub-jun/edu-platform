/**
 * CustomSeekBar - 클램프 방식 Seeking 제한
 * 
 * 핵심 원리:
 * - 사용자 입력(클릭/드래그/터치)을 maxReached 이내로 사전 클램프
 * - "되돌리기"가 아닌 "사전 차단"으로 영상 멈춤 방지
 */

import videojs from 'video.js';

const SeekBar = videojs.getComponent('SeekBar');

class CustomSeekBar extends SeekBar {
  private maxReached: number = 0;
  private videoDuration: number = 0;
  private watchedOverlay: HTMLElement | null = null;

  constructor(player: any, options: any) {
    super(player, options);
    
    // 초기값 설정
    this.maxReached = options.maxReached || 0;
    this.videoDuration = options.videoDuration || 0;
    
    // Watched overlay 생성
    this.createWatchedOverlay();
  }

  /**
   * Watched Overlay 생성 (파란색 영역)
   */
  createWatchedOverlay() {
    this.watchedOverlay = videojs.dom.createEl('div', {
      className: 'vjs-watched-overlay',
    }) as HTMLElement;
    
    // ProgressHolder에 추가
    const progressHolder = this.el().parentElement;
    if (progressHolder) {
      progressHolder.appendChild(this.watchedOverlay);
    }
  }

  /**
   * maxReached 업데이트
   */
  updateMaxReached(newMaxReached: number, newDuration: number) {
    this.maxReached = newMaxReached;
    this.videoDuration = newDuration;
    this.updateWatchedOverlay();
  }

  /**
   * Watched Overlay 너비 업데이트
   */
  updateWatchedOverlay() {
    if (!this.watchedOverlay || this.videoDuration <= 0) return;

    const maxPct = (this.maxReached / this.videoDuration) * 100;
    this.watchedOverlay.style.width = `${Math.min(maxPct, 100)}%`;
  }

  /**
   * 🔒 핵심: Distance 계산 시 클램프
   * 
   * Video.js가 클릭/드래그 위치를 0~1 사이 비율로 계산할 때
   * maxReached를 초과하지 않도록 상한선 적용
   */
  calculateDistance(event: MouseEvent | TouchEvent): number {
    // Video.js SeekBar의 calculateDistance 메서드를 프로토타입에서 직접 호출
    const distance = (SeekBar.prototype as any).calculateDistance.call(this, event);
    
    if (this.videoDuration <= 0) return distance;

    // maxReached를 비율로 변환 (+ 0.5초 버퍼)
    const maxPct = (this.maxReached + 0.5) / this.videoDuration;
    
    // 🔒 클램프: 사용자가 80% 지점 클릭해도 32%로 제한
    const clampedDistance = Math.min(distance, maxPct);
    
    // 디버그 로그 (클램프 발생 시에만)
    if (distance > maxPct) {
      console.log('🔒 [SeekBar] Clamped:', {
        requested: `${(distance * 100).toFixed(1)}%`,
        allowed: `${(maxPct * 100).toFixed(1)}%`,
        maxReached: this.maxReached.toFixed(2),
      });
    }
    
    return clampedDistance;
  }

  /**
   * 🔒 마우스 다운: 클램프 후 처리
   */
  handleMouseDown(event: MouseEvent) {
    // Video.js 내부적으로 calculateDistance 호출하므로
    // 이미 클램프된 값으로 처리됨
    (SeekBar.prototype as any).handleMouseDown.call(this, event);
  }

  /**
   * 🔒 마우스 이동 (드래그): 클램프 후 처리
   */
  handleMouseMove(event: MouseEvent) {
    // 이미 calculateDistance에서 클램프되므로
    // super 호출만으로 충분
    (SeekBar.prototype as any).handleMouseMove.call(this, event);
  }

  /**
   * 🔒 터치 시작: 클램프 후 처리
   */
  handleTouchStart(event: TouchEvent) {
    (SeekBar.prototype as any).handleTouchStart.call(this, event);
  }

  /**
   * 🔒 터치 이동: 클램프 후 처리
   */
  handleTouchMove(event: TouchEvent) {
    (SeekBar.prototype as any).handleTouchMove.call(this, event);
  }

  /**
   * 🔒 더블탭 제스처 비활성화
   */
  handleTap() {
    // 더블탭 무시
    return;
  }

  /**
   * Component dispose
   */
  dispose() {
    if (this.watchedOverlay) {
      this.watchedOverlay.remove();
      this.watchedOverlay = null;
    }
    (SeekBar.prototype as any).dispose.call(this);
  }
}

// Video.js에 컴포넌트 등록
videojs.registerComponent('CustomSeekBar', CustomSeekBar);

export default CustomSeekBar;


