import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get('ip')
  @ApiOperation({ summary: '서버 외부 IP 확인 (SOLAPI IP 등록용)' })
  async getServerIP() {
    try {
      const https = require('https');
      return new Promise((resolve, reject) => {
        https.get('https://api.ipify.org?format=json', (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              resolve({ ip: parsed.ip, note: 'Railway uses dynamic IPs - consider allowing all IPs (0.0.0.0/0) for SOLAPI' });
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });
    } catch (error) {
      return { error: 'Failed to get IP', message: error.message };
    }
  }

  @Get()
  @ApiOperation({ 
    summary: '헬스 체크',
    description: '서버 상태 및 데이터베이스 연결 상태를 확인합니다. 운영 환경에서는 기본 정보만 제공됩니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '서버 상태 확인',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        ts: { type: 'number', example: 1703123456789 },
        database: { 
          type: 'object', 
          example: { 
            status: 'healthy', 
            database: 'connected',
            migrationStatus: 'up-to-date'
          } 
        },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' }
      }
    }
  })
  async check() {
    const dbHealth = await this.prismaService.healthCheck();
    const isProduction = process.env.NODE_ENV === 'production';
    
    const response: any = {
      ok: dbHealth.status === 'healthy',
      ts: Date.now(),
      database: {
        status: dbHealth.status,
        database: dbHealth.database,
        migrationStatus: dbHealth.migrationStatus || 'unknown'
      },
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    // 운영 환경이 아닌 경우에만 상세 정보 제공
    if (!isProduction) {
      try {
        const [userCount, subjectCount, lessonCount, questionCount] = await Promise.all([
          this.prismaService.user.count(),
          this.prismaService.subject.count(),
          this.prismaService.lesson.count(),
          this.prismaService.question.count(),
        ]);

        response.database.counts = {
          users: userCount,
          subjects: subjectCount,
          lessons: lessonCount,
          questions: questionCount,
        };
      } catch (error) {
        response.database.counts = { error: 'Failed to get counts' };
      }
    }
    
    return response;
  }
}
