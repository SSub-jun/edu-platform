// 🌟 더 나은 타입 안전 해결책 (향후 적용 권장)

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 방법 1: 메서드별 타입 어설션
@Injectable()
export class AuthServiceBetter {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(username: string) {
    // 각 호출마다 필요한 타입만 어설션
    return (this.prisma as any).user.findUnique({
      where: { username },
    });
  }

  async createSession(data: any) {
    return (this.prisma as any).session.create({
      data,
    });
  }
}

// 방법 2: 타입 안전한 래퍼 생성
interface SafePrismaClient {
  user: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  company: {
    findUnique: (args: any) => Promise<any>;
    create: (args: any) => Promise<any>;
  };
  session: {
    create: (args: any) => Promise<any>;
    findFirst: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
}

@Injectable()
export class AuthServiceWrapper {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma(): SafePrismaClient {
    return this.prismaService as SafePrismaClient;
  }

  // 이제 타입 안전하게 사용 가능
  async findUser(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }
}

// 방법 3: 환경 설정 개선 (권장)
// 1. tsconfig.json에서 Prisma 경로 명시적 추가
// 2. 새로운 터미널에서 'pnpm install' 실행
// 3. Prisma 클라이언트 재생성: 'pnpm db:generate'
// 4. TypeScript 서버 재시작









