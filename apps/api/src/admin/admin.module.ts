import { Module } from '@nestjs/common';
import { AdminCompanyController } from './admin-company.controller';
import { AdminCompanyService } from './admin-company.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminCompanyController, AdminUserController],
  providers: [AdminCompanyService, AdminUserService],
  exports: [AdminCompanyService, AdminUserService],
})
export class AdminModule {}
