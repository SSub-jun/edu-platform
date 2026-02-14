import { Controller, Post, Body, HttpStatus, HttpException, Req, UseGuards, HttpCode, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, LoginResponseDto, RefreshResponseDto, LogoutResponseDto } from './dto/auth.dto';
import { RegisterDto, RegisterResponseDto, VerifyOtpResponseDto } from './dto/register.dto';
import { AssignCompanyDto, AssignCompanyResponseDto } from './dto/assign-company.dto';
import { PasswordSendOtpDto, PasswordVerifyOtpDto, PasswordResetDto } from './dto/password-reset.dto';
import { SendOtpDto, OtpPurpose } from '../otp/dto/send-otp.dto';
import { VerifyOtpDto as VerifyDto } from '../otp/dto/verify-otp.dto';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';

/**
 * 인증 컨트롤러
 * 
 * JWT 기반 인증 시스템:
 * - Access Token (짧은 만료시간)
 * - Refresh Token (긴 만료시간)
 * - 단일세션 정책 (동시접속 제한)
 * - BCrypt 비밀번호 해시
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @ApiOperation({ 
    summary: '로그인',
    description: '사용자명과 비밀번호로 로그인합니다. 단일세션 정책으로 기존 세션은 자동 만료됩니다.'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 201, 
    description: '로그인 성공 - Access Token과 Refresh Token 발급',
    type: LoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패 - 잘못된 사용자명 또는 비밀번호'
  })
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.username, loginDto.password, req);
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: '토큰 갱신',
    description: 'Refresh Token을 사용하여 새로운 Access Token과 Refresh Token을 발급받습니다.'
  })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ 
    status: 201, 
    description: '토큰 갱신 성공',
    type: RefreshResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: '토큰 갱신 실패 - 유효하지 않은 Refresh Token'
  })
  async refresh(@Body() refreshDto: RefreshDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '로그아웃',
    description: '현재 세션을 폐기합니다.'
  })
  @ApiResponse({ 
    status: 201, 
    description: '로그아웃 성공',
    type: LogoutResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패 - 유효하지 않은 Access Token'
  })
  async logout(@Req() req: Request & { user: any }): Promise<LogoutResponseDto> {
    const user = req.user;
    return this.authService.logout(user.sub, user.sessionId);
  }

  @Post('phone/send-otp')
  @HttpCode(204)
  @ApiOperation({ 
    summary: 'OTP 전송',
    description: '휴대폰 번호로 인증번호를 전송합니다. 개발환경에서는 서버 콘솔에 출력됩니다.'
  })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({ 
    status: 204, 
    description: 'OTP 전송 성공'
  })
  @ApiResponse({
    status: 409,
    description: '이미 가입된 전화번호 (회원가입 시)',
    schema: {
      example: {
        code: 'PHONE_ALREADY_REGISTERED',
        message: '이미 가입된 전화번호입니다. 로그인해주세요.'
      }
    }
  })
  @ApiResponse({
    status: 429,
    description: '요청 제한 - 재전송 간격 또는 일일 한도 초과',
    schema: {
      example: {
        code: 'RATE_LIMITED',
        message: '30초 후 재전송 가능합니다',
        remainingSeconds: 25
      }
    }
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto): Promise<void> {
    // 회원가입 목적인 경우, 이미 가입된 전화번호인지 확인
    if (sendOtpDto.purpose === OtpPurpose.SIGNUP) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phone: sendOtpDto.phone },
      });

      if (existingUser) {
        throw new ConflictException({
          code: 'PHONE_ALREADY_REGISTERED',
          message: '이미 가입된 전화번호입니다. 로그인해주세요.',
        });
      }
    }

    await this.otpService.sendOtp(sendOtpDto.phone, sendOtpDto.purpose);
  }

  @Post('phone/verify')
  @ApiOperation({ 
    summary: 'OTP 인증',
    description: '휴대폰 인증번호를 검증하고 회원가입용 토큰을 발급합니다.'
  })
  @ApiBody({ type: VerifyDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP 인증 성공',
    type: VerifyOtpResponseDto
  })
  @ApiResponse({ 
    status: 422, 
    description: 'OTP 인증 실패',
    schema: {
      examples: {
        invalid: {
          value: { code: 'INVALID_OTP', message: '잘못된 인증번호입니다.' }
        },
        expired: {
          value: { code: 'EXPIRED_OTP', message: '인증번호가 만료되었습니다.' }
        }
      }
    }
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyDto): Promise<VerifyOtpResponseDto> {
    return this.otpService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.code);
  }

  @Post('register')
  @ApiOperation({ 
    summary: '회원가입',
    description: 'OTP 인증 완료 후 회원가입을 진행합니다. 초대코드가 있으면 해당 회사로 자동 배정됩니다.'
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: '회원가입 성공 - 자동 로그인 처리',
    type: RegisterResponseDto
  })
  @ApiResponse({ 
    status: 409, 
    description: '전화번호 중복',
    schema: {
      example: { code: 'PHONE_ALREADY_REGISTERED', message: '이미 가입된 전화번호입니다.' }
    }
  })
  @ApiResponse({ 
    status: 422, 
    description: '입력 검증 실패',
    schema: {
      examples: {
        weakPassword: {
          value: { code: 'WEAK_PASSWORD', message: '비밀번호는 최소 8자이며, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해야 합니다.' }
        },
        invalidOtp: {
          value: { code: 'INVALID_OTP', message: '유효하지 않은 인증 토큰입니다.' }
        },
        invalidInviteCode: {
          value: { code: 'INVALID_INVITE_CODE', message: '유효하지 않은 초대코드입니다.' }
        }
      }
    }
  })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<RegisterResponseDto> {
    return this.authService.register(
      registerDto.phone,
      registerDto.otpToken,
      registerDto.password,
      registerDto.name,
      registerDto.inviteCode,
      req,
    );
  }

  @Post('assign-company')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: '회사 배정',
    description: '미배정 사용자가 초대코드를 입력하여 회사에 배정됩니다.'
  })
  @ApiBody({ type: AssignCompanyDto })
  @ApiResponse({ 
    status: 201, 
    description: '회사 배정 성공',
    type: AssignCompanyResponseDto
  })
  @ApiResponse({ 
    status: 409, 
    description: '이미 회사에 배정된 사용자',
    schema: {
      example: { code: 'ALREADY_ASSIGNED', message: '이미 회사에 배정된 사용자입니다.' }
    }
  })
  @ApiResponse({ 
    status: 422, 
    description: '입력 검증 실패',
    schema: {
      examples: {
        invalidInviteCode: {
          value: { code: 'INVALID_INVITE_CODE', message: '유효하지 않은 초대코드입니다.' }
        },
        companyInactive: {
          value: { code: 'COMPANY_INACTIVE', message: '비활성화된 회사입니다.' }
        }
      }
    }
  })
  async assignCompany(
    @Body() assignCompanyDto: AssignCompanyDto, 
    @Req() req: Request & { user: any }
  ): Promise<AssignCompanyResponseDto> {
    const userId = req.user.sub;
    return this.authService.assignCompany(userId, assignCompanyDto.inviteCode);
  }

  // ────────────────────────────────────────
  // 비밀번호 재설정
  // ────────────────────────────────────────

  @Post('password/send-otp')
  @HttpCode(200)
  @ApiOperation({
    summary: '비밀번호 재설정 OTP 전송',
    description: '등록된 휴대폰 번호로 비밀번호 재설정용 인증번호를 전송합니다.',
  })
  @ApiBody({ type: PasswordSendOtpDto })
  @ApiResponse({ status: 200, description: 'OTP 전송 요청 처리 완료' })
  async passwordSendOtp(@Body() dto: PasswordSendOtpDto) {
    await this.authService.passwordResetSendOtp(dto.phone);
    return {
      success: true,
      message: '등록된 번호라면 인증번호가 발송됩니다.',
    };
  }

  @Post('password/verify-otp')
  @ApiOperation({
    summary: '비밀번호 재설정 OTP 인증',
    description: '인증번호를 검증하고 비밀번호 재설정 토큰을 발급합니다.',
  })
  @ApiBody({ type: PasswordVerifyOtpDto })
  @ApiResponse({ status: 201, description: '인증 성공 - 재설정 토큰 발급' })
  async passwordVerifyOtp(@Body() dto: PasswordVerifyOtpDto) {
    const result = await this.authService.passwordResetVerifyOtp(
      dto.phone,
      dto.code,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('password/reset')
  @ApiOperation({
    summary: '비밀번호 재설정',
    description: '재설정 토큰과 새 비밀번호로 비밀번호를 변경합니다.',
  })
  @ApiBody({ type: PasswordResetDto })
  @ApiResponse({ status: 201, description: '비밀번호 재설정 성공' })
  async passwordReset(@Body() dto: PasswordResetDto) {
    await this.authService.passwordReset(dto.resetToken, dto.newPassword);
    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
    };
  }
}
