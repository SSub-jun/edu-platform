import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { SmsGateway } from './sms.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}), // JWT 설정은 OtpService에서 동적으로 처리
    PrismaModule,
  ],
  controllers: [OtpController],
  providers: [OtpService, SmsGateway],
  exports: [OtpService],
})
export class OtpModule {}
