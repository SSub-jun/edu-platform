import { Module } from '@nestjs/common';
import { InstructorController } from './instructor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InstructorController],
})
export class InstructorModule {}

