// 에러 코드 정의
export enum ErrorCode {
  ATTEMPT_LIMIT = 'ATTEMPT_LIMIT',
  ALREADY_PASSED = 'ALREADY_PASSED',
  PROGRESS_NOT_ENOUGH = 'PROGRESS_NOT_ENOUGH',
  LESSON_LOCKED = 'LESSON_LOCKED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// 에러 메시지 인터페이스
export interface ErrorMessage {
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
}

// 에러 코드별 메시지 매핑
const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  [ErrorCode.ATTEMPT_LIMIT]: {
    title: '응시 횟수 초과',
    message: '이번 cycle의 모든 응시 기회를 소진했습니다. 진도율을 90% 이상으로 올려야 다음 cycle에 재응시할 수 있습니다.',
    action: '진도 올리기',
    actionUrl: '/curriculum',
  },
  [ErrorCode.ALREADY_PASSED]: {
    title: '이미 합격',
    message: '이미 이 과목에 합격하셨습니다. 해당 cycle은 종료되었습니다.',
    action: '커리큘럼으로 돌아가기',
    actionUrl: '/curriculum',
  },
  [ErrorCode.PROGRESS_NOT_ENOUGH]: {
    title: '진도율 부족',
    message: '진도율이 90% 미만입니다. 진도율을 90% 이상으로 올려야 시험에 응시할 수 있습니다.',
    action: '진도 올리기',
    actionUrl: '/curriculum',
  },
  [ErrorCode.LESSON_LOCKED]: {
    title: '레슨 잠김',
    message: '이전 레슨을 완료해야 이 레슨에 접근할 수 있습니다.',
    action: '커리큘럼으로 돌아가기',
    actionUrl: '/curriculum',
  },
  [ErrorCode.INVALID_CREDENTIALS]: {
    title: '로그인 실패',
    message: '사용자명 또는 비밀번호가 올바르지 않습니다.',
  },
  [ErrorCode.SESSION_EXPIRED]: {
    title: '세션 만료',
    message: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
    action: '로그인하기',
    actionUrl: '/login',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    title: '오류 발생',
    message: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    action: '이전 화면으로 돌아가기',
  },
};

// HTTP 상태 코드를 에러 코드로 변환
export function getErrorCodeFromStatus(status: number, message?: string): ErrorCode {
  switch (status) {
    case 401:
      return message?.includes('세션') ? ErrorCode.SESSION_EXPIRED : ErrorCode.INVALID_CREDENTIALS;
    case 422:
      if (message?.includes('응시 횟수')) return ErrorCode.ATTEMPT_LIMIT;
      if (message?.includes('이미 합격')) return ErrorCode.ALREADY_PASSED;
      if (message?.includes('진도율')) return ErrorCode.PROGRESS_NOT_ENOUGH;
      if (message?.includes('레슨')) return ErrorCode.LESSON_LOCKED;
      return ErrorCode.UNKNOWN_ERROR;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

// 에러 코드로부터 사용자 친화적 메시지 가져오기
export function getErrorMessage(errorCode: ErrorCode): ErrorMessage {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}

// API 에러 응답을 파싱하여 에러 코드 추출
export function parseApiError(error: any): ErrorCode {
  if (error.response?.status) {
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    return getErrorCodeFromStatus(status, message);
  }
  
  if (error.message?.includes('세션')) return ErrorCode.SESSION_EXPIRED;
  if (error.message?.includes('인증')) return ErrorCode.INVALID_CREDENTIALS;
  
  return ErrorCode.UNKNOWN_ERROR;
}

// 에러 처리 함수
export function handleError(error: any): ErrorMessage {
  const errorCode = parseApiError(error);
  return getErrorMessage(errorCode);
}

// 토스트 메시지용 간단한 에러 메시지
export function getSimpleErrorMessage(error: any): string {
  const errorMessage = handleError(error);
  return errorMessage.message;
}

// 에러 액션 처리
export function handleErrorAction(errorMessage: ErrorMessage, router: any) {
  if (errorMessage.actionUrl) {
    router.push(errorMessage.actionUrl);
  } else if (errorMessage.action === '이전 화면으로 돌아가기') {
    router.back();
  }
}
