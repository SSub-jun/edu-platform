import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { ExamModule } from './exam/exam.module';
import { SignupVerifyModule } from './signup-verify/signup-verify.module';
import { MeModule } from './me/me.module';
import { QnaModule } from './qna/qna.module';
import { InstructorModule } from './instructor/instructor.module';
import { PortalModule } from './portal/portal.module';
import { MediaModule } from './media/media.module';
import { SupabaseModule } from './supabase/supabase.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    SupabaseModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    CompanyModule,
    AdminModule,
    ProgressModule,
    ExamModule,
    SignupVerifyModule,
    MeModule,
    QnaModule,
    InstructorModule,
    PortalModule,
    MediaModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [AppService],
})
export class AppModule {}
