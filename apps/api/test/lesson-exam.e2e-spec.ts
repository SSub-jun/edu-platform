import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Lesson Exam E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let lessonId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // 테스트 사용자 로그인
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'user',
        password: 'user123'
      })
      .expect(201);

    accessToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;

    // 첫 번째 레슨 ID 조회
    const lessons = await prisma.lesson.findMany({
      orderBy: { order: 'asc' },
      take: 1
    });
    lessonId = lessons[0].id;

    // 진도를 90% 이상으로 설정
    await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      update: {
        progressPercent: 95.0
      },
      create: {
        userId,
        lessonId,
        progressPercent: 95.0,
        lastPartId: 'part-1',
        lastPlayedMs: 5000
      }
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /exam/lessons/:lessonId/start', () => {
    it('should start exam successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/exam/lessons/${lessonId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('attemptId');
      expect(response.body).toHaveProperty('lessonId', lessonId);
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions).toHaveLength(10);

      // 각 문제가 올바른 구조인지 확인
      response.body.questions.forEach(question => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('content');
        expect(question).toHaveProperty('choices');
        expect(question.choices).toHaveLength(4);
      });
    });

    it('should fail with insufficient progress', async () => {
      // 진도를 90% 미만으로 설정
      await prisma.progress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        data: {
          progressPercent: 85.0
        }
      });

      await request(app.getHttpServer())
        .post(`/exam/lessons/${lessonId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(422);

      // 진도를 다시 90% 이상으로 복구
      await prisma.progress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        data: {
          progressPercent: 95.0
        }
      });
    });

    it('should fail when already passed', async () => {
      // 합격 기록 생성
      await prisma.examAttempt.create({
        data: {
          userId,
          subjectId: 'subject-1',
          lessonId,
          cycle: 1,
          tryIndex: 1,
          status: 'submitted',
          score: 80.0,
          passed: true,
          questionIds: ['q1', 'q2'],
          answers: [{ questionId: 'q1', choiceIndex: 0 }],
          startedAt: new Date(),
          submittedAt: new Date()
        }
      });

      await request(app.getHttpServer())
        .post(`/exam/lessons/${lessonId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(422);

      // 테스트 데이터 정리
      await prisma.examAttempt.deleteMany({
        where: { userId, lessonId }
      });
    });
  });

  describe('POST /exam/attempts/:attemptId/submit', () => {
    let attemptId: string;
    let questionIds: string[];

    beforeEach(async () => {
      // 시험 시작
      const startResponse = await request(app.getHttpServer())
        .post(`/exam/lessons/${lessonId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      attemptId = startResponse.body.attemptId;
      questionIds = startResponse.body.questions.map(q => q.id);
    });

    it('should submit exam successfully', async () => {
      const answers = questionIds.map((questionId, index) => ({
        questionId,
        choiceIndex: index % 4
      }));

      const response = await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ answers })
        .expect(200);

      expect(response.body).toHaveProperty('examScore');
      expect(response.body).toHaveProperty('passed');
      expect(typeof response.body.examScore).toBe('number');
      expect(typeof response.body.passed).toBe('boolean');
    });

    it('should fail with invalid answer set', async () => {
      const answers = [
        { questionId: 'wrong-id', choiceIndex: 0 }
      ];

      await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ answers })
        .expect(422);
    });

    it('should fail with duplicate submission', async () => {
      const answers = questionIds.map((questionId, index) => ({
        questionId,
        choiceIndex: index % 4
      }));

      // 첫 번째 제출
      await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ answers })
        .expect(200);

      // 중복 제출 시도
      await request(app.getHttpServer())
        .post(`/exam/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ answers })
        .expect(409);
    });
  });

  describe('POST /exam/lessons/:lessonId/retake', () => {
    beforeEach(async () => {
      // 기존 시도 기록 정리
      await prisma.examAttempt.deleteMany({
        where: { userId, lessonId }
      });
    });

    it('should allow retake after cycle completion', async () => {
      // 3회 시도 완료 (모두 불합격)
      for (let i = 1; i <= 3; i++) {
        await prisma.examAttempt.create({
          data: {
            userId,
            subjectId: 'subject-1',
            lessonId,
            cycle: 1,
            tryIndex: i,
            status: 'submitted',
            score: 60.0,
            passed: false,
            questionIds: ['q1', 'q2'],
            answers: [{ questionId: 'q1', choiceIndex: 0 }],
            startedAt: new Date(),
            submittedAt: new Date()
          }
        });
      }

      const response = await request(app.getHttpServer())
        .post(`/exam/lessons/${lessonId}/retake`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('allowed', true);
      expect(response.body).toHaveProperty('nextCycle', 2);
    });

    it('should fail when cycle not completed', async () => {
      // 1회만 시도
      await prisma.examAttempt.create({
        data: {
          userId,
          subjectId: 'subject-1',
          lessonId,
          cycle: 1,
          tryIndex: 1,
          status: 'submitted',
          score: 60.0,
          passed: false,
          questionIds: ['q1', 'q2'],
          answers: [{ questionId: 'q1', choiceIndex: 0 }],
          startedAt: new Date(),
          submittedAt: new Date()
        }
      });

      await request(app.getHttpServer())
        .post(`/exam/lessons/${lessonId}/retake`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(422);
    });
  });
});