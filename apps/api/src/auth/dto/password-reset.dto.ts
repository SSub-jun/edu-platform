import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class PasswordSendOtpDto {
  @ApiProperty({
    description: '휴대폰 번호 (하이픈 없이 숫자만)',
    example: '01012345678',
  })
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, {
    message: '올바른 휴대폰 번호 형식이 아닙니다 (01012345678)',
  })
  phone: string;
}

export class PasswordVerifyOtpDto {
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
    description: '6자리 인증번호',
    example: '123456',
  })
  @IsString()
  @Matches(/^[0-9]{6}$/, {
    message: '인증번호는 6자리 숫자여야 합니다.',
  })
  code: string;
}

export class PasswordResetDto {
  @ApiProperty({ description: 'OTP 인증 후 발급받은 재설정 토큰' })
  @IsString()
  resetToken: string;

  @ApiProperty({
    description: '새 비밀번호 (8자 이상, 대문자/소문자/숫자/특수문자 포함)',
  })
  @IsString()
  newPassword: string;
}
