import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { PublicController } from './public.controller';
import { ExamService } from './exam.service';
import { AttemptService } from './attempt.service';
import { AuthService } from '../common/auth.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('PORTAL_JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AdminController, PublicController],
  providers: [ExamService, AttemptService, AuthService],
  exports: [ExamService, AttemptService, AuthService],
})
export class PortalModule {}
