import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards,
  Request
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParticipantGuard } from '../common/guards/participant.guard';
import { ExamService } from './exam.service';
import { AttemptService } from './attempt.service';
import { AuthService } from '../common/auth.service';
import { JoinSessionDto, SubmitAnswersDto } from '../common/dto';

@ApiTags('Public')
@Controller('portal')
export class PublicController {
  constructor(
    private examService: ExamService,
    private attemptService: AttemptService,
    private authService: AuthService
  ) {}

  @Get('sessions/:code')
  @ApiOperation({ summary: '세션 코드로 세션 정보 조회' })
  @ApiResponse({ status: 200, description: '세션 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '세션을 찾을 수 없음' })
  async getSessionByCode(@Param('code') code: string) {
    return this.attemptService.getSessionByCode(code);
  }

  @Post('sessions/:sessionId/join')
  @ApiOperation({ summary: '세션 참여' })
  @ApiResponse({ status: 201, description: '참여 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 409, description: 'PIN 중복' })
  async joinSession(@Param('sessionId') sessionId: string, @Body() dto: JoinSessionDto) {
    const participant = await this.attemptService.joinSession(sessionId, dto);
    
    // 참가자용 토큰 생성
    const token = await this.authService.generateParticipantToken(participant.id, sessionId);
    
    return {
      participant,
      ...token
    };
  }

  @Post('sessions/:sessionId/start')
  @ApiOperation({ summary: '시험 시작' })
  @ApiResponse({ status: 200, description: '시험 시작 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 409, description: '이미 시험을 시작함' })
  @UseGuards(ParticipantGuard)
  @ApiBearerAuth()
  async startExam(@Param('sessionId') sessionId: string, @Request() req: any) {
    const participantId = req.user.sub;
    return this.attemptService.startExam(sessionId, participantId);
  }

  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: '답안 제출' })
  @ApiResponse({ status: 200, description: '제출 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @UseGuards(ParticipantGuard)
  @ApiBearerAuth()
  async submitAnswers(@Param('attemptId') attemptId: string, @Body() dto: SubmitAnswersDto) {
    return this.attemptService.submitAnswers(attemptId, dto);
  }

  @Get('attempts/:attemptId/result')
  @ApiOperation({ summary: '시험 결과 조회' })
  @ApiResponse({ status: 200, description: '결과 조회 성공' })
  @ApiResponse({ status: 404, description: '시험을 찾을 수 없음' })
  @UseGuards(ParticipantGuard)
  @ApiBearerAuth()
  async getAttemptResult(@Param('attemptId') attemptId: string) {
    return this.attemptService.getAttemptResult(attemptId);
  }
}





