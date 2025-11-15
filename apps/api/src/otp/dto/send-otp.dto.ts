import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';

export enum OtpPurpose {
  SIGNUP = 'signup',
}

export class SendOtpDto {
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
    description: 'OTP 목적',
    enum: OtpPurpose,
    default: OtpPurpose.SIGNUP,
    required: false,
  })
  @IsOptional()
  @IsEnum(OtpPurpose)
  purpose?: OtpPurpose = OtpPurpose.SIGNUP;
}










