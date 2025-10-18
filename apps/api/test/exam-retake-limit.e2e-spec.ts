import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Exam Retake Limit (e2e)', () => {
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

    // 테스트 문제 생성
    const question = await prismaService.question.create({
      data: {
        id: 'test-question-1',
        subjectId: subject.id,
        stem: '1 + 1 = ?',
        explanation: '기본 덧셈 문제',
        isActive: true,
      },
    });

    // 테스트 보기 생성
    await prismaService.choice.createMany({
      data: [
        {
          id: 'choice-1',
          questionId: question.id,
          text: '1',
          isAnswer: false,
          order: 1,
        },
        {
          id: 'choice-2',
          questionId: question.id,
          text: '2',
          isAnswer: true,
          order: 2,
        },
        {
          id: 'choice-3',
          questionId: question.id,
          text: '3',
          isAnswer: false,
          order: 3,
        },
        {
          id: 'choice-4',
          questionId: question.id,
          text: '4',
          isAnswer: false,
          order: 4,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /exam/subjects/:id/start', () => {
    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .expect(401);
    });

    it('should return 422 when progress is less than 90%', async () => {
      // 진도율 50%로 설정
      await prismaService.progress.create({
        data: {
          userId: 'test-user-1',
          lessonId: 'test-lesson-1',
          progressPercent: 50,
          status: 'inProgress',
        },
      });

      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(422);
    });

    it('should start exam successfully when progress is 90% or more', async () => {
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

      const response = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.cycle).toBe(1);
      expect(response.body.tryIndex).toBe(1);
      expect(response.body.status).toBe('inProgress');
    });

    it('should return 422 when already passed in current cycle', async () => {
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

      // 이미 합격한 시험 시도 생성
      await prismaService.examAttempt.create({
        data: {
          userId: 'test-user-1',
          subjectId: 'test-subject-1',
          cycle: 1,
          tryIndex: 1,
          status: 'submitted',
          score: 80,
          finalScore: 85,
          passed: true,
          startedAt: new Date(),
          submittedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(422);
    });

    it('should allow retry within 3 attempts in same cycle', async () => {
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

      // 첫 번째 시도 생성
      await prismaService.examAttempt.create({
        data: {
          userId: 'test-user-1',
          subjectId: 'test-subject-1',
          cycle: 1,
          tryIndex: 1,
          status: 'submitted',
          score: 60,
          finalScore: 65,
          passed: false,
          startedAt: new Date(),
          submittedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.cycle).toBe(1);
      expect(response.body.tryIndex).toBe(2);
    });

    it('should return 422 when exceeded 3 attempts in current cycle', async () => {
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

      // 3번의 시도 모두 생성
      await prismaService.examAttempt.createMany({
        data: [
          {
            userId: 'test-user-1',
            subjectId: 'test-subject-1',
            cycle: 1,
            tryIndex: 1,
            status: 'submitted',
            score: 60,
            finalScore: 65,
            passed: false,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
          {
            userId: 'test-user-1',
            subjectId: 'test-subject-1',
            cycle: 1,
            tryIndex: 2,
            status: 'submitted',
            score: 65,
            finalScore: 70,
            passed: false,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
          {
            userId: 'test-user-1',
            subjectId: 'test-subject-1',
            cycle: 1,
            tryIndex: 3,
            status: 'submitted',
            score: 70,
            finalScore: 75,
            passed: false,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
        ],
      });

      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(422);
    });
  });

  describe('POST /exam/subjects/:id/retake', () => {
    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/retake')
        .expect(401);
    });

    it('should return 422 when progress is less than 90%', async () => {
      // 진도율 50%로 설정
      await prismaService.progress.create({
        data: {
          userId: 'test-user-1',
          lessonId: 'test-lesson-1',
          progressPercent: 50,
          status: 'inProgress',
        },
      });

      // 기존 시험 시도 생성
      await prismaService.examAttempt.create({
        data: {
          userId: 'test-user-1',
          subjectId: 'test-subject-1',
          cycle: 1,
          tryIndex: 3,
          status: 'submitted',
          score: 60,
          finalScore: 65,
          passed: false,
          startedAt: new Date(),
          submittedAt: new Date(),
        },
      });

      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/retake')
        .set('Authorization', 'Bearer dev-token')
        .expect(422);
    });

    it('should start next cycle when progress is 90% or more', async () => {
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

      // 1차 시험 3번 시도 완료
      await prismaService.examAttempt.createMany({
        data: [
          {
            userId: 'test-user-1',
            subjectId: 'test-subject-1',
            cycle: 1,
            tryIndex: 1,
            status: 'submitted',
            score: 60,
            finalScore: 65,
            passed: false,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
          {
            userId: 'test-user-1',
            subjectId: 'test-subject-1',
            cycle: 1,
            tryIndex: 2,
            status: 'submitted',
            score: 65,
            finalScore: 70,
            passed: false,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
          {
            userId: 'test-user-1',
            subjectId: 'test-subject-1',
            cycle: 1,
            tryIndex: 3,
            status: 'submitted',
            score: 70,
            finalScore: 75,
            passed: false,
            startedAt: new Date(),
            submittedAt: new Date(),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/retake')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.cycle).toBe(2);
      expect(response.body.tryIndex).toBe(1);
      expect(response.body.status).toBe('inProgress');
    });

    it('should return 422 when no previous attempts exist', async () => {
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

      await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/retake')
        .set('Authorization', 'Bearer dev-token')
        .expect(422);
    });
  });

  describe('POST /exam/attempts/:attemptId/submit', () => {
    it('should submit exam and calculate final score correctly', async () => {
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

      // 시험 시작
      const startResponse = await request(app.getHttpServer())
        .post('/exam/subjects/test-subject-1/start')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      const attemptId = startResponse.body.id;

      // 시험 제출 (정답)
      const submitResponse = await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', 'Bearer dev-token')
        .send({
          answers: [
            {
              questionId: 'test-question-1',
              selectedChoiceId: 'choice-2', // 정답
            },
          ],
        })
        .expect(200);

      expect(submitResponse.body.score).toBe(100); // 정답이므로 100점
      expect(submitResponse.body.progressPercent).toBe(95); // 진도율 95%
      expect(submitResponse.body.finalScore).toBe(99); // (100 * 0.8) + (95 * 0.2) = 99
      expect(submitResponse.body.passed).toBe(true); // 99점은 70점 이상
      expect(submitResponse.body.status).toBe('submitted');
    });
  });
});
