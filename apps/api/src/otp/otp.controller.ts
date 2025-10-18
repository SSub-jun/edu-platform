import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OtpService } from './otp.service';

@ApiTags('OTP - Development')
@Controller('dev/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Get('recent')
  @ApiOperation({ 
    summary: '최근 OTP 코드 조회 (개발 환경 전용)', 
    description: '지정된 휴대폰 번호의 최근 유효한 OTP 코드를 조회합니다. 개발 환경에서만 사용 가능합니다.' 
  })
  @ApiQuery({ 
    name: 'phone', 
    description: '휴대폰 번호', 
    example: '01012345678' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP 코드 조회 성공',
    schema: {
      example: {
        code: '123456',
        expiresAt: '2024-08-24T07:35:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '유효한 OTP 코드가 없음',
    schema: {
      example: {
        message: 'No valid OTP found'
      }
    }
  })
  async getRecentOtp(@Query('phone') phone: string) {
    const otp = await this.otpService.getRecentOtp(phone);
    
    if (!otp) {
      return { 
        message: 'No valid OTP found',
        phone,
        hint: 'Send OTP first using POST /auth/phone/send-otp'
      };
    }

    return {
      phone,
      code: otp.code,
      expiresAt: otp.expiresAt,
    };
  }
}







