import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { ModeAwareAuthGuard } from '../auth/guards/mode-aware-auth.guard';
import { Auth } from '../auth/decorators/auth.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { SubmitExamDto, StartExamResponseDto, SubmitExamResponseDto, ResetExamAttemptsDto, ResetExamAttemptsResponseDto, DeleteExamAttemptResponseDto } from './dto/exam.dto';

@ApiTags('Exam')
@Controller('exam')
@Auth()
@ApiBearerAuth()
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get('subjects/:subjectId/check-eligibility')
  @Roles('student')
  @ApiOperation({
    summary: '과목 시험 응시 가능 여부 확인',
    description: '모든 레슨의 진도율이 90% 이상인지, 남은 시도 횟수가 있는지 확인'
  })
  @ApiParam({ name: 'subjectId', description: '과목 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '응시 가능 여부 조회 성공',
    schema: {
      properties: {
        eligible: { type: 'boolean' },
        reason: { type: 'string' },
        remainingAttempts: { type: 'number' },
        lessonProgress: {
          type: 'array',
          items: {
            properties: {
              lessonId: { type: 'string' },
              lessonTitle: { type: 'string' },
              progressPercent: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async checkEligibility(
    @Param('subjectId') subjectId: string,
    @Request() req: any
  ) {
    return await this.examService.checkEligibility(req.user.sub, subjectId);
  }

  @Post('subjects/:subjectId/start')
  @Roles('student')
  @ApiOperation({
    summary: '과목 시험 시작',
    description: '과목 시험을 시작합니다. 모든 레슨 진도율 90% 이상 필요, 최대 3회 응시 가능'
  })
  @ApiParam({ name: 'subjectId', description: '과목 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '시험 시작 성공',
    type: StartExamResponseDto
  })
  @ApiResponse({ status: 403, description: 'PROGRESS_NOT_ENOUGH | ATTEMPT_LIMIT_EXCEEDED' })
  async startExam(
    @Param('subjectId') subjectId: string,
    @Request() req: any
  ): Promise<StartExamResponseDto> {
    return await this.examService.startExam(req.user.sub, subjectId);
  }

  @Post('attempts/:attemptId/submit')
  @Roles('student')
  @ApiOperation({
    summary: '시험 제출',
    description: '시험 답안을 제출하고 자동 채점합니다. 합격 기준 70점 이상'
  })
  @ApiParam({ name: 'attemptId', description: '시험 시도 ID' })
  @ApiBody({ type: SubmitExamDto })
  @ApiResponse({ 
    status: 200, 
    description: '시험 제출 성공',
    type: SubmitExamResponseDto
  })
  @ApiResponse({ status: 404, description: '진행 중인 시험을 찾을 수 없음' })
  @ApiResponse({ status: 409, description: 'DUPLICATE_SUBMISSION' })
  async submitExam(
    @Param('attemptId') attemptId: string,
    @Body() submitDto: SubmitExamDto,
    @Request() req: any
  ): Promise<SubmitExamResponseDto> {
    return await this.examService.submitExam(req.user.sub, attemptId, submitDto);
  }

  @Post('lessons/:lessonId/start')
  @Roles('student')
  @ApiOperation({
    summary: '레슨 단위 시험 시작',
    description: '특정 레슨에 대한 시험을 시작합니다. 레슨 진도율이 90% 이상이어야 하며, 회사 수강기간/활성 레슨 여부를 검증합니다.'
  })
  @ApiParam({ name: 'lessonId', description: '레슨 ID' })
  @ApiResponse({
    status: 200,
    description: '레슨 시험 시작 성공',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            attemptId: { type: 'string' },
            lessonId: { type: 'string' },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  choices: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    }
  })
  async startLessonExam(
    @Param('lessonId') lessonId: string,
    @Request() req: any
  ) {
    const data = await this.examService.startLessonExam(req.user.sub, lessonId);
    return {
      success: true,
      data,
    };
  }

  @Post('lessons/:lessonId/retake')
  @Roles('student')
  @ApiOperation({
    summary: '레슨 단위 시험 재응시',
    description: '특정 레슨 시험에 대해 재응시를 시도합니다. 총 2사이클 × 3회(최대 6회)까지 응시 가능하며, 결과는 allowed 플래그로 반환됩니다.'
  })
  @ApiParam({ name: 'lessonId', description: '레슨 ID' })
  @ApiResponse({
    status: 200,
    description: '레슨 시험 재응시 결과',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            allowed: { type: 'boolean' },
            cycle: { type: 'number' },
            tryIndex: { type: 'number' },
            remainingTries: { type: 'number' },
            message: { type: 'string', nullable: true }
          }
        }
      }
    }
  })
  async retakeLessonExam(
    @Param('lessonId') lessonId: string,
    @Request() req: any
  ) {
    const data = await this.examService.retakeLessonExam(req.user.sub, lessonId);
    return {
      success: true,
      data,
    };
  }

  @Post('reset-attempts')
  @Roles('instructor')
  @ApiOperation({
    summary: '학생의 시험 시도 기록 초기화 (강사 전용)',
    description: '특정 학생의 특정 과목 시험 시도 기록을 모두 삭제하여 다시 3회 응시 가능하도록 초기화'
  })
  @ApiBody({ type: ResetExamAttemptsDto })
  @ApiResponse({ 
    status: 200, 
    description: '시험 시도 기록 초기화 성공',
    type: ResetExamAttemptsResponseDto
  })
  @ApiResponse({ status: 403, description: '권한 없음 (강사만 가능)' })
  async resetExamAttempts(
    @Body() resetDto: ResetExamAttemptsDto
  ): Promise<ResetExamAttemptsResponseDto> {
    return await this.examService.resetExamAttempts(resetDto.userId, resetDto.subjectId);
  }

  @Delete('attempts/:attemptId')
  @Roles('instructor', 'admin')
  @ApiOperation({
    summary: '개별 시험 기록 삭제 (강사/관리자 전용)',
    description: '특정 시험 기록 하나를 삭제하여 학생이 다시 시험을 볼 수 있도록 함'
  })
  @ApiParam({ 
    name: 'attemptId', 
    description: '삭제할 시험 기록 ID',
    example: 'clmxxxxxxxxxxxxx'
  })
  @ApiResponse({ 
    status: 200, 
    description: '시험 기록 삭제 성공',
    type: DeleteExamAttemptResponseDto
  })
  @ApiResponse({ status: 403, description: '권한 없음 (강사/관리자만 가능)' })
  @ApiResponse({ status: 404, description: '시험 기록을 찾을 수 없음' })
  async deleteExamAttempt(
    @Param('attemptId') attemptId: string
  ): Promise<DeleteExamAttemptResponseDto> {
    return await this.examService.deleteExamAttempt(attemptId);
  }
}
