import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [PrismaModule, ProgressModule],
  controllers: [MeController],
})
export class MeModule {}



