import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { sub: userId, sessionId } = payload;
    // Debug logging for smoke investigation
    // eslint-disable-next-line no-console
    console.log('[JwtStrategy.validate] payload', { userId, sessionId });
    
    if (!userId || !sessionId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 사용자 존재 여부 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 세션 유효성 확인
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    const validated = {
      sub: user.id,
      username: user.username,
      role: user.role,
      sessionId: session.id,
    };
    // eslint-disable-next-line no-console
    console.log('[JwtStrategy.validate] validated', validated);
    return validated;
  }
}
