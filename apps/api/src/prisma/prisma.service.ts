import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    // 헬스체크: SELECT 1 쿼리 실행
    try {
      await this.$queryRaw`SELECT 1`;
      console.log('✅ Prisma database connection successful');
    } catch (error) {
      console.error('❌ Prisma database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // 헬스체크 메서드
  async healthCheck() {
    try {
      // 기본 연결 확인
      await this.$queryRaw`SELECT 1`;
      
      // 마이그레이션 상태 확인 (선택적)
      let migrationStatus = 'unknown';
      try {
        const migrations = await this.$queryRaw`
          SELECT name, finished_at 
          FROM _prisma_migrations 
          ORDER BY finished_at DESC 
          LIMIT 1
        `;
        if (migrations && Array.isArray(migrations) && migrations.length > 0) {
          migrationStatus = 'up-to-date';
        }
      } catch (migrationError) {
        // 마이그레이션 테이블이 없거나 접근할 수 없는 경우
        migrationStatus = 'unknown';
      }
      
      return { 
        status: 'healthy', 
        database: 'connected',
        migrationStatus 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        database: 'disconnected', 
        migrationStatus: 'unknown',
        error: error.message 
      };
    }
  }
}
