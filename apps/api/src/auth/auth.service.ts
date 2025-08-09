import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MockUser {
  id: string;
  pwd: string;
  role: 'admin' | 'instructor' | 'student';
}

interface LoginResponse {
  accessToken: string;
  role: 'admin' | 'instructor' | 'student';
}

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  private readonly mockUsers: MockUser[] = [
    { id: 'admin', pwd: 'admin123', role: 'admin' },
    { id: 'teacher', pwd: 'teach123', role: 'instructor' },
    { id: 'user', pwd: 'user123', role: 'student' },
  ];

  async login(id: string, password: string): Promise<LoginResponse> {
    const authMode = this.configService.get<string>('AUTH_MODE', 'mock');
    
    if (authMode === 'db') {
      // TODO: DB 기반 인증 로직 구현
      // 현재는 mock 경로만 실행
      throw new UnauthorizedException('DB authentication not implemented yet');
    }
    
    // Mock 인증 로직 (기본값)
    const user = this.mockUsers.find(
      (u) => u.id === id && u.pwd === password
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: 'dev-token',
      role: user.role,
    };
  }

  async signup(id: string, password: string, phone: string): Promise<{ ok: boolean }> {
    // Mock 구현 - 실제로는 사용자 등록 로직
    return { ok: true };
  }

  getMockUsers(): MockUser[] {
    return this.mockUsers;
  }
}

