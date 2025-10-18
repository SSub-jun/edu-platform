import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('signup-verify')
@Controller('signup/verify')
export class SignupVerifyController {
  @Post('request')
  @ApiOperation({ summary: '본인인증 요청' })
  @ApiResponse({ 
    status: 200, 
    description: '본인인증 요청 성공',
    schema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', example: 'mock' }
      }
    }
  })
  async requestVerification(@Body() body: any) {
    return { requestId: 'mock' };
  }

  @Post('confirm')
  @ApiOperation({ summary: '본인인증 확인' })
  @ApiResponse({ 
    status: 200, 
    description: '본인인증 확인 성공',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true }
      }
    }
  })
  async confirmVerification(@Body() body: any) {
    return { ok: true };
  }
}
