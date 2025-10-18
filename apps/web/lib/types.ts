// API 응답 타입 정의

export interface LessonStatus {
  lessonId: string;
  lessonTitle: string;
  progressPercent: number;
  unlocked: boolean;
  completed: boolean;
  completedAt: string | null;
}

export interface CurriculumLesson {
  lessonId: string;
  lessonTitle: string;
  progressPercent: number;
  status: 'locked' | 'available' | 'passed';
  remainingTries: number;
  remainDays: number;
}

export interface CurriculumSubject {
  subjectId: string;
  subjectTitle: string;
  lessons: CurriculumLesson[];
}

export interface ProgressPingRequest {
  lessonId: string;
  partId?: string;
  playedMs: number;
}

export interface ProgressPingResponse {
  lessonProgressPercent: number;
  subjectProgressEstimate: number;
}

export interface ExamQuestion {
  id: string;
  stem: string;
  choices: string[];
}

export interface ExamStartResponse {
  id: string;
  lessonId: string;
  subjectId: string;
  cycle: number;
  tryIndex: number;
  status: 'inProgress' | 'submitted';
  startedAt: string;
  questions: ExamQuestion[];
}

export interface ExamAnswer {
  questionId: string;
  choiceId: string;
}

export interface ExamSubmitRequest {
  answers: ExamAnswer[];
}

export interface ExamSubmitResponse {
  attemptId: string;
  lessonId: string;
  score: number;
  passed: boolean;
  submittedAt: string;
  status: 'submitted';
}

export interface RetakeResponse {
  allowed: boolean;
  cycle: number;
}

export interface NextAvailableResponse {
  nextSubject: {
    subjectId: string;
    subjectName: string;
    lessonId: string;
    lessonTitle: string;
    partId: string;
    partTitle: string;
  } | null;
  currentSubject: {
    subjectId: string;
    subjectName: string;
    progressPercent: number;
    currentLessonId: string;
    currentLessonTitle: string;
  } | null;
  lock: boolean;
  blockedBy: {
    lessonId: string;
    lessonTitle: string;
    order: number;
  } | null;
}

// 에러 응답 타입
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// UX에서 사용할 블로커 타입
export interface LessonBlocker {
  type: 'prevNotCompleted' | 'period' | 'notAssigned' | 'progressRequired';
  message: string;
  lessonId?: string;
  lessonTitle?: string;
}

