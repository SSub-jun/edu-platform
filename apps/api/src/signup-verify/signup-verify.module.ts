import { Module } from '@nestjs/common';
import { SignupVerifyController } from './signup-verify.controller';

@Module({
  controllers: [SignupVerifyController],
})
export class SignupVerifyModule {}
