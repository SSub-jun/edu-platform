import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '헬스 체크' })
  @ApiResponse({ 
    status: 200, 
    description: '서버 상태 확인',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        ts: { type: 'number', example: 1703123456789 }
      }
    }
  })
  check() {
    return {
      ok: true,
      ts: Date.now()
    };
  }
}
