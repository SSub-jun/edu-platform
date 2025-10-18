import {
  Injectable,
  Logger,
  BadRequestException,
  UnprocessableEntityException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsGateway } from './sms.gateway';
import { OtpPurpose } from '@prisma/client';
import { OtpPurpose as DtoOtpPurpose } from './dto/send-otp.dto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly smsGateway: SmsGateway,
  ) {}

  async sendOtp(phone: string, purpose: DtoOtpPurpose = DtoOtpPurpose.SIGNUP): Promise<void> {
    const resendInterval = this.config.get<number>('OTP_RESEND_INTERVAL_SECONDS', 30);
    const dailyLimit = this.config.get<number>('OTP_DAILY_LIMIT', 10);
    const ttlSeconds = this.config.get<number>('OTP_CODE_TTL_SECONDS', 300);

    // DTO enum을 Prisma enum으로 변환
    const prismaPurpose: OtpPurpose = purpose === DtoOtpPurpose.SIGNUP ? OtpPurpose.signup : OtpPurpose.signup;

    // 1. 재전송 간격 체크 (분당 제한)
    const recentRequest = await this.prisma.otpRequest.findFirst({
      where: {
        phone,
        purpose,
        createdAt: {
          gte: new Date(Date.now() - resendInterval * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentRequest) {
      const remainingSeconds = Math.ceil(
        (recentRequest.createdAt.getTime() + resendInterval * 1000 - Date.now()) / 1000,
      );
      throw new HttpException({
        code: 'RATE_LIMITED',
        message: `${remainingSeconds}초 후 재전송 가능합니다`,
        remainingSeconds,
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    // 2. 일일 제한 체크
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.otpRequest.count({
      where: {
        phone,
        purpose,
        createdAt: {
          gte: today,
        },
      },
    });

    if (todayCount >= dailyLimit) {
      throw new HttpException({
        code: 'RATE_LIMITED',
        message: `일일 인증번호 요청 한도(${dailyLimit}회)를 초과했습니다`,
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    // 3. 6자리 숫자 코드 생성
    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // 4. OTP 요청 저장
    await this.prisma.otpRequest.create({
      data: {
        phone,
        code,
        purpose: prismaPurpose,
        expiresAt,
      },
    });

    // 5. SMS 발송
    const message = this.smsGateway.createOtpMessage(code);
    await this.smsGateway.sendSms({ phone, message });

    this.logger.log(`OTP sent to ${phone} for purpose: ${prismaPurpose}`);
  }

  async verifyOtp(phone: string, code: string): Promise<{ otpToken: string }> {
    // 1. 유효한 OTP 요청 조회 (미사용, 기간 내)
    const otpRequest = await this.prisma.otpRequest.findFirst({
      where: {
        phone,
        code,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRequest) {
      // 2. 실패 시 attempts 증가 (잘못된 코드인 경우만)
      await this.prisma.otpRequest.updateMany({
        where: {
          phone,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          attempts: { increment: 1 },
        },
      });

      // 만료된 코드인지 확인
      const expiredRequest = await this.prisma.otpRequest.findFirst({
        where: {
          phone,
          code,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (expiredRequest && expiredRequest.expiresAt <= new Date()) {
        throw new UnprocessableEntityException({
          code: 'EXPIRED_OTP',
          message: '인증번호가 만료되었습니다. 새로운 인증번호를 요청해주세요.',
        });
      }

      throw new UnprocessableEntityException({
        code: 'INVALID_OTP',
        message: '잘못된 인증번호입니다.',
      });
    }

    // 3. 성공 시 사용 처리
    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { usedAt: new Date() },
    });

    // 4. OTP JWT 토큰 발급 (10분 유효)
    const otpSecret = this.config.get<string>('AUTH_OTP_JWT_SECRET');
    if (!otpSecret) {
      throw new Error('AUTH_OTP_JWT_SECRET environment variable is not set');
    }

    const payload = {
      phone,
      purpose: otpRequest.purpose,
      verified: true,
    };

    const otpToken = this.jwtService.sign(payload, {
      secret: otpSecret,
      expiresIn: '10m',
    });

    this.logger.log(`OTP verified successfully for ${phone}`);

    return { otpToken };
  }

  async verifyOtpToken(token: string): Promise<{ phone: string; purpose: string }> {
    try {
      const otpSecret = this.config.get<string>('AUTH_OTP_JWT_SECRET');
      if (!otpSecret) {
        throw new Error('AUTH_OTP_JWT_SECRET environment variable is not set');
      }

      const payload = this.jwtService.verify(token, { secret: otpSecret });
      
      if (!payload.verified || !payload.phone || !payload.purpose) {
        throw new UnprocessableEntityException({
          code: 'INVALID_OTP',
          message: '유효하지 않은 인증 토큰입니다.',
        });
      }

      return {
        phone: payload.phone,
        purpose: payload.purpose,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnprocessableEntityException({
          code: 'EXPIRED_OTP',
          message: '인증 토큰이 만료되었습니다. 다시 인증해주세요.',
        });
      }
      
      throw new UnprocessableEntityException({
        code: 'INVALID_OTP',
        message: '유효하지 않은 인증 토큰입니다.',
      });
    }
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 개발 환경 전용: 최근 OTP 코드 조회
  async getRecentOtp(phone: string): Promise<{ code: string; expiresAt: Date } | null> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This endpoint is only available in development');
    }

    const recentOtp = await this.prisma.otpRequest.findFirst({
      where: {
        phone,
        purpose: OtpPurpose.signup,
        usedAt: null, // 사용되지 않은 것만
        expiresAt: {
          gt: new Date(), // 만료되지 않은 것만
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!recentOtp) {
      return null;
    }

    return {
      code: recentOtp.code,
      expiresAt: recentOtp.expiresAt,
    };
  }
}
