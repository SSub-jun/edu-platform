import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Module } from '@nestjs/common';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { HealthController } from '../src/health/health.controller';
import { ProgressController } from '../src/progress/progress.controller';
import { DevAuthGuard } from '../src/guards/dev-auth.guard';

@Module({
  controllers: [AuthController, HealthController, ProgressController],
  providers: [AuthService, DevAuthGuard],
})
class TestModule {}

describe('Contract Tests (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/login', () => {
    it('성공: 200, accessToken 반환', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'admin',
          password: 'admin123'
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('role');
      expect(response.body.accessToken).toBe('dev-token');
      expect(response.body.role).toBe('admin');
    });

    it('실패: 401 - 잘못된 자격증명', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'admin',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    it('실패: 401 - 존재하지 않는 사용자', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'nonexistent',
          password: 'password123'
        })
        .expect(401);
    });
  });

  describe('보호 라우트 접근', () => {
    it('비로그인 → 401', async () => {
      await request(app.getHttpServer())
        .post('/progress/ping')
        .send({
          lessonId: 'L1',
          playedMs: 1000
        })
        .expect(401);
    });

    it('로그인 후 보호 라우트 정상 접근 → 200', async () => {
      // 먼저 로그인하여 토큰 획득
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'admin',
          password: 'admin123'
        })
        .expect(201);

      const accessToken = loginResponse.body.accessToken;

      // 토큰을 사용하여 보호된 라우트 접근
      const response = await request(app.getHttpServer())
        .post('/progress/ping')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lessonId: 'L1',
          playedMs: 1000
        })
        .expect(200);

      expect(response.body).toHaveProperty('progressPercent');
      expect(response.body.progressPercent).toBe(50);
    });

    it('잘못된 토큰으로 보호 라우트 접근 → 401', async () => {
      await request(app.getHttpServer())
        .post('/progress/ping')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          lessonId: 'L1',
          playedMs: 1000
        })
        .expect(401);
    });

    it('Authorization 헤더 없이 보호 라우트 접근 → 401', async () => {
      await request(app.getHttpServer())
        .post('/progress/ping')
        .send({
          lessonId: 'L1',
          playedMs: 1000
        })
        .expect(401);
    });
  });

  describe('/health', () => {
    it('헬스 체크 → 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('ok');
      expect(response.body).toHaveProperty('ts');
      expect(response.body.ok).toBe(true);
      expect(typeof response.body.ts).toBe('number');
    });
  });

  describe('다른 보호된 엔드포인트들', () => {
    it('progress/next-available 보호 라우트 테스트', async () => {
      // 비로그인 접근
      await request(app.getHttpServer())
        .get('/progress/next-available?subjectId=SUB1')
        .expect(401);

      // 로그인 후 접근
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          id: 'teacher',
          password: 'teach123'
        })
        .expect(201);

      const accessToken = loginResponse.body.accessToken;

      const response = await request(app.getHttpServer())
        .get('/progress/next-available?subjectId=SUB1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('next');
      expect(response.body).toHaveProperty('lockedReason');
      expect(response.body.next).toHaveProperty('lessonId');
    });
  });
});
