import { Module } from '@nestjs/common';
import { QnaController } from './qna.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QnaController],
})
export class QnaModule {}

