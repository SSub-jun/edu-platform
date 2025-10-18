import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Param, 
  UseGuards,
  Res,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AdminGuard } from '../common/guards/admin.guard';
import { Public } from '../common/decorators/public.decorator';
import { ExamService } from './exam.service';
import { AttemptService } from './attempt.service';
import { AuthService } from '../common/auth.service';
import { 
  CreateSessionDto, 
  CreateBankDto, 
  CreateQuestionDto, 
  SelectQuestionsDto, 
  UpdateQuestionDto 
} from '../common/dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private examService: ExamService,
    private attemptService: AttemptService,
    private authService: AuthService
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: '관리자 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: { username: string; password: string }) {
    const user = await this.authService.validateAdmin(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Public()
  @Post('magic-login')
  @ApiOperation({ summary: '관리자 매직 로그인' })
  @ApiResponse({ status: 200, description: '매직 로그인 성공' })
  @ApiResponse({ status: 401, description: '매직 인증 실패' })
  async magicLogin(@Body() body: { code: string; name: string; pin4: string }) {
    const code = body.code?.toUpperCase?.() || '';
    const name = body.name || '';
    const pin4 = body.pin4 || '';

    const mCode = process.env.PORTAL_ADMIN_MAGIC_CODE || 'KIST';
    const mName = process.env.PORTAL_ADMIN_MAGIC_NAME || '관리자';
    const mPin = process.env.PORTAL_ADMIN_MAGIC_PIN || '2017';

    if (code === mCode && name === mName && pin4 === mPin) {
      const user = { id: 'admin', username: process.env.PORTAL_ADMIN_USER, role: 'admin' };
      return this.authService.login(user);
    }
    throw new UnauthorizedException('Invalid magic credentials');
  }

  // 세션 관리
  @Post('sessions')
  @ApiOperation({ summary: '시험 세션 생성' })
  @ApiResponse({ status: 201, description: '세션 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createSession(@Body() dto: CreateSessionDto) {
    return this.examService.createSession(dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: '시험 세션 목록 조회' })
  @ApiResponse({ status: 200, description: '세션 목록 조회 성공' })
  async getSessions() {
    return this.examService.getSessions();
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '시험 세션 상세 조회' })
  @ApiResponse({ status: 200, description: '세션 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  async getSession(@Param('id') id: string) {
    return this.examService.getSession(id);
  }

  @Post('sessions/:id/select-questions')
  @ApiOperation({ summary: 'MANUAL 모드에서 문제 선택' })
  @ApiResponse({ status: 200, description: '문제 선택 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async selectQuestions(@Param('id') id: string, @Body() dto: SelectQuestionsDto) {
    return this.examService.selectQuestions(id, dto);
  }

  @Patch('sessions/:id/publish')
  @ApiOperation({ summary: '세션 퍼블리시' })
  @ApiResponse({ status: 200, description: '세션 퍼블리시 성공' })
  async publishSession(@Param('id') id: string) {
    return this.examService.publishSession(id);
  }

  // 문제은행 관리
  @Get('banks')
  @ApiOperation({ summary: '문제은행 목록 조회' })
  @ApiResponse({ status: 200, description: '문제은행 목록 조회 성공' })
  async getBanks() {
    return this.examService.getBanks();
  }

  @Post('banks')
  @ApiOperation({ summary: '문제은행 생성' })
  @ApiResponse({ status: 201, description: '문제은행 생성 성공' })
  async createBank(@Body() dto: CreateBankDto) {
    return this.examService.createBank(dto);
  }

  @Get('banks/:id')
  @ApiOperation({ summary: '문제은행 상세 조회' })
  @ApiResponse({ status: 200, description: '문제은행 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '문제은행을 찾을 수 없음' })
  async getBank(@Param('id') id: string) {
    return this.examService.getBank(id);
  }

  @Get('banks/:id/questions')
  @ApiOperation({ summary: '문제은행의 문제 목록 조회' })
  @ApiResponse({ status: 200, description: '문제 목록 조회 성공' })
  async getBankQuestions(@Param('id') id: string) {
    const bank = await this.examService.getBank(id);
    return bank.questions;
  }

  @Post('banks/:id/questions')
  @ApiOperation({ summary: '문제 생성' })
  @ApiResponse({ status: 201, description: '문제 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createQuestion(@Param('id') id: string, @Body() dto: CreateQuestionDto) {
    return this.examService.createQuestion(id, dto);
  }

  @Get('banks/:id/questions.csv')
  @ApiOperation({ summary: '문제은행 CSV 다운로드' })
  @ApiResponse({ status: 200, description: 'CSV 다운로드 성공' })
  async getBankQuestionsCSV(@Param('id') id: string, @Res() res: Response) {
    const csv = await this.examService.getBankQuestionsCSV(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bank-${id}-questions.csv"`);
    res.status(HttpStatus.OK).send(csv);
  }

  @Patch('banks/:id/questions/:questionId')
  @ApiOperation({ summary: '문제 수정' })
  @ApiResponse({ status: 200, description: '문제 수정 성공' })
  async updateQuestion(
    @Param('id') bankId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.examService.updateQuestion(bankId, questionId, dto);
  }

  @Post('banks/:id/questions/:questionId/delete')
  @ApiOperation({ summary: '문제 삭제' })
  @ApiResponse({ status: 200, description: '문제 삭제 성공' })
  async deleteQuestion(
    @Param('id') bankId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.examService.deleteQuestion(bankId, questionId);
  }

  // 결과 관리
  @Get('sessions/:id/results')
  @ApiOperation({ summary: '세션 결과 목록 조회' })
  @ApiResponse({ status: 200, description: '결과 목록 조회 성공' })
  async getSessionResults(@Param('id') id: string) {
    return this.attemptService.getSessionResults(id);
  }

  @Get('sessions/:id/results.csv')
  @ApiOperation({ summary: '세션 결과 CSV 다운로드' })
  @ApiResponse({ status: 200, description: 'CSV 다운로드 성공' })
  async getSessionResultsCSV(@Param('id') id: string, @Res() res: Response) {
    const csvContent = await this.attemptService.getSessionResultsCSV(id);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="session-${id}-results.csv"`);
    res.status(HttpStatus.OK).send(csvContent);
  }

  @Patch('sessions/:id/close')
  @ApiOperation({ summary: '세션 종료(공개 해제)' })
  @ApiResponse({ status: 200, description: '세션 종료 성공' })
  async closeSession(@Param('id') id: string) {
    return this.examService.closeSession(id);
  }
}
