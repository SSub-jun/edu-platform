import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: '헬스 체크' })
  @ApiResponse({ status: 200, description: '서버 상태 정상' })
  async check() {
    return this.healthService.check();
  }

  // Simple health endpoint for platform probes
  @Get('/healthz')
  healthz() {
    return { ok: true };
  }
}




