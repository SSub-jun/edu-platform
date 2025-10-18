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
    
    if (options.showAction && errorMessage.actionLabel) {
      toast.error(
        `${errorMessage.title}: ${errorMessage.description}`,
        {
          duration: 6000,
          action: errorMessage.actionLabel
            ? {
                label: errorMessage.actionLabel,
                onClick: () => {
                  if (errorMessage.actionType && actionHandlers[errorMessage.actionType]) {
                    actionHandlers[errorMessage.actionType]();
                  }
                },
              }
            : undefined,
        }
      );
    } else {
      toast.error(`${errorMessage.title}: ${errorMessage.description}`, {
        duration: 5000,
      });
    }

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








