import { Injectable, UnauthorizedException } from '@nestjs/common';

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
  private readonly mockUsers: MockUser[] = [
    { id: 'admin', pwd: 'admin123', role: 'admin' },
    { id: 'teacher', pwd: 'teach123', role: 'instructor' },
    { id: 'user', pwd: 'user123', role: 'student' },
  ];

  async login(id: string, password: string): Promise<LoginResponse> {
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

