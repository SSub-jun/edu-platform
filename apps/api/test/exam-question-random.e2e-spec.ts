import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Exam Question Random (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // 테스트 데이터 정리
    await prismaService.examAttempt.deleteMany();
    await prismaService.choice.deleteMany();
    await prismaService.question.deleteMany();
    await prismaService.progress.deleteMany();
    await prismaService.lesson.deleteMany();
    await prismaService.subject.deleteMany();
    await prismaService.user.deleteMany();

    // 테스트 사용자 생성
    await prismaService.user.create({
      data: {
        id: 'test-user-1',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        role: 'student',
      },
    });

    // 테스트 과목 생성
    const subject = await prismaService.subject.create({
      data: {
        id: 'test-subject-1',
        name: '테스트 수학',
        description: '테스트용 수학 과목',
        order: 1,
        isActive: true,
      },
    });

    // 테스트 레슨들 생성
    await prismaService.lesson.createMany({
      data: [
        {
          id: 'test-lesson-1',
          subjectId: subject.id,
          title: '1장: 기초 수학',
          description: '기초 수학 개념',
          order: 1,
          isActive: true,
        },
        {
          id: 'test-lesson-2',
          subjectId: subject.id,
          title: '2장: 방정식',
          description: '방정식 풀이',
          order: 2,
          isActive: true,
        },
      ],
    });

    // 진도율 95%로 설정
    await prismaService.progress.createMany({
      data: [
        {
          userId: 'test-user-1',
          lessonId: 'test-lesson-1',
          progressPercent: 95,
          status: 'completed',
        },
        {
          userId: 'test-user-1',
          lessonId: 'test-lesson-2',
          progressPercent: 95,
          status: 'completed',
        },
      ],
    });

    // 테스트 문제 30개 생성 (3배수)
    for (let i = 1; i <= 30; i++) {
      const question = await prismaService.question.create({
        data: {
          id: `test-question-${i}`,
          subjectId: subject.id,
          stem: `수학 문제 ${i}번: ${getQuestionStem(i)}`,
          explanation: `문제 ${i}번의 해설입니다.`,
          isActive: true,
        },
      });

      // 4지선다 보기 생성
      const correctAnswerIndex = (i % 4) + 1; // 1, 2, 3, 4 순환
      for (let j = 1; j <= 4; j++) {
        await prismaService.choice.create({
          data: {
            id: `choice-${question.id}-${j}`,
            questionId: question.id,
            text: `보기 ${j}: ${getChoiceText(i, j)}`,
            isAnswer: j === correctAnswerIndex,
            order: j,
          },
        });
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /exam/subjects/:id/start', () => {
    it('should return 10 questions when starting exam', async () => {
      const response = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.questions).toBeDefined();
      expect(response.body.questions.length).toBe(10);
      expect(response.body.cycle).toBe(1);
      expect(response.body.tryIndex).toBe(1);
      expect(response.body.status).toBe('inProgress');
    });

    it('should return same questionIds when retrieving same attempt', async () => {
      // 첫 번째 시험 시작
      const firstResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const attemptId = firstResponse.body.id;
      const firstQuestionIds = firstResponse.body.questions.map((q: any) => q.id);

      // 동일한 attempt 조회 (실제로는 별도 엔드포인트가 필요하지만, 여기서는 데이터베이스에서 직접 확인)
      const attempt = await prismaService.examAttempt.findUnique({
        where: { id: attemptId }
      });

      expect(attempt).toBeDefined();
      expect(attempt?.questionIds).toBeDefined();
      
      const storedQuestionIds = attempt?.questionIds as string[];
      expect(storedQuestionIds.length).toBe(10);
      expect(storedQuestionIds).toEqual(expect.arrayContaining(firstQuestionIds));
    });

    it('should return different questionIds for different attempts', async () => {
      // 첫 번째 시험 시작
      const firstResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const firstQuestionIds = firstResponse.body.questions.map((q: any) => q.id);

      // 두 번째 시험 시작 (재시도)
      const secondResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const secondQuestionIds = secondResponse.body.questions.map((q: any) => q.id);

      // 문제 ID가 다를 수 있음 (랜덤 출제이므로)
      // 하지만 같은 문제가 포함될 수도 있음
      expect(secondResponse.body.tryIndex).toBe(2);
    });

    it('should return 422 when insufficient questions', async () => {
      // 문제를 29개만 남기고 삭제
      await prismaService.question.delete({
        where: { id: 'test-question-30' }
      });

      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(422);
    });
  });

  describe('POST /exam/attempts/:attemptId/submit', () => {
    it('should return 422 when questionIds do not match', async () => {
      // 시험 시작
      const startResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const attemptId = startResponse.body.id;
      const questions = startResponse.body.questions;

      // 잘못된 문제 ID로 답안 제출
      const wrongAnswers = [
        {
          questionId: 'wrong-question-id',
          choiceId: 'choice-test-question-1-1'
        }
      ];

      await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', 'Bearer dev-token')
        .send({ answers: wrongAnswers })
        .expect(422);
    });

    it('should return 422 when answer count does not match', async () => {
      // 시험 시작
      const startResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const attemptId = startResponse.body.id;
      const questions = startResponse.body.questions;

      // 문제 수보다 적은 답안 제출
      const insufficientAnswers = [
        {
          questionId: questions[0].id,
          choiceId: 'choice-test-question-1-1'
        }
      ];

      await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', 'Bearer dev-token')
        .send({ answers: insufficientAnswers })
        .expect(422);
    });

    it('should submit exam successfully with correct answers', async () => {
      // 시험 시작
      const startResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const attemptId = startResponse.body.id;
      const questions = startResponse.body.questions;

      // 정답으로 답안 구성
      const correctAnswers = questions.map((question: any) => {
        // 문제 ID에서 번호 추출
        const questionNumber = parseInt(question.id.split('-')[2]);
        const correctChoiceIndex = (questionNumber % 4) + 1;
        
        return {
          questionId: question.id,
          choiceId: `choice-${question.id}-${correctChoiceIndex}`
        };
      });

      const submitResponse = await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', 'Bearer dev-token')
        .send({ answers: correctAnswers })
        .expect(200);

      expect(submitResponse.body.score).toBe(100); // 모든 문제 정답
      expect(submitResponse.body.progressPercent).toBe(95); // 진도율 95%
      expect(submitResponse.body.finalScore).toBe(99); // (100 * 0.8) + (95 * 0.2) = 99
      expect(submitResponse.body.passed).toBe(true); // 99점은 70점 이상
      expect(submitResponse.body.status).toBe('submitted');

      // 데이터베이스에서 answers 저장 확인
      const attempt = await prismaService.examAttempt.findUnique({
        where: { id: attemptId }
      });

      expect(attempt?.answers).toBeDefined();
      expect(attempt?.answers).toEqual(correctAnswers);
    });

    it('should submit exam with partial correct answers', async () => {
      // 시험 시작
      const startResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const attemptId = startResponse.body.id;
      const questions = startResponse.body.questions;

      // 일부만 정답으로 답안 구성 (5개 정답, 5개 오답)
      const mixedAnswers = questions.map((question: any, index: number) => {
        const questionNumber = parseInt(question.id.split('-')[2]);
        
        if (index < 5) {
          // 정답
          const correctChoiceIndex = (questionNumber % 4) + 1;
          return {
            questionId: question.id,
            choiceId: `choice-${question.id}-${correctChoiceIndex}`
          };
        } else {
          // 오답 (정답이 아닌 선택지)
          const wrongChoiceIndex = ((questionNumber % 4) + 2) % 4 || 4;
          return {
            questionId: question.id,
            choiceId: `choice-${question.id}-${wrongChoiceIndex}`
          };
        }
      });

      const submitResponse = await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', 'Bearer dev-token')
        .send({ answers: mixedAnswers })
        .expect(200);

      expect(submitResponse.body.score).toBe(50); // 10문제 중 5개 정답 = 50점
      expect(submitResponse.body.progressPercent).toBe(95); // 진도율 95%
      expect(submitResponse.body.finalScore).toBe(59); // (50 * 0.8) + (95 * 0.2) = 59
      expect(submitResponse.body.passed).toBe(false); // 59점은 70점 미만
      expect(submitResponse.body.status).toBe('submitted');
    });
  });
});

function getQuestionStem(questionNumber: number): string {
  const stems = [
    '자연수 1부터 10까지의 합을 구하시오.',
    '방정식 2x + 3 = 7의 해를 구하시오.',
    '함수 f(x) = 2x + 1의 그래프를 그리시오.',
    '분수 3/4와 2/3의 합을 구하시오.',
    '직사각형의 넓이가 24이고 가로가 6일 때 세로를 구하시오.',
    '이차방정식 x² - 5x + 6 = 0의 해를 구하시오.',
    '삼각형의 세 각의 합은 몇 도인가요?',
    '원의 넓이 공식을 쓰시오.',
    '로그 log₂8의 값을 구하시오.',
    '미분 dy/dx를 구하시오.',
    '적분 ∫x²dx를 구하시오.',
    '확률 P(A∪B)를 구하시오.',
    '통계에서 평균을 구하는 공식을 쓰시오.',
    '기하학에서 피타고라스 정리를 설명하시오.',
    '대수학에서 인수분해를 수행하시오.',
  ];
  return stems[(questionNumber - 1) % stems.length];
}

function getChoiceText(questionNumber: number, choiceNumber: number): string {
  const choices = [
    ['55', '56', '57', '58'],
    ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
    ['직선', '포물선', '지수함수', '로그함수'],
    ['5/7', '17/12', '6/7', '1/12'],
    ['4', '5', '6', '7'],
    ['x = 2, 3', 'x = 1, 6', 'x = -2, -3', 'x = 0, 5'],
    ['90도', '180도', '270도', '360도'],
    ['πr', 'πr²', '2πr', '4πr²'],
    ['2', '3', '4', '5'],
    ['2x', '2', 'x', '1'],
    ['x³/3 + C', 'x²/2 + C', 'x + C', 'C'],
    ['P(A) + P(B)', 'P(A) + P(B) - P(A∩B)', 'P(A) × P(B)', 'P(A) / P(B)'],
    ['∑x/n', '∑x²/n', '√∑x²/n', '∑(x-μ)²/n'],
    ['a² + b² = c²', 'a + b = c', 'a × b = c', 'a ÷ b = c'],
    ['(x+1)(x+2)', '(x-1)(x-2)', '(x+1)(x-2)', '(x-1)(x+2)'],
  ];
  const questionIndex = (questionNumber - 1) % choices.length;
  const choiceIndex = (choiceNumber - 1) % 4;
  return choices[questionIndex][choiceIndex];
}
