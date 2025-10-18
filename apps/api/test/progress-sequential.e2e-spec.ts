import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Progress Sequential Learning (e2e)', () => {
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
    await prismaService.progress.deleteMany();
    await prismaService.subjectProgress.deleteMany();
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

    // 테스트 레슨들 생성 (순차적)
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
        {
          id: 'test-lesson-3',
          subjectId: subject.id,
          title: '3장: 함수',
          description: '함수 개념',
          order: 3,
          isActive: true,
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /progress/ping', () => {
    it('should mark lesson as completed when complete=true', async () => {
      const pingData = {
        subjectId: 'test-subject-1',
        lessonId: 'test-lesson-1',
        partId: 'part-1',
        playedMs: 300000,
        complete: true,
      };

      const response = await request(app.getHttpServer())
        .post('/progress/ping')
        .set('Authorization', 'Bearer dev-token')
        .send(pingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('진도가 업데이트되었습니다.');

      // 데이터베이스에서 완료 상태 확인
      const progress = await prismaService.progress.findUnique({
        where: {
          userId_lessonId: {
            userId: 'test-user-1',
            lessonId: 'test-lesson-1',
          },
        },
      });

      expect(progress).toBeDefined();
      expect(progress.status).toBe('completed');
      expect(progress.completedAt).toBeDefined();
    });

    it('should not mark lesson as completed when complete=false', async () => {
      const pingData = {
        subjectId: 'test-subject-1',
        lessonId: 'test-lesson-1',
        partId: 'part-1',
        playedMs: 300000,
        complete: false,
      };

      const response = await request(app.getHttpServer())
        .post('/progress/ping')
        .set('Authorization', 'Bearer dev-token')
        .send(pingData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 데이터베이스에서 완료 상태 확인
      const progress = await prismaService.progress.findUnique({
        where: {
          userId_lessonId: {
            userId: 'test-user-1',
            lessonId: 'test-lesson-1',
          },
        },
      });

      expect(progress).toBeNull();
    });
  });

  describe('GET /progress/next-available', () => {
    it('should return lock=true when previous lesson is not completed', async () => {
      // 첫 번째 레슨만 완료하고 두 번째 레슨은 미완료 상태로 설정
      await prismaService.progress.create({
        data: {
          userId: 'test-user-1',
          lessonId: 'test-lesson-1',
          status: 'completed',
          completedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.lock).toBe(true);
      expect(response.body.blockedBy).toBeDefined();
      expect(response.body.blockedBy.lessonId).toBe('test-lesson-1');
      expect(response.body.blockedBy.lessonTitle).toBe('1장: 기초 수학');
      expect(response.body.blockedBy.order).toBe(1);
    });

    it('should return lock=false when all previous lessons are completed', async () => {
      // 첫 번째와 두 번째 레슨을 모두 완료
      await prismaService.progress.createMany({
        data: [
          {
            userId: 'test-user-1',
            lessonId: 'test-lesson-1',
            status: 'completed',
            completedAt: new Date(),
          },
          {
            userId: 'test-user-1',
            lessonId: 'test-lesson-2',
            status: 'completed',
            completedAt: new Date(),
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.lock).toBe(false);
      expect(response.body.blockedBy).toBeNull();
    });

    it('should return lock=false for first lesson (order=1)', async () => {
      // 아무 레슨도 완료하지 않은 상태
      const response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.lock).toBe(false);
      expect(response.body.blockedBy).toBeNull();
    });

    it('should return correct nextSubject information', async () => {
      const response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.nextSubject).toBeDefined();
      expect(response.body.nextSubject.subjectId).toBe('test-subject-1');
      expect(response.body.nextSubject.subjectName).toBe('테스트 수학');
      expect(response.body.nextSubject.lessonId).toBe('test-lesson-1');
      expect(response.body.nextSubject.lessonTitle).toBe('1장: 기초 수학');
    });
  });

  describe('Sequential Learning Flow', () => {
    it('should allow access to lesson 2 only after lesson 1 is completed', async () => {
      // 1. 초기 상태: 첫 번째 레슨만 접근 가능
      let response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.lock).toBe(false);
      expect(response.body.nextSubject.lessonId).toBe('test-lesson-1');

      // 2. 첫 번째 레슨 완료
      await request(app.getHttpServer())
        .post('/progress/ping')
        .set('Authorization', 'Bearer dev-token')
        .send({
          subjectId: 'test-subject-1',
          lessonId: 'test-lesson-1',
          playedMs: 300000,
          complete: true,
        })
        .expect(200);

      // 3. 두 번째 레슨 접근 가능 확인
      response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.lock).toBe(false);
      expect(response.body.nextSubject.lessonId).toBe('test-lesson-2');

      // 4. 세 번째 레슨은 아직 잠겨있음
      await request(app.getHttpServer())
        .post('/progress/ping')
        .set('Authorization', 'Bearer dev-token')
        .send({
          subjectId: 'test-subject-1',
          lessonId: 'test-lesson-3',
          playedMs: 300000,
          complete: true,
        })
        .expect(200);

      response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body.lock).toBe(true);
      expect(response.body.blockedBy.lessonId).toBe('test-lesson-2');
    });
  });
});
