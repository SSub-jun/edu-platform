import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AUTH_MODE_KEY, AUTH_MODE_DB, AUTH_MODE_MOCK } from '../decorators/auth.decorator';

@Injectable()
export class ModeAwareAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAuthMode = this.reflector.getAllAndOverride<string>(AUTH_MODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const currentAuthMode = this.configService.get<string>('AUTH_MODE', 'mock');
    const request = context.switchToHttp().getRequest<Request>();

    // 메타데이터가 없으면 현재 AUTH_MODE 사용
    if (!requiredAuthMode) {
      return this.handleAuthMode(currentAuthMode, request);
    }

    // 메타데이터와 현재 AUTH_MODE가 일치하는지 확인
    if (requiredAuthMode === currentAuthMode) {
      return this.handleAuthMode(currentAuthMode, request);
    }

    // AUTH_MODE가 일치하지 않으면 인증 실패
    throw new UnauthorizedException(`Authentication mode mismatch. Required: ${requiredAuthMode}, Current: ${currentAuthMode}`);
  }

  private handleAuthMode(authMode: string, request: Request): boolean {
    if (authMode === AUTH_MODE_MOCK) {
      // Mock 모드: DevAuthGuard와 동일한 로직
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('Authorization header is missing');
      }

      if (authHeader !== 'Bearer dev-token') {
        throw new UnauthorizedException('Invalid token');
      }

      // Mock 사용자 정보 설정
      (request as any).user = {
        sub: 'mock-user-id',
        username: 'mock-user',
        role: 'student',
        sessionId: 'mock-session-id',
      };

      return true;
    } else if (authMode === AUTH_MODE_DB) {
      // DB 모드: JWT 토큰 검증은 JwtAuthGuard에서 처리
      // 이 가드는 JwtAuthGuard와 함께 사용되어야 함
      return true;
    }

    // 알 수 없는 AUTH_MODE
    throw new UnauthorizedException('Invalid AUTH_MODE configuration');
  }
}
