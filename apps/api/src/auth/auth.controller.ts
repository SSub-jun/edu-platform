import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, LoginResponseDto, SignupResponseDto } from './dto/auth.dto';

// 기존 OTP DTO들 (참고용으로 유지)
class OtpRequestDto {
  @ApiProperty({ description: '전화번호' })
  phone: string;
}

class OtpVerifyDto {
  @ApiProperty({ description: '요청 ID' })
  requestId: string;
  @ApiProperty({ description: 'OTP 코드' })
  code: string;
  @ApiProperty({ description: '디바이스 ID' })
  deviceId: string;
}

/**
 * 인증 컨트롤러
 * 
 * AUTH_MODE 환경변수에 따라 인증 방식이 결정됩니다:
 * - AUTH_MODE=mock (기본값): Mock 사용자로 인증
 * - AUTH_MODE=db: 데이터베이스 기반 인증 (구현 예정)
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'ID/PW 로그인' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 201, 
    description: '로그인 성공',
    type: LoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: '인증 실패 - 잘못된 ID/PW'
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.id, loginDto.password);
  }

  @Post('signup')
  @ApiOperation({ summary: '회원가입' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ 
    status: 201, 
    description: '회원가입 성공',
    type: SignupResponseDto
  })
  async signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    return this.authService.signup(signupDto.id, signupDto.password, signupDto.phone || '');
  }

  // 기존 OTP 엔드포인트들 - 410 Gone으로 응답 (프론트엔드 영향 방지)
  @Post('otp/request')
  @ApiOperation({ summary: 'OTP 요청 (비활성화됨)' })
  @ApiBody({ type: OtpRequestDto })
  @ApiResponse({ 
    status: 410, 
    description: 'OTP 기능이 비활성화되었습니다. ID/PW 로그인을 사용하세요.'
  })
  requestOtp() {
    throw new HttpException('OTP 기능이 비활성화되었습니다. ID/PW 로그인을 사용하세요.', HttpStatus.GONE);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'OTP 검증 (비활성화됨)' })
  @ApiBody({ type: OtpVerifyDto })
  @ApiResponse({ 
    status: 410, 
    description: 'OTP 기능이 비활성화되었습니다. ID/PW 로그인을 사용하세요.'
  })
  verifyOtp() {
    throw new HttpException('OTP 기능이 비활성화되었습니다. ID/PW 로그인을 사용하세요.', HttpStatus.GONE);
  }
}
