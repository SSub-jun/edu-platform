import { Module } from '@nestjs/common';
import { RootHealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PortalModule } from './portal/portal.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './common/prisma.module';
import { AdminGuard } from './common/guards/admin.guard';
import { ParticipantGuard } from './common/guards/participant.guard';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { LocalStrategy } from './common/strategies/local.strategy';
import { envValidationSchema } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    JwtModule.register({
      secret: process.env.PORTAL_JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    PrismaModule,
    PortalModule,
    HealthModule,
  ],
  controllers: [RootHealthController],
  providers: [
    AdminGuard,
    ParticipantGuard,
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AppModule {}
