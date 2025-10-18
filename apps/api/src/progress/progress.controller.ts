import { Controller, Post, Get, Body, Param, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { ModeAwareAuthGuard } from '../auth/guards/mode-aware-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, Auth } from '../auth/decorators/auth.decorator';
import { PingProgressDto, ProgressStatusDto, NextAvailableDto, LessonStatusDto } from './dto/progress.dto';

@ApiTags('Progress')
@Controller('progress')
@Auth()
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('ping')
  @Roles('student')
  @ApiOperation({
    summary: '학습 진도 업데이트',
    description: '사용자의 학습 진도를 업데이트합니다. progressPercent ≥90%일 때 자동으로 레슨을 완료로 처리합니다. 회사 수강기간 및 활성화 레슨 확인이 포함됩니다.'
  })
  @ApiBody({ type: PingProgressDto })
  @ApiResponse({ 
    status: 200, 
    description: '진도 업데이트 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '진도가 업데이트되었습니다.' },
        progressPercent: { type: 'number', example: 25.5 }
      }
    }
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (학생만 가능) 또는 회사 수강기간/활성화 레슨 제한' })
  async pingProgress(
    @Body() pingDto: PingProgressDto,
    @Request() req: any
  ) {
    if (!req.user?.sub) throw new UnauthorizedException();
    const userId = req.user.sub;
    const result = await this.progressService.pingProgress(userId, pingDto);
    return {
      success: true,
      message: '진도가 업데이트되었습니다.',
      progressPercent: result.progressPercent
    };
  }

  @Get('lessons/:id/status')
  @Roles('student')
  @ApiOperation({
    summary: '레슨별 상태 조회',
    description: '특정 레슨의 진도율, 해금 여부, 완료 여부를 조회합니다. 이전 레슨 시험 합격 && 진도율 ≥90%일 때 해금됩니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '레슨 상태 조회 성공',
    type: LessonStatusDto
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (학생만 가능) 또는 회사 수강기간/활성화 레슨 제한' })
  @ApiResponse({ status: 404, description: '레슨을 찾을 수 없음' })
  async getLessonStatus(
    @Param('id') lessonId: string,
    @Request() req: any
  ) {
    if (!req.user?.sub) throw new UnauthorizedException();
    const userId = req.user.sub;
    return await this.progressService.getLessonStatus(userId, lessonId);
  }

  @Get('subjects/:id/status')
  @Roles('student')
  @ApiOperation({
    summary: '과목별 진도 상태 조회',
    description: '특정 과목의 현재 진도 상태와 잠긴 강의 목록을 조회합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '진도 상태 조회 성공',
    type: ProgressStatusDto
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (학생만 가능)' })
  @ApiResponse({ status: 404, description: '과목을 찾을 수 없음' })
  async getSubjectProgress(
    @Param('id') subjectId: string,
    @Request() req: any
  ) {
    if (!req.user?.sub) throw new UnauthorizedException();
    const userId = req.user.sub;
    return await this.progressService.getStatus(userId);
  }

  @Get('next-available')
  @Roles('student')
  @ApiOperation({
    summary: '다음 학습 가능 지점 조회',
    description: '사용자가 다음에 학습할 수 있는 레슨을 조회합니다. 회사 활성화 레슨 범위 내에서 이전 레슨 시험 합격 && 진도율 ≥90%일 때 해금됩니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '다음 학습 가능 지점 조회 성공',
    type: NextAvailableDto
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (학생만 가능) 또는 회사 수강기간/활성화 레슨 제한' })
  async getNextAvailable(@Request() req: any) {
    if (!req.user?.sub) throw new UnauthorizedException();
    const userId = req.user.sub;
    return await this.progressService.getNextAvailable(userId);
  }
}
