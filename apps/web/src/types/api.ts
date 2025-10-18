// 기본 타입 정의
export interface BaseResponse {
  success: boolean;
  message?: string;
}

// 사용자/커리큘럼 관련
export interface Subject {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  subjectId: string;
  progressPercent: number;
  status: 'locked' | 'available' | 'passed';
  remainingTries: number;
  totalDurationMs: number;
}

export interface CurriculumItem {
  subject: Subject;
  lessons: Lesson[];
  remainingDays: number;
}

export interface CurriculumResponse extends BaseResponse {
  data: CurriculumItem[];
}

// 진도 관련
export interface LessonStatus {
  lessonId: string;
  progressPercent: number;
  unlocked: boolean;
  remainingTries: number;
  maxReachedSeconds?: number; // 사용자가 도달한 최대 시청 시점 (초)
  subjectId?: string; // 과목 ID
  blockers?: Array<{
    type: 'prevNotCompleted' | 'period' | 'notAssigned' | 'examNotPassed';
    lessonId?: string;
    lessonTitle?: string;
    message: string;
  }>;
  videoParts?: Array<{
    id: string;
    title: string;
    videoUrl: string | null;
    order: number;
  }>;
}

export interface LessonStatusResponse extends BaseResponse {
  data: LessonStatus;
}

export interface ProgressPingRequest {
  lessonId: string;
  partId?: string;
  maxReachedSeconds: number;
  videoDuration: number;
  playedMs?: number; // 하위 호환용 (deprecated)
}

export interface ProgressPingResponse extends BaseResponse {
  data: {
    progressPercent: number; // 레슨 진도율 (0.0 ~ 100.0)
    maxReachedSeconds: number; // 업데이트된 최대 시청 시점 (초)
    lessonProgressPercent: number; // 레슨 진도율 (동일)
    subjectProgressEstimate: number; // 과목 진도 추정치
  };
}

export interface NextAvailableItem {
  subjectId: string;
  subjectName: string;
  lessonId: string;
  lessonTitle: string;
  partId: string;
  partTitle: string;
}

export interface NextAvailableResponse extends BaseResponse {
  data: {
    nextSubject: NextAvailableItem | null;
    currentSubject: NextAvailableItem | null;
    lock: boolean;
    blockedBy: {
      lessonId: string;
      lessonTitle: string;
      order: number;
    } | null;
  };
}

// 시험 관련
export interface ExamQuestion {
  id: string;
  content: string;    // API에서 실제로 반환하는 필드명
  choices: string[];  // 단순 문자열 배열로 변경
}

export interface StartExamResponse extends BaseResponse {
  data: {
    attemptId: string;
    lessonId: string;
    questions: ExamQuestion[];
  };
}

export interface ExamAnswer {
  questionId: string;
  choiceIndex: number;
}

export interface SubmitExamRequest {
  answers: ExamAnswer[];
}

export interface SubmitExamResponse extends BaseResponse {
  data: {
    attemptId: string;
    examScore: number;
    subjectProgress: number;
    finalScore: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
  };
}

export interface RetakeExamResponse extends BaseResponse {
  data: {
    allowed: boolean;
    cycle: number;
    tryIndex: number;
    remainingTries: number;
    message?: string;
  };
}

// 에러 응답
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  statusCode: number;
}

// API 에러 코드 타입
export type ApiErrorCode = 
  // 403 errors
  | 'NOT_ASSIGNED_TO_SUBJECT'
  | 'LESSON_NOT_ACTIVE_FOR_COMPANY'
  
  // 422 errors  
  | 'PROGRESS_NOT_ENOUGH'
  | 'ATTEMPT_LIMIT'
  | 'ALREADY_PASSED'
  | 'INVALID_ANSWER_SET'
  | 'ATTEMPT_NOT_CLOSED'
  | 'PERIOD_NOT_ACTIVE'
  | 'NOT_ENOUGH_QUESTIONS'
  
  // 409 errors
  | 'DUPLICATE_SUBMISSION'
  
  // 404 errors
  | 'LESSON_NOT_FOUND'
  | 'ATTEMPT_NOT_FOUND'
  
  // 401 errors
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED';

// 유틸리티 타입 가드
export function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.success === false && response.error;
}

export function getErrorCode(error: any): ApiErrorCode | null {
  if (isErrorResponse(error?.response?.data)) {
    return error.response.data.error.code as ApiErrorCode;
  }
  return null;
}

