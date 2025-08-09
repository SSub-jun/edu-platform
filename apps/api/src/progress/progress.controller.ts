import { Controller, Get, Post, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { DevAuthGuard } from '../guards/dev-auth.guard';

class ProgressPingDto {
  lessonId: string;
  partId?: string;
  playedMs: number;
}

@ApiTags('Progress')
@Controller('progress')
@UseGuards(DevAuthGuard)
export class ProgressController {
  @Post('ping')
  @HttpCode(200)
  @ApiOperation({ summary: '진행률 업데이트' })
  @ApiBody({ type: ProgressPingDto })
  @ApiResponse({ 
    status: 200, 
    description: '진행률 업데이트 성공',
    schema: {
      type: 'object',
      properties: {
        progressPercent: { type: 'number', example: 50 }
      }
    }
  })
  ping(@Body() body: ProgressPingDto) {
    return {
      progressPercent: 50
    };
  }

  @Get('next-available')
  @ApiOperation({ summary: '다음 사용 가능한 레슨 조회' })
  @ApiQuery({ name: 'subjectId', required: true, description: '과목 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '다음 레슨 조회 성공',
    schema: {
      type: 'object',
      properties: {
        current: { type: 'object', nullable: true, example: null },
        next: { type: 'object', example: { lessonId: 'L2' } },
        lockedReason: { type: 'string', nullable: true, example: null }
      }
    }
  })
  getNextAvailable(@Query('subjectId') subjectId: string) {
    return {
      current: null,
      next: { lessonId: 'L2' },
      lockedReason: null
    };
  }
}
