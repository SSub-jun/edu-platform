import { Module } from '@nestjs/common';
import { AdminCompanyController } from './admin-company.controller';
import { AdminCompanyService } from './admin-company.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { AdminCohortController } from './admin-cohort.controller';
import { AdminCohortService } from './admin-cohort.service';
import { AdminLessonController } from './admin-lesson.controller';
import { AdminLessonService } from './admin-lesson.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminCompanyController, AdminUserController, AdminCohortController, AdminLessonController],
  providers: [AdminCompanyService, AdminUserService, AdminCohortService, AdminLessonService],
  exports: [AdminCompanyService, AdminUserService, AdminCohortService, AdminLessonService],
})
export class AdminModule {}
