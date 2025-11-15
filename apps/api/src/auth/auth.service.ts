import { Injectable, UnauthorizedException, BadRequestException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: 'admin' | 'instructor' | 'student';
  user: {
    id: string;
    username: string;
    phone: string;
    role: 'admin' | 'instructor' | 'student';
    companyId?: string;
  };
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly otpService: OtpService,
  ) {}

  // PrismaService를 직접 사용 (타입 안전성 유지)
  private get prisma() {
    // PrismaService는 PrismaClient를 확장하므로 모든 모델에 접근 가능
    // TypeScript 컴파일러가 인식하지 못하는 경우 런타임에는 정상 작동
    return this.prismaService as any; // TODO: Prisma 타입 해결 시 개선 필요
  }

  async login(username: string, password: string, req: Request): Promise<LoginResponse> {
    // 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 비밀번호 검증 (BCrypt)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 단일세션: 기존 유효한 세션들 만료 처리
    await this.revokeExistingSessions(user.id);

    // 새 세션 생성
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        deviceInfo,
        ip,
        refreshTokenHash,
      },
    });

    // JWT 토큰 발급
    const accessToken = this.jwtService.sign(
      { 
        sub: user.id, 
        username: user.username, 
        role: user.role,
        sessionId: session.id,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_TTL', '15m'),
      }
    );

    // 사용자 마지막 로그인 시간 업데이트
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      role: user.role,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone || '',
        role: user.role,
        companyId: user.companyId || undefined,
      },
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    // Refresh 토큰 검증
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 세션 조회 및 검증
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    // Refresh 토큰 해시 검증
    const isTokenValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 새 토큰 발급
    const newRefreshToken = this.generateRefreshToken();
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    // 세션 업데이트 (기존 토큰 무효화)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { 
        refreshTokenHash: newRefreshTokenHash,
        revokedAt: new Date(), // 기존 토큰 무효화
      },
    });

    // 새 세션 생성
    const newSession = await this.prisma.session.create({
      data: {
        userId: session.userId,
        deviceInfo: session.deviceInfo,
        ip: session.ip,
        refreshTokenHash: newRefreshTokenHash,
      },
    });

    const accessToken = this.jwtService.sign(
      { 
        sub: session.user.id, 
        username: session.user.username, 
        role: session.user.role,
        sessionId: newSession.id,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_TTL', '15m'),
      }
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, sessionId: string): Promise<{ message: string }> {
    // 현재 세션 폐기
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Logged out successfully' };
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    return !!(session && !session.revokedAt);
  }

  private async revokeExistingSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private generateRefreshToken(): string {
    return this.jwtService.sign(
      { 
        type: 'refresh',
        timestamp: Date.now(),
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_TTL', '7d'),
      }
    );
  }

  async register(
    phone: string,
    otpToken: string,
    password: string,
    name: string,
    inviteCode?: string,
    req?: Request,
  ): Promise<LoginResponse> {
    // 1. OTP 토큰 검증
    let otpVerification;
    try {
      otpVerification = await this.otpService.verifyOtpToken(otpToken);
    } catch (error) {
      throw new UnprocessableEntityException({
        code: 'INVALID_OTP',
        message: '유효하지 않은 인증 토큰입니다.',
      });
    }

    // 2. 전화번호 일치 검증
    if (otpVerification.phone !== phone) {
      throw new UnprocessableEntityException({
        code: 'INVALID_OTP',
        message: '인증된 전화번호와 일치하지 않습니다.',
      });
    }

    // 3. 비밀번호 정책 서버측 검증
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(password)) {
      throw new UnprocessableEntityException({
        code: 'WEAK_PASSWORD',
        message: '비밀번호는 최소 8자이며, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해야 합니다.',
      });
    }

    // 4. 전화번호 중복 체크
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'PHONE_ALREADY_REGISTERED',
        message: '이미 가입된 전화번호입니다.',
      });
    }

    // 5. 학생 회원가입 - 휴대폰 번호가 username이 됨
    const finalUsername = phone; // 학생은 항상 휴대폰 번호가 ID

    // 6. 초대코드 검증 및 회사 조회
    let companyId: string | undefined;
    if (inviteCode) {
      const company = await this.prisma.company.findUnique({
        where: { inviteCode },
      });

      if (!company) {
        throw new UnprocessableEntityException({
          code: 'INVALID_INVITE_CODE',
          message: '유효하지 않은 초대코드입니다.',
        });
      }

      companyId = company.id;
    }
    // 초대코드가 없으면 companyId는 undefined (미배정 상태)

    // 7. 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 10);

    // 8. 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        username: finalUsername,
        passwordHash,
        name,
        phone,
        phoneVerifiedAt: new Date(),
        companyId,
        role: 'student', // 기본 역할
      },
    });

    // 9. 로그인 토큰 발급 (기존 로그인 로직 재사용)
    const deviceInfo = req?.headers['user-agent'] || 'Unknown';
    const ip = req?.ip || req?.connection?.remoteAddress || 'Unknown';
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        deviceInfo,
        ip,
        refreshTokenHash,
      },
    });

    const accessToken = this.jwtService.sign(
      { 
        sub: user.id, 
        username: user.username, 
        role: user.role,
        sessionId: session.id,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_TTL', '15m'),
      }
    );

    // 10. 마지막 로그인 시간 업데이트
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      role: user.role,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone || '',
        role: user.role,
        companyId: user.companyId || undefined,
      },
    };
  }

  async assignCompany(userId: string, inviteCode: string): Promise<{ success: boolean; company: { id: string; name: string } }> {
    // 1. 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 2. 이미 회사에 배정된 사용자는 변경 불가
    if (user.companyId) {
      throw new ConflictException({
        code: 'ALREADY_ASSIGNED',
        message: '이미 회사에 배정된 사용자입니다.',
      });
    }

    // 3. 초대코드로 회사 조회
    const company = await this.prisma.company.findUnique({
      where: { inviteCode },
    });

    if (!company) {
      throw new UnprocessableEntityException({
        code: 'INVALID_INVITE_CODE',
        message: '유효하지 않은 초대코드입니다.',
      });
    }

    if (!company.isActive) {
      throw new UnprocessableEntityException({
        code: 'COMPANY_INACTIVE',
        message: '비활성화된 회사입니다.',
      });
    }

    // 4. 사용자에게 회사 배정
    await this.prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id },
    });

    return {
      success: true,
      company: {
        id: company.id,
        name: company.name,
      },
    };
  }

  // Mock 모드용 메서드 (기존 호환성 유지)
  async loginWithMock(username: string, password: string): Promise<LoginResponse> {
    const mockUsers = [
      { id: 'admin', pwd: 'admin123', role: 'admin' as const },
      { id: 'teacher', pwd: 'teach123', role: 'instructor' as const },
      { id: 'user', pwd: 'user123', role: 'student' as const },
    ];

    const user = mockUsers.find(u => u.id === username && u.pwd === password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: 'dev-token',
      refreshToken: 'dev-refresh-token',
      role: user.role,
      user: {
        id: user.id,
        username: user.id,
        phone: '01000000000', // Mock 데이터
        role: user.role,
        companyId: undefined, // Mock 사용자는 미배정
      },
    };
  }
}

