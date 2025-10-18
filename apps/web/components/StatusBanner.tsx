'use client';

import { useEffect, useState } from 'react';
import styles from './StatusBanner.module.css';

export interface StatusBannerProps {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function StatusBanner({
  type = 'info',
  message,
  actionLabel,
  onAction,
  onClose,
  autoClose = false,
  duration = 5000,
}: StatusBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div 
      className={`${styles.banner} ${styles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.content}>
        <span className={styles.message}>{message}</span>
        
        <div className={styles.actions}>
          {actionLabel && onAction && (
            <button
              className={styles.actionButton}
              onClick={onAction}
              type="button"
            >
              {actionLabel}
            </button>
          )}
          
          {onClose && (
            <button
              className={styles.closeButton}
              onClick={handleClose}
              type="button"
              aria-label="배너 닫기"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 에러 코드별 메시지 매핑
export const getErrorMessage = (statusCode: number, errorCode?: string): string => {
  switch (statusCode) {
    case 403:
      if (errorCode?.includes('NOT_ASSIGNED')) {
        return '이 레슨은 배정되지 않았습니다.';
      }
      return '권한이 없습니다.';
    
    case 422:
      if (errorCode?.includes('NOT_STARTED') || errorCode?.includes('EXPIRED')) {
        return '수강 기간이 아닙니다.';
      }
      if (errorCode?.includes('ATTEMPT_LIMIT')) {
        return '이번 회차 응시 제한에 도달했습니다.';
      }
      if (errorCode?.includes('ALREADY_PASSED')) {
        return '이미 합격한 레슨입니다.';
      }
      if (errorCode?.includes('PROGRESS_REQUIRED')) {
        return '진도율 90% 이상이어야 시험을 응시할 수 있습니다.';
      }
      return '요청을 처리할 수 없습니다.';
    
    case 401:
      return '로그인이 필요합니다.';
    
    default:
      return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
};

