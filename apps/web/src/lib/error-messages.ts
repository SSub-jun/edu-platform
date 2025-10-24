export const ERROR_MESSAGES = {
  // 403 Forbidden
  NOT_ASSIGNED_TO_SUBJECT: '이 과목에 배정되지 않았습니다.',
  LESSON_NOT_ACTIVE_FOR_COMPANY: '회사 커리큘럼에 포함되지 않은 레슨입니다.',
  
  // 422 Unprocessable Entity
  PROGRESS_NOT_ENOUGH: '진도가 90% 이상이어야 시험을 볼 수 있습니다.',
  ATTEMPT_LIMIT: '해당 회차에서 3회 응시 제한을 초과했습니다.',
  ALREADY_PASSED: '이미 합격한 시험입니다.',
  INVALID_ANSWER_SET: '답안이 올바르지 않습니다. 다시 확인해주세요.',
  ATTEMPT_NOT_CLOSED: '현재 회차가 종료되지 않아 재응시할 수 없습니다.',
  PERIOD_NOT_ACTIVE: '수강 기간이 아닙니다.',
  
  // 409 Conflict
  DUPLICATE_SUBMISSION: '이미 제출된 시도입니다.',
  
  // 기본 메시지
  DEFAULT: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
} as const;

export const getErrorMessage = (error: any): string => {
  // Axios 에러 응답에서 메시지 추출
  if (error?.response?.data?.message) {
    const errorCode = error.response.data.message;
    return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.DEFAULT;
  }
  
  // HTTP 상태 코드별 기본 메시지
  if (error?.response?.status) {
    switch (error.response.status) {
      case 401:
        return '로그인이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 데이터를 찾을 수 없습니다.';
      case 422:
        return '요청 조건을 만족하지 않습니다.';
      case 409:
        return '중복된 요청입니다.';
      case 500:
        return '서버 오류가 발생했습니다.';
      default:
        return ERROR_MESSAGES.DEFAULT;
    }
  }
  
  // 네트워크 에러
  if (error?.message === 'Network Error') {
    return '네트워크 연결을 확인해주세요.';
  }
  
  return ERROR_MESSAGES.DEFAULT;
};









