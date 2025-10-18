import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ModeAwareAuthGuard } from '../guards/mode-aware-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const AUTH_MODE_KEY = 'authMode';
export const AUTH_MODE_DB = 'db';
export const AUTH_MODE_MOCK = 'mock';
export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export function Auth() {
  return applyDecorators(
    // AUTH_MODE_DB 대신 현재 환경변수 사용하도록 수정
    UseGuards(JwtAuthGuard)
  );
}

export function AuthMock() {
  return applyDecorators(
    SetMetadata(AUTH_MODE_KEY, AUTH_MODE_MOCK),
    UseGuards(ModeAwareAuthGuard)
  );
}
