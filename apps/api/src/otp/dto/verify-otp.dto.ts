import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
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
    description: '6자리 OTP 코드',
    example: '123456',
  })
  @IsString()
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP 코드는 6자리 숫자여야 합니다',
  })
  code: string;
}







