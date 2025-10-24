import { toast } from 'react-hot-toast';
import { getErrorMessage, actionHandlers } from '../utils/errorMap';

interface ToastOptions {
  showAction?: boolean;
  autoAction?: boolean;
}

export function useToast() {
  const showSuccess = (message: string, options?: { duration?: number }) => {
    toast.success(message, {
      duration: options?.duration || 3000,
    });
  };

  const showError = (error: any, options: ToastOptions = {}) => {
    const errorMessage = getErrorMessage(error);
    
    // react-hot-toast는 action 속성을 지원하지 않으므로 간단한 에러 메시지만 표시
    toast.error(`${errorMessage.title}: ${errorMessage.description}`, {
      duration: options.showAction ? 6000 : 5000,
    });

    // 자동 액션 실행
    if (options.autoAction && errorMessage.actionType && actionHandlers[errorMessage.actionType]) {
      setTimeout(() => {
        actionHandlers[errorMessage.actionType!]();
      }, 2000);
    }
  };

  const showInfo = (message: string, options?: { duration?: number }) => {
    toast(message, {
      duration: options?.duration || 4000,
      icon: 'ℹ️',
    });
  };

  const showWarning = (message: string, options?: { duration?: number }) => {
    toast(message, {
      duration: options?.duration || 4000,
      icon: '⚠️',
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
  };
}








