import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { DevAuthGuard } from '../guards/dev-auth.guard';

class ExamSubmitDto {
  answers: Record<string, string>;
}

@ApiTags('Exam')
@Controller('exam')
export class ExamController {
  @Post('subjects/:id/start')
  @UseGuards(DevAuthGuard)
  @ApiOperation({ summary: '시험 시작' })
  @ApiParam({ name: 'id', description: '과목 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '시험 시작 성공',
    schema: {
      type: 'object',
      properties: {
        attemptId: { type: 'string', example: 'mock' },
        questions: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'q1' },
              stem: { type: 'string', example: '문제 내용...' },
              choices: { type: 'array', items: { type: 'string' }, example: ['a', 'b', 'c', 'd'] }
            }
          }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: '인증 토큰이 없거나 유효하지 않음' })
  startExam(@Param('id') subjectId: string) {
    return {
      attemptId: 'mock',
      questions: [
        {
          id: 'q1',
          stem: '문제 내용...',
          choices: ['a', 'b', 'c', 'd']
        }
      ]
    };
  }

  @Post('attempts/:id/submit')
  @UseGuards(DevAuthGuard)
  @ApiOperation({ summary: '시험 제출' })
  @ApiParam({ name: 'id', description: '시도 ID' })
  @ApiBody({ type: ExamSubmitDto })
  @ApiResponse({ 
    status: 200, 
    description: '시험 제출 성공',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', example: 80 },
        progress: { type: 'number', example: 90 },
        finalScore: { type: 'number', example: 80 },
        passed: { type: 'boolean', example: true }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: '인증 토큰이 없거나 유효하지 않음' })
  submitExam(@Param('id') attemptId: string, @Body() body: ExamSubmitDto) {
    return {
      score: 80,
      progress: 90,
      finalScore: 80,
      passed: true
    };
  }

  @Post('subjects/:id/retake')
  @UseGuards(DevAuthGuard)
  @ApiOperation({ summary: '시험 재응시 가능 여부 확인' })
  @ApiParam({ name: 'id', description: '과목 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '재응시 가능 여부 확인 성공',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: true }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: '인증 토큰이 없거나 유효하지 않음' })
  checkRetake(@Param('id') subjectId: string) {
    return {
      available: true
    };
  }
}
