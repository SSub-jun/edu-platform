import { ApiErrorCode } from '../types/api';

export interface ErrorMessage {
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: 'progress' | 'contact' | 'retry' | 'login' | 'curriculum';
}

export const errorMessageMap: Record<ApiErrorCode, ErrorMessage> = {
  // 403 - Forbidden 에러
  'NOT_ASSIGNED_TO_SUBJECT': {
    title: '접근 권한이 없습니다',
    description: '이 과목은 회사 커리큘럼에 포함되지 않았습니다.',
    actionLabel: '커리큘럼 확인',
    actionType: 'curriculum',
  },
  
  'LESSON_NOT_ACTIVE_FOR_COMPANY': {
    title: '비활성 레슨입니다',
    description: '이 레슨은 현재 회사에서 활성화되지 않았습니다.',
    actionLabel: '관리자 문의',
    actionType: 'contact',
  },

  // 422 - Validation 에러
  'PROGRESS_NOT_ENOUGH': {
    title: '진도가 부족합니다',
    description: '시험을 보려면 레슨 진도가 90% 이상이어야 합니다.',
    actionLabel: '학습 계속하기',
    actionType: 'progress',
  },
  
  'ATTEMPT_LIMIT': {
    title: '응시 횟수 초과',
    description: '이번 회차의 시험 응시 횟수를 모두 사용했습니다.',
    actionLabel: '커리큘럼으로 돌아가기',
    actionType: 'curriculum',
  },
  
  'ALREADY_PASSED': {
    title: '이미 합격한 시험입니다',
    description: '이 레슨의 시험에 이미 합격하셨습니다.',
    actionLabel: '다음 레슨으로',
    actionType: 'curriculum',
  },
  
  'INVALID_ANSWER_SET': {
    title: '답안이 올바르지 않습니다',
    description: '모든 문항에 답을 선택해주세요.',
    actionLabel: '다시 시도',
    actionType: 'retry',
  },
  
  'ATTEMPT_NOT_CLOSED': {
    title: '진행 중인 시험이 있습니다',
    description: '이전 시험을 완료하고 다시 시도해주세요.',
    actionLabel: '시험 계속하기',
    actionType: 'retry',
  },
  
  'PERIOD_NOT_ACTIVE': {
    title: '수강 기간이 아닙니다',
    description: '현재 회사의 수강 기간에 해당하지 않습니다.',
    actionLabel: '관리자 문의',
    actionType: 'contact',
  },
  
  'NOT_ENOUGH_QUESTIONS': {
    title: '문제은행 부족',
    description: '시험 출제를 위한 문제가 부족합니다.',
    actionLabel: '관리자 문의',
    actionType: 'contact',
  },

  // 409 - Conflict 에러
  'DUPLICATE_SUBMISSION': {
    title: '중복 제출',
    description: '이미 제출된 시험입니다.',
    actionLabel: '결과 확인',
    actionType: 'curriculum',
  },

  // 404 - Not Found 에러
  'LESSON_NOT_FOUND': {
    title: '레슨을 찾을 수 없습니다',
    description: '요청하신 레슨이 존재하지 않습니다.',
    actionLabel: '커리큘럼으로',
    actionType: 'curriculum',
  },
  
  'ATTEMPT_NOT_FOUND': {
    title: '시험 기록을 찾을 수 없습니다',
    description: '해당 시험 기록이 존재하지 않습니다.',
    actionLabel: '새로 시작하기',
    actionType: 'retry',
  },

  // 401 - Unauthorized 에러
  'UNAUTHORIZED': {
    title: '로그인이 필요합니다',
    description: '이 기능을 사용하려면 로그인해주세요.',
    actionLabel: '로그인',
    actionType: 'login',
  },
  
  'TOKEN_EXPIRED': {
    title: '세션이 만료되었습니다',
    description: '다시 로그인해주세요.',
    actionLabel: '로그인',
    actionType: 'login',
  },
};

// 일반적인 HTTP 상태 코드별 기본 메시지
export const defaultErrorMessages: Record<number, ErrorMessage> = {
  400: {
    title: '잘못된 요청',
    description: '요청 내용을 확인해주세요.',
    actionLabel: '다시 시도',
    actionType: 'retry',
  },
  401: {
    title: '인증이 필요합니다',
    description: '로그인 후 이용해주세요.',
    actionLabel: '로그인',
    actionType: 'login',
  },
  403: {
    title: '접근 권한이 없습니다',
    description: '이 기능에 대한 권한이 없습니다.',
    actionLabel: '관리자 문의',
    actionType: 'contact',
  },
  404: {
    title: '페이지를 찾을 수 없습니다',
    description: '요청하신 페이지가 존재하지 않습니다.',
    actionLabel: '홈으로',
    actionType: 'curriculum',
  },
  500: {
    title: '서버 오류',
    description: '일시적인 오류가 발생했습니다.',
    actionLabel: '다시 시도',
    actionType: 'retry',
  },
  503: {
    title: '서비스 이용 불가',
    description: '서버가 일시적으로 사용할 수 없습니다.',
    actionLabel: '잠시 후 다시 시도',
    actionType: 'retry',
  },
};

/**
 * 에러 객체에서 사용자 친화적 메시지를 추출
 */
export function getErrorMessage(error: any): ErrorMessage {
  // API 에러 코드가 있는 경우
  const errorCode = getApiErrorCode(error);
  if (errorCode && errorMessageMap[errorCode]) {
    return errorMessageMap[errorCode];
  }
  
  // HTTP 상태 코드로 폴백
  const statusCode = error?.response?.status;
  if (statusCode && defaultErrorMessages[statusCode]) {
    return defaultErrorMessages[statusCode];
  }
  
  // 네트워크 에러 등 기본 메시지
  return {
    title: '오류가 발생했습니다',
    description: '네트워크 연결을 확인해주세요.',
    actionLabel: '다시 시도',
    actionType: 'retry',
  };
}

/**
 * 에러 객체에서 API 에러 코드 추출
 */
function getApiErrorCode(error: any): ApiErrorCode | null {
  const responseData = error?.response?.data;
  
  if (responseData?.error?.code) {
    return responseData.error.code as ApiErrorCode;
  }
  
  return null;
}

/**
 * 액션 타입에 따른 핸들러 매핑
 */
export const actionHandlers = {
  progress: () => {
    // 현재 레슨 페이지로 이동하여 학습 계속
    const currentPath = window.location.pathname;
    if (currentPath.includes('/exam/')) {
      const lessonId = currentPath.split('/')[3];
      window.location.href = `/lesson/${lessonId}`;
    }
  },
  
  contact: () => {
    // 관리자 문의 (임시로 alert, 실제로는 문의 페이지로 이동)
    alert('관리자에게 문의해주세요.\n이메일: admin@company.com');
  },
  
  retry: () => {
    // 현재 페이지 새로고침
    window.location.reload();
  },
  
  login: () => {
    // 로그인 페이지로 이동
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  },
  
  curriculum: () => {
    // 커리큘럼 페이지로 이동
    window.location.href = '/curriculum';
  },
};








