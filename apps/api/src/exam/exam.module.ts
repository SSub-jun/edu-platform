import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgressModule } from '../progress/progress.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ProgressModule, AuthModule],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService]
})
export class ExamModule {}
