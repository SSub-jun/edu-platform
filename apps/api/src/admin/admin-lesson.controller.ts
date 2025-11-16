import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminLessonService } from './admin-lesson.service';
import { CreateLessonDto, UpdateLessonDto, CreateLessonPartDto, UpdateLessonPartDto } from './dto/lesson.dto';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Admin - Lessons & Questions')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminLessonController {
  constructor(private readonly lessonService: AdminLessonService) {}

  // =============== 레슨 관리 ===============

  @Post('subjects/:subjectId/lessons')
  @ApiOperation({ summary: '레슨 생성' })
  @ApiParam({ name: 'subjectId', description: '과목 ID' })
  @ApiResponse({ status: 201, description: '레슨이 성공적으로 생성됨' })
  async createLesson(@Param('subjectId') subjectId: string, @Body() dto: CreateLessonDto) {
    return this.lessonService.createLesson(subjectId, dto);
  }

  @Get('subjects/:subjectId/lessons')
  @ApiOperation({ summary: '과목의 레슨 목록 조회' })
  @ApiParam({ name: 'subjectId', description: '과목 ID' })
  @ApiResponse({ status: 200, description: '레슨 목록' })
  async getLessonsBySubject(@Param('subjectId') subjectId: string) {
    return this.lessonService.getLessonsBySubject(subjectId);
  }

  @Get('lessons/:lessonId')
  @ApiOperation({ summary: '레슨 상세 조회' })
  @ApiParam({ name: 'lessonId', description: '레슨 ID' })
  @ApiResponse({ status: 200, description: '레슨 상세 정보' })
  async getLessonById(@Param('lessonId') lessonId: string) {
    return this.lessonService.getLessonById(lessonId);
  }

  @Patch('lessons/:lessonId')
  @ApiOperation({ summary: '레슨 수정' })
  @ApiParam({ name: 'lessonId', description: '레슨 ID' })
  @ApiResponse({ status: 200, description: '레슨이 성공적으로 수정됨' })
  async updateLesson(@Param('lessonId') lessonId: string, @Body() dto: UpdateLessonDto) {
    return this.lessonService.updateLesson(lessonId, dto);
  }

  @Delete('lessons/:lessonId')
  @ApiOperation({ summary: '레슨 삭제 (비활성화)' })
  @ApiParam({ name: 'lessonId', description: '레슨 ID' })
  @ApiResponse({ status: 200, description: '레슨이 성공적으로 비활성화됨' })
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.lessonService.deleteLesson(lessonId);
  }

  // =============== 레슨 파트 관리 ===============

  @Post('lessons/:lessonId/parts')
  @ApiOperation({ summary: '레슨 파트 생성' })
  @ApiParam({ name: 'lessonId', description: '레슨 ID' })
  @ApiResponse({ status: 201, description: '레슨 파트가 성공적으로 생성됨' })
  async createLessonPart(@Param('lessonId') lessonId: string, @Body() dto: CreateLessonPartDto) {
    return this.lessonService.createLessonPart(lessonId, dto);
  }

  @Get('lessons/:lessonId/parts')
  @ApiOperation({ summary: '레슨의 파트 목록 조회' })
  @ApiParam({ name: 'lessonId', description: '레슨 ID' })
  @ApiResponse({ status: 200, description: '레슨 파트 목록' })
  async getLessonParts(@Param('lessonId') lessonId: string) {
    return this.lessonService.getLessonParts(lessonId);
  }

  @Patch('parts/:partId')
  @ApiOperation({ summary: '레슨 파트 수정' })
  @ApiParam({ name: 'partId', description: '파트 ID' })
  @ApiResponse({ status: 200, description: '레슨 파트가 성공적으로 수정됨' })
  async updateLessonPart(@Param('partId') partId: string, @Body() dto: UpdateLessonPartDto) {
    return this.lessonService.updateLessonPart(partId, dto);
  }

  @Delete('parts/:partId')
  @ApiOperation({ summary: '레슨 파트 삭제 (비활성화)' })
  @ApiParam({ name: 'partId', description: '파트 ID' })
  @ApiResponse({ status: 200, description: '레슨 파트가 성공적으로 비활성화됨' })
  async deleteLessonPart(@Param('partId') partId: string) {
    return this.lessonService.deleteLessonPart(partId);
  }

  // =============== 시험 문제 관리 ===============

  @Post('subjects/:subjectId/questions')
  @ApiOperation({ summary: '시험 문제 생성' })
  @ApiParam({ name: 'subjectId', description: '과목 ID' })
  @ApiResponse({ status: 201, description: '시험 문제가 성공적으로 생성됨' })
  async createQuestion(@Param('subjectId') subjectId: string, @Body() dto: CreateQuestionDto) {
    return this.lessonService.createQuestion(subjectId, dto);
  }

  @Get('subjects/:subjectId/questions')
  @ApiOperation({ summary: '과목의 시험 문제 목록 조회' })
  @ApiParam({ name: 'subjectId', description: '과목 ID' })
  @ApiResponse({ status: 200, description: '시험 문제 목록' })
  async getQuestionsBySubject(@Param('subjectId') subjectId: string) {
    return this.lessonService.getQuestionsBySubject(subjectId);
  }

  @Get('questions/:questionId')
  @ApiOperation({ summary: '시험 문제 상세 조회' })
  @ApiParam({ name: 'questionId', description: '문제 ID' })
  @ApiResponse({ status: 200, description: '시험 문제 상세 정보' })
  async getQuestionById(@Param('questionId') questionId: string) {
    return this.lessonService.getQuestionById(questionId);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: '시험 문제 수정' })
  @ApiParam({ name: 'questionId', description: '문제 ID' })
  @ApiResponse({ status: 200, description: '시험 문제가 성공적으로 수정됨' })
  async updateQuestion(@Param('questionId') questionId: string, @Body() dto: UpdateQuestionDto) {
    return this.lessonService.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: '시험 문제 삭제 (비활성화)' })
  @ApiParam({ name: 'questionId', description: '문제 ID' })
  @ApiResponse({ status: 200, description: '시험 문제가 성공적으로 비활성화됨' })
  async deleteQuestion(@Param('questionId') questionId: string) {
    return this.lessonService.deleteQuestion(questionId);
  }

  @Post('questions/:questionId/duplicate')
  @ApiOperation({ summary: '시험 문제 복제' })
  @ApiParam({ name: 'questionId', description: '문제 ID' })
  @ApiResponse({ status: 201, description: '시험 문제가 성공적으로 복제됨' })
  async duplicateQuestion(@Param('questionId') questionId: string) {
    return this.lessonService.duplicateQuestion(questionId);
  }
}

