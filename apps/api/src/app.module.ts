import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { MediaController } from './media/media.controller';
import { ProgressController } from './progress/progress.controller';
import { ExamController } from './exam/exam.controller';
import { QnaController } from './qna/qna.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  controllers: [
    AppController,
    HealthController,
    AuthController,
    MediaController,
    ProgressController,
    ExamController,
    QnaController,
  ],
  providers: [AppService, AuthService],
})
export class AppModule {}
