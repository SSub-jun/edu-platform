import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth Real (e2e)', () => {
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
    await prismaService.session.deleteMany();
    await prismaService.user.deleteMany();

    // 테스트 사용자 생성
    const passwordHash = await bcrypt.hash('testpass123', 10);
    await prismaService.user.create({
      data: {
        id: 'test-user-1',
        username: 'testuser',
        passwordHash,
        role: 'student',
        phone: '010-1234-5678',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should login successfully and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.role).toBe('student');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });

    it('should revoke existing sessions on new login (single session policy)', async () => {
      // 첫 번째 로그인
      const firstLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      const firstAccessToken = firstLogin.body.accessToken;

      // 두 번째 로그인 (기존 세션 만료)
      const secondLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      // 첫 번째 토큰으로 접근 시도 (실패해야 함)
      await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', `Bearer ${firstAccessToken}`)
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);
    });

    it('should refresh tokens successfully', async () => {
      // 로그인
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      const refreshToken = loginResponse.body.refreshToken;

      // 토큰 갱신
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(201);

      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.refreshToken).toBeDefined();
      expect(refreshResponse.body.accessToken).not.toBe(loginResponse.body.accessToken);
      expect(refreshResponse.body.refreshToken).not.toBe(loginResponse.body.refreshToken);
    });

    it('should invalidate old refresh token after refresh', async () => {
      // 로그인
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      const oldRefreshToken = loginResponse.body.refreshToken;

      // 토큰 갱신
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: oldRefreshToken,
        })
        .expect(201);

      // 기존 refresh token으로 재시도 (실패해야 함)
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: oldRefreshToken,
        })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 401 for unauthenticated access', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should logout successfully', async () => {
      // 로그인
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      const accessToken = loginResponse.body.accessToken;

      // 로그아웃
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // 로그아웃 후 접근 시도 (실패해야 함)
      await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('should access protected route with valid token', async () => {
      // 로그인
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      const accessToken = loginResponse.body.accessToken;

      // 보호된 라우트 접근
      await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should return 401 for protected route without token', async () => {
      await request(app.getHttpServer())
        .get('/progress/next-available')
        .expect(401);
    });

    it('should return 401 for protected route with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/progress/next-available')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Session management', () => {
    it('should create session with device info and IP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Test Browser/1.0')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      // 세션 정보 확인 (데이터베이스에서 직접 조회)
      const sessions = await prismaService.session.findMany({
        where: { userId: 'test-user-1' },
      });

      expect(sessions.length).toBe(1);
      expect(sessions[0].deviceInfo).toContain('Test Browser');
      expect(sessions[0].refreshTokenHash).toBeDefined();
      expect(sessions[0].revokedAt).toBeNull();
    });

    it('should update lastLoginAt on successful login', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass123',
        })
        .expect(201);

      // 사용자 정보 확인
      const user = await prismaService.user.findUnique({
        where: { username: 'testuser' },
      });

      expect(user?.lastLoginAt).toBeDefined();
      expect(user?.lastLoginAt).toBeInstanceOf(Date);
    });
  });
});
