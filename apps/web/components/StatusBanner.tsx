'use client';

import { useEffect, useState } from 'react';

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

  const typeStyles = {
    error: 'border-l-error bg-error-bg text-error',
    warning: 'border-l-warning bg-warning-bg text-warning',
    info: 'border-l-info bg-info-bg text-info',
    success: 'border-l-success bg-success-bg text-success',
  };

  return (
    <div 
      className={`flex items-center px-4 py-3 rounded-lg mb-4 border-l-4 ${typeStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-between w-full">
        <span className="flex-1 text-sm font-medium">{message}</span>
        
        <div className="flex items-center gap-2 ml-4">
          {actionLabel && onAction && (
            <button
              className="px-3 py-1.5 border border-current rounded text-[12px] font-medium transition-colors hover:bg-current hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={onAction}
              type="button"
            >
              {actionLabel}
            </button>
          )}
          
          {onClose && (
            <button
              className="flex items-center justify-center w-5 h-5 rounded-full transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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

