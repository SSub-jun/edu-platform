import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Database Operations (e2e)', () => {
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

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return 200 and basic health information', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.ts).toBeDefined();
      expect(response.body.database).toBeDefined();
      expect(response.body.database.status).toBe('healthy');
      expect(response.body.database.database).toBe('connected');
      expect(response.body.environment).toBeDefined();
      expect(response.body.version).toBeDefined();
    });

    it('should include migration status in health check', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.database.migrationStatus).toBeDefined();
      expect(['up-to-date', 'unknown']).toContain(response.body.database.migrationStatus);
    });

    it('should include entity counts in development environment', async () => {
      // NODE_ENV를 development로 설정하여 테스트
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.database.counts).toBeDefined();
      expect(response.body.database.counts.users).toBeGreaterThanOrEqual(0);
      expect(response.body.database.counts.subjects).toBeGreaterThanOrEqual(0);
      expect(response.body.database.counts.lessons).toBeGreaterThanOrEqual(0);
      expect(response.body.database.counts.questions).toBeGreaterThanOrEqual(0);

      // 환경 변수 복원
      process.env.NODE_ENV = originalEnv;
    });

    it('should not include entity counts in production environment', async () => {
      // NODE_ENV를 production으로 설정하여 테스트
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.database.counts).toBeUndefined();

      // 환경 변수 복원
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Database Connectivity', () => {
    it('should have working database connection', async () => {
      const healthCheck = await prismaService.healthCheck();
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck.database).toBe('connected');
    });

    it('should be able to perform basic database operations', async () => {
      // 간단한 쿼리 테스트
      const userCount = await prismaService.user.count();
      expect(typeof userCount).toBe('number');
      expect(userCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Seed Data Validation', () => {
    it('should have minimum required entities after seed', async () => {
      // 최소 엔티티 수 확인
      const [userCount, subjectCount, lessonCount, questionCount] = await Promise.all([
        prismaService.user.count(),
        prismaService.subject.count(),
        prismaService.lesson.count(),
        prismaService.question.count(),
      ]);

      // 기본 사용자 3명 (admin, teacher, user)
      expect(userCount).toBeGreaterThanOrEqual(3);
      
      // 최소 1개 과목
      expect(subjectCount).toBeGreaterThanOrEqual(1);
      
      // 최소 1개 레슨
      expect(lessonCount).toBeGreaterThanOrEqual(1);
      
      // 최소 15개 문제 (시험 랜덤 출제를 위해)
      expect(questionCount).toBeGreaterThanOrEqual(15);
    });

    it('should have questions with choices', async () => {
      const questions = await prismaService.question.findMany({
        include: {
          choices: true,
        },
        take: 5, // 처음 5개 문제만 확인
      });

      for (const question of questions) {
        expect(question.choices.length).toBe(4); // 4지선다
        expect(question.choices.some(choice => choice.isAnswer)).toBe(true); // 정답이 하나는 있어야 함
      }
    });

    it('should have lessons with video parts', async () => {
      const lessons = await prismaService.lesson.findMany({
        include: {
          videoParts: true,
        },
        take: 3, // 처음 3개 레슨만 확인
      });

      for (const lesson of lessons) {
        expect(lesson.videoParts.length).toBeGreaterThan(0);
        expect(lesson.videoParts.every(part => part.durationMs > 0)).toBe(true);
      }
    });
  });

  describe('API Functionality with Database', () => {
    it('should be able to access protected routes after database setup', async () => {
      // Mock 토큰으로 보호된 라우트 접근 테스트
      const response = await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer dev-token')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should have working exam endpoints', async () => {
      // 시험 관련 엔드포인트가 정상 동작하는지 확인
      const subjects = await prismaService.subject.findMany();
      if (subjects.length > 0) {
        const response = await request(app.getHttpServer())
          .post(`/exam/subjects/${subjects[0].id}/start`)
          .set('Authorization', 'Bearer dev-token')
          .expect(200);

        expect(response.body.questions).toBeDefined();
        expect(response.body.questions.length).toBe(10); // 랜덤 10문항
      }
    });
  });
});
