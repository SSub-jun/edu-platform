import { http, HttpResponse } from 'msw';
import { CurriculumResponse, LessonStatusResponse, StartExamResponse, SubmitExamResponse } from '../../types/api';

const baseUrl = 'http://localhost:4000';

// 목 데이터
const mockCurriculum: CurriculumResponse['data'] = [
  {
    subject: {
      id: 'subject-1',
      name: '기초 프로그래밍',
      description: '프로그래밍의 기본 개념을 학습합니다.',
      order: 1,
    },
    lessons: [
      {
        id: 'lesson-1',
        title: '변수와 자료형',
        description: '프로그래밍의 기본 요소를 학습합니다.',
        order: 1,
        subjectId: 'subject-1',
        progressPercent: 95,
        status: 'available',
        remainingTries: 3,
        totalDurationMs: 240000, // 4분
      },
      {
        id: 'lesson-2',
        title: '조건문과 반복문',
        description: '제어 구조를 학습합니다.',
        order: 2,
        subjectId: 'subject-1',
        progressPercent: 0,
        status: 'locked',
        remainingTries: 3,
        totalDurationMs: 300000, // 5분
      },
    ],
    remainingDays: 45,
  },
];

const mockLessonStatus: LessonStatusResponse['data'] = {
  lessonId: 'lesson-1',
  progressPercent: 95,
  unlocked: true,
  remainingTries: 3,
  blockers: [],
};

const mockExamQuestions: StartExamResponse['data'] = {
  attemptId: 'attempt-123',
  lessonId: 'lesson-1',
  questions: [
    {
      id: 'question-1',
      stem: '다음 중 변수를 선언하는 올바른 방법은?',
      choices: [
        { id: 'choice-1', text: 'var name = "홍길동"', order: 1 },
        { id: 'choice-2', text: 'variable name = "홍길동"', order: 2 },
        { id: 'choice-3', text: 'name = "홍길동"', order: 3 },
        { id: 'choice-4', text: 'string name = "홍길동"', order: 4 },
      ],
    },
    {
      id: 'question-2',
      stem: 'JavaScript에서 문자열을 나타내는 방법이 아닌 것은?',
      choices: [
        { id: 'choice-5', text: '"Hello World"', order: 1 },
        { id: 'choice-6', text: "'Hello World'", order: 2 },
        { id: 'choice-7', text: '`Hello World`', order: 3 },
        { id: 'choice-8', text: '[Hello World]', order: 4 },
      ],
    },
  ],
};

const mockSubmitResult: SubmitExamResponse['data'] = {
  attemptId: 'attempt-123',
  examScore: 85,
  subjectProgress: 50,
  finalScore: 85,
  passed: true,
  correctAnswers: 8,
  totalQuestions: 10,
};

export const handlers = [
  // 커리큘럼 조회
  http.get(`${baseUrl}/me/curriculum`, () => {
    return HttpResponse.json({
      success: true,
      data: mockCurriculum,
    });
  }),

  // 레슨 상태 조회
  http.get(`${baseUrl}/progress/lessons/:lessonId/status`, ({ params }) => {
    const { lessonId } = params;
    return HttpResponse.json({
      success: true,
      data: {
        ...mockLessonStatus,
        lessonId: lessonId as string,
      },
    });
  }),

  // 진도 ping
  http.post(`${baseUrl}/progress/ping`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      success: true,
      data: {
        lessonProgressPercent: Math.min(body.playedMs / 1000 + 90, 100),
        subjectProgressEstimate: 50,
      },
    });
  }),

  // 시험 시작
  http.post(`${baseUrl}/exam/lessons/:lessonId/start`, ({ params }) => {
    const { lessonId } = params;
    return HttpResponse.json({
      success: true,
      data: {
        ...mockExamQuestions,
        lessonId: lessonId as string,
      },
    });
  }),

  // 시험 제출
  http.post(`${baseUrl}/exam/attempts/:attemptId/submit`, ({ params }) => {
    const { attemptId } = params;
    return HttpResponse.json({
      success: true,
      data: {
        ...mockSubmitResult,
        attemptId: attemptId as string,
      },
    });
  }),

  // Next Available
  http.get(`${baseUrl}/progress/next-available`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        nextSubject: {
          subjectId: 'subject-1',
          subjectName: '기초 프로그래밍',
          lessonId: 'lesson-2',
          lessonTitle: '조건문과 반복문',
          partId: 'part-2-1',
          partTitle: '조건문과 반복문 - 1부',
        },
        currentSubject: null,
        lock: false,
        blockedBy: null,
      },
    });
  }),

  // 재응시
  http.post(`${baseUrl}/exam/lessons/:lessonId/retake`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        allowed: true,
        cycle: 1,
        tryIndex: 2,
        remainingTries: 2,
      },
    });
  }),
];









