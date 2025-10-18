import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '휴대폰 번호 (하이픈 없이 숫자만)',
    example: '01012345678',
  })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, {
    message: '올바른 휴대폰 번호 형식이 아닙니다 (01012345678)',
  })
  phone: string;

  @ApiProperty({
    description: 'OTP 인증 토큰 (휴대폰 인증 완료 후 발급받은 토큰)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  otpToken: string;

  @ApiProperty({
    description: '비밀번호 (최소 8자, 대문자/소문자/숫자/특수문자 각 1+ 포함)',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: '비밀번호는 최소 8자이며, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해야 합니다',
  })
  password: string;

  // username 필드 제거 - 학생 회원가입에서는 항상 휴대폰 번호가 ID가 됨

  @ApiProperty({
    description: '이메일 주소 (선택사항)',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: '회사 초대코드 (선택사항)',
    example: 'COMPANY123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6,12}$/, {
    message: '초대코드는 6-12자리 영대문자와 숫자 조합이어야 합니다',
  })
  inviteCode?: string;
}

export class RegisterResponseDto {
  @ApiProperty({ description: 'Access Token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh Token' })
  refreshToken: string;

  @ApiProperty({ description: '사용자 정보' })
  user: {
    id: string;
    username: string;
    phone: string;
    role: string;
    companyId?: string;
  };
}

export class VerifyOtpResponseDto {
  @ApiProperty({ description: 'OTP 인증 토큰 (회원가입 시 사용)' })
  otpToken: string;
}
