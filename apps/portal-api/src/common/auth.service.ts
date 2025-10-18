import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateAdmin(username: string, password: string): Promise<any> {
    const adminUser = process.env.PORTAL_ADMIN_USER;
    const adminPass = process.env.PORTAL_ADMIN_PASS;
    
    if (username === adminUser && password === adminPass) {
      return {
        id: 'admin',
        username: adminUser,
        role: 'admin',
      };
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async generateParticipantToken(participantId: string, sessionId: string) {
    const payload = {
      sub: participantId,
      sessionId,
      role: 'participant',
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}





