import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Signup Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Phone OTP Flow', () => {
    const testPhone = '01087654321';

    beforeEach(async () => {
      // 테스트 전 OTP 요청 정리
      await prisma.otpRequest.deleteMany({
        where: { phone: testPhone },
      });
      
      // 테스트 사용자 정리
      await prisma.user.deleteMany({
        where: { phone: testPhone },
      });
    });

    it('should send OTP successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({
          phone: testPhone,
          purpose: 'signup',
        })
        .expect(204);

      // OTP 요청이 데이터베이스에 저장되었는지 확인
      const otpRequest = await prisma.otpRequest.findFirst({
        where: { phone: testPhone, purpose: 'signup' },
        orderBy: { createdAt: 'desc' },
      });

      expect(otpRequest).toBeDefined();
      expect(otpRequest?.code).toMatch(/^\d{6}$/);
      expect(otpRequest?.expiresAt).toBeInstanceOf(Date);
    });

    it('should verify OTP and return token', async () => {
      // 1. OTP 전송
      await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({
          phone: testPhone,
          purpose: 'signup',
        })
        .expect(204);

      // 2. DB에서 OTP 코드 조회
      const otpRequest = await prisma.otpRequest.findFirst({
        where: { phone: testPhone, purpose: 'signup' },
        orderBy: { createdAt: 'desc' },
      });

      expect(otpRequest).toBeDefined();

      // 3. OTP 인증
      const response = await request(app.getHttpServer())
        .post('/auth/phone/verify')
        .send({
          phone: testPhone,
          code: otpRequest!.code,
        })
        .expect(200);

      expect(response.body.otpToken).toBeDefined();
      expect(typeof response.body.otpToken).toBe('string');

      // 4. OTP 요청이 사용됨으로 표시되었는지 확인
      const usedOtpRequest = await prisma.otpRequest.findFirst({
        where: { id: otpRequest!.id },
      });

      expect(usedOtpRequest?.usedAt).toBeInstanceOf(Date);
    });

    it('should reject invalid OTP code', async () => {
      // 1. OTP 전송
      await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({
          phone: testPhone,
          purpose: 'signup',
        })
        .expect(204);

      // 2. 잘못된 OTP로 인증 시도
      const response = await request(app.getHttpServer())
        .post('/auth/phone/verify')
        .send({
          phone: testPhone,
          code: '000000',
        })
        .expect(422);

      expect(response.body.code).toBe('INVALID_OTP');
    });
  });

  describe('User Registration', () => {
    const testPhone = '01087654321';
    let otpToken: string;

    beforeEach(async () => {
      // 테스트 데이터 정리
      await prisma.otpRequest.deleteMany({
        where: { phone: testPhone },
      });
      
      await prisma.user.deleteMany({
        where: { phone: testPhone },
      });

      // OTP 토큰 발급
      await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({
          phone: testPhone,
          purpose: 'signup',
        })
        .expect(204);

      const otpRequest = await prisma.otpRequest.findFirst({
        where: { phone: testPhone, purpose: 'signup' },
        orderBy: { createdAt: 'desc' },
      });

      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/phone/verify')
        .send({
          phone: testPhone,
          code: otpRequest!.code,
        })
        .expect(200);

      otpToken = verifyResponse.body.otpToken;
    });

    it('should register user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          phone: testPhone,
          otpToken,
          password: 'TestPassword123!',
          username: 'testuser',
          email: 'test@example.com',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phone).toBe(testPhone);

      // 사용자가 데이터베이스에 생성되었는지 확인
      const user = await prisma.user.findUnique({
        where: { phone: testPhone },
      });

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
      expect(user?.email).toBe('test@example.com');
      expect(user?.phoneVerifiedAt).toBeInstanceOf(Date);
    });

    it('should reject weak password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          phone: testPhone,
          otpToken,
          password: '123456', // 약한 비밀번호
          username: 'testuser',
        })
        .expect(422);

      expect(response.body.code).toBe('WEAK_PASSWORD');
    });

    it('should reject invalid OTP token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          phone: testPhone,
          otpToken: 'invalid-token',
          password: 'TestPassword123!',
          username: 'testuser',
        })
        .expect(422);

      expect(response.body.code).toBe('INVALID_OTP');
    });

    it('should reject duplicate phone number', async () => {
      // 첫 번째 회원가입
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          phone: testPhone,
          otpToken,
          password: 'TestPassword123!',
          username: 'testuser1',
        })
        .expect(201);

      // 동일한 번호로 새 OTP 토큰 발급
      await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({
          phone: testPhone,
          purpose: 'signup',
        })
        .expect(204);

      const newOtpRequest = await prisma.otpRequest.findFirst({
        where: { phone: testPhone, purpose: 'signup', usedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      const newVerifyResponse = await request(app.getHttpServer())
        .post('/auth/phone/verify')
        .send({
          phone: testPhone,
          code: newOtpRequest!.code,
        })
        .expect(200);

      // 두 번째 회원가입 시도 (중복 번호)
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          phone: testPhone,
          otpToken: newVerifyResponse.body.otpToken,
          password: 'TestPassword123!',
          username: 'testuser2',
        })
        .expect(409);

      expect(response.body.code).toBe('PHONE_ALREADY_REGISTERED');
    });
  });

  describe('Company Invite Code', () => {
    const testPhone = '01087654321';
    let otpToken: string;
    let testCompany: any;

    beforeEach(async () => {
      // 테스트 데이터 정리
      await prisma.user.deleteMany({
        where: { phone: testPhone },
      });
      
      await prisma.company.deleteMany({
        where: { name: 'Test Company' },
      });

      // 테스트 회사 생성
      testCompany = await prisma.company.create({
        data: {
          name: 'Test Company',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1년 후
          inviteCode: 'TESTCODE123',
        },
      });

      // OTP 토큰 발급
      await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({
          phone: testPhone,
          purpose: 'signup',
        })
        .expect(204);

      const otpRequest = await prisma.otpRequest.findFirst({
        where: { phone: testPhone, purpose: 'signup' },
        orderBy: { createdAt: 'desc' },
      });

      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/phone/verify')
        .send({
          phone: testPhone,
          code: otpRequest!.code,
        })
        .expect(200);

      otpToken = verifyResponse.body.otpToken;
    });

    it('should assign user to company with valid invite code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          phone: testPhone,
          otpToken,
          password: 'TestPassword123!',
          username: 'testuser',
          inviteCode: 'TESTCODE123',
        })
        .expect(201);

      // 사용자가 회사에 배정되었는지 확인
      const user = await prisma.user.findUnique({
        where: { phone: testPhone },
        include: { company: true },
      });

      expect(user?.companyId).toBe(testCompany.id);
      expect(user?.company?.name).toBe('Test Company');
    });

    it('should reject invalid invite code', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          phone: testPhone,
          otpToken,
          password: 'TestPassword123!',
          username: 'testuser',
          inviteCode: 'INVALIDCODE',
        })
        .expect(422);

      expect(response.body.code).toBe('INVALID_INVITE_CODE');
    });
  });
});









