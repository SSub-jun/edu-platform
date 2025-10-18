import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

enum PortalSelectionMode {
  RANDOM = 'RANDOM',
  MANUAL = 'MANUAL'
}

// DTOs
class CreatePortalBankDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}

class CreatePortalQuestionDto {
  @IsString()
  @IsNotEmpty()
  stem: string;

  @IsArray()
  @IsString({ each: true })
  choices: string[];

  @IsInt()
  @Min(0)
  answerIndex: number;
}

class CreatePortalSessionDto {
  @IsInt()
  sessionNo: number;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  bankId?: string;

  @IsEnum(PortalSelectionMode)
  mode: PortalSelectionMode;

  @IsInt()
  @Min(1)
  questionCount: number;
}

@ApiTags('Portal Management')
@Controller('admin/portal')
@Roles('admin', 'instructor')
@ApiBearerAuth()
export class PortalController {
  constructor(private prisma: PrismaService) {}

  // =============== 문제 은행 관리 ===============

  @Get('banks')
  @ApiOperation({ summary: '포털 문제 은행 목록 조회' })
  @ApiResponse({ status: 200, description: '문제 은행 목록 조회 성공' })
  async getBanks() {
    const banks = await this.prisma.portalExamBank.findMany({
      include: {
        questions: {
          include: {
            choices: true
          }
        },
        sessions: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: banks.map(bank => ({
        ...bank,
        questionsCount: bank.questions.length,
        sessionsCount: bank.sessions.length,
        activeSessionsCount: bank.sessions.filter(s => s.isPublished).length
      }))
    };
  }

  @Get('banks/:id')
  @ApiOperation({ summary: '특정 문제 은행 상세 조회' })
  @ApiParam({ name: 'id', description: '문제 은행 ID' })
  @ApiResponse({ status: 200, description: '문제 은행 상세 조회 성공' })
  async getBankDetails(@Param('id') bankId: string) {
    const bank = await this.prisma.portalExamBank.findUnique({
      where: { id: bankId },
      include: {
        questions: {
          include: {
            choices: true
          },
          orderBy: { createdAt: 'asc' }
        },
        sessions: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            createdAt: true,
            participants: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!bank) {
      return { success: false, message: 'Bank not found' };
    }

    return {
      success: true,
      data: {
        ...bank,
        sessions: bank.sessions.map(session => ({
          ...session,
          participantsCount: session.participants.length
        }))
      }
    };
  }

  @Post('banks')
  @ApiOperation({ summary: '새 문제 은행 생성' })
  @ApiBody({ type: CreatePortalBankDto })
  @ApiResponse({ status: 201, description: '문제 은행 생성 성공' })
  async createBank(@Body() dto: CreatePortalBankDto) {
    const bank = await this.prisma.portalExamBank.create({
      data: {
        title: dto.title
      }
    });

    return {
      success: true,
      data: bank
    };
  }

  @Put('banks/:id')
  @ApiOperation({ summary: '문제 은행 수정' })
  @ApiParam({ name: 'id', description: '문제 은행 ID' })
  @ApiResponse({ status: 200, description: '문제 은행 수정 성공' })
  async updateBank(@Param('id') bankId: string, @Body() dto: CreatePortalBankDto) {
    const bank = await this.prisma.portalExamBank.update({
      where: { id: bankId },
      data: {
        title: dto.title
      }
    });

    return {
      success: true,
      data: bank
    };
  }

  @Delete('banks/:id')
  @ApiOperation({ summary: '문제 은행 삭제' })
  @ApiParam({ name: 'id', description: '문제 은행 ID' })
  @ApiResponse({ status: 200, description: '문제 은행 삭제 성공' })
  async deleteBank(@Param('id') bankId: string) {
    await this.prisma.portalExamBank.delete({
      where: { id: bankId }
    });

    return { success: true, message: 'Bank deleted successfully' };
  }

  @Post('banks/:id/questions')
  @ApiOperation({ summary: '문제 은행에 문제 추가' })
  @ApiParam({ name: 'id', description: '문제 은행 ID' })
  @ApiBody({ type: CreatePortalQuestionDto })
  @ApiResponse({ status: 201, description: '문제 추가 성공' })
  async addQuestionToBank(@Param('id') bankId: string, @Body() dto: CreatePortalQuestionDto) {
    // 먼저 문제 생성
    const question = await this.prisma.portalQuestion.create({
      data: {
        bankId,
        stem: dto.stem,
        answerId: '' // 임시로 빈 문자열, 선택지 생성 후 업데이트
      }
    });

    // 선택지들 생성
    const choices = await Promise.all(
      dto.choices.map(async (choiceText, index) => {
        return this.prisma.portalChoice.create({
          data: {
            questionId: question.id,
            label: choiceText
          }
        });
      })
    );

    // 정답 설정 (answerId 업데이트)
    const correctChoice = choices[dto.answerIndex];
    await this.prisma.portalQuestion.update({
      where: { id: question.id },
      data: { answerId: correctChoice.id }
    });

    return {
      success: true,
      data: {
        ...question,
        choices,
        answerId: correctChoice.id
      }
    };
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: '포털 문제 삭제' })
  @ApiParam({ name: 'id', description: '문제 ID' })
  @ApiResponse({ status: 200, description: '문제 삭제 성공' })
  async deleteQuestion(@Param('id') questionId: string) {
    await this.prisma.portalQuestion.delete({
      where: { id: questionId }
    });

    return { success: true, message: 'Question deleted successfully' };
  }

  // =============== 시험 세션 관리 ===============

  @Get('sessions')
  @ApiOperation({ summary: '포털 시험 세션 목록 조회' })
  @ApiResponse({ status: 200, description: '시험 세션 목록 조회 성공' })
  async getSessions() {
    const sessions = await this.prisma.portalExamSession.findMany({
      include: {
        bank: {
          select: {
            id: true,
            title: true
          }
        },
        participants: {
          select: { id: true }
        },
        attempts: {
          select: {
            id: true,
            submittedAt: true,
            score: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: sessions.map(session => ({
        ...session,
        participantsCount: session.participants.length,
        completedAttemptsCount: session.attempts.filter(a => a.submittedAt).length,
        averageScore: session.attempts.length > 0 
          ? Math.round(session.attempts
              .filter(a => a.score !== null)
              .reduce((sum, a) => sum + (a.score || 0), 0) / 
              session.attempts.filter(a => a.score !== null).length)
          : null
      }))
    };
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '특정 시험 세션 상세 조회' })
  @ApiParam({ name: 'id', description: '시험 세션 ID' })
  @ApiResponse({ status: 200, description: '시험 세션 상세 조회 성공' })
  async getSessionDetails(@Param('id') sessionId: string) {
    const session = await this.prisma.portalExamSession.findUnique({
      where: { id: sessionId },
      include: {
        bank: {
          include: {
            questions: {
              include: {
                choices: true
              }
            }
          }
        },
        participants: {
          include: {
            attempts: {
              select: {
                id: true,
                startedAt: true,
                submittedAt: true,
                score: true,
                passed: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      return { success: false, message: 'Session not found' };
    }

    return {
      success: true,
      data: session
    };
  }

  @Post('sessions')
  @ApiOperation({ summary: '새 시험 세션 생성' })
  @ApiBody({ type: CreatePortalSessionDto })
  @ApiResponse({ status: 201, description: '시험 세션 생성 성공' })
  async createSession(@Body() dto: CreatePortalSessionDto) {
    const session = await this.prisma.portalExamSession.create({
      data: {
        sessionNo: dto.sessionNo,
        code: dto.code,
        title: dto.title,
        bankId: dto.bankId,
        mode: dto.mode,
        questionCount: dto.questionCount,
        isPublished: false // 기본적으로 비활성 상태로 생성
      },
      include: {
        bank: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return {
      success: true,
      data: session
    };
  }

  @Put('sessions/:id/publish')
  @ApiOperation({ summary: '시험 세션 활성화/비활성화' })
  @ApiParam({ name: 'id', description: '시험 세션 ID' })
  @ApiResponse({ status: 200, description: '시험 세션 상태 변경 성공' })
  async toggleSessionPublish(@Param('id') sessionId: string, @Body() body: { isPublished: boolean }) {
    const session = await this.prisma.portalExamSession.update({
      where: { id: sessionId },
      data: {
        isPublished: body.isPublished,
        closedAt: body.isPublished ? null : new Date()
      }
    });

    return {
      success: true,
      data: session
    };
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: '시험 세션 삭제' })
  @ApiParam({ name: 'id', description: '시험 세션 ID' })
  @ApiResponse({ status: 200, description: '시험 세션 삭제 성공' })
  async deleteSession(@Param('id') sessionId: string) {
    await this.prisma.portalExamSession.delete({
      where: { id: sessionId }
    });

    return { success: true, message: 'Session deleted successfully' };
  }

  // =============== 통계 및 분석 ===============

  @Get('statistics')
  @ApiOperation({ summary: '포털 시험 전체 통계' })
  @ApiResponse({ status: 200, description: '전체 통계 조회 성공' })
  async getPortalStatistics() {
    const [
      banksCount,
      questionsCount,
      sessionsCount,
      activeSessions,
      totalParticipants,
      totalAttempts,
      completedAttempts
    ] = await Promise.all([
      this.prisma.portalExamBank.count(),
      this.prisma.portalQuestion.count(),
      this.prisma.portalExamSession.count(),
      this.prisma.portalExamSession.count({ where: { isPublished: true } }),
      this.prisma.portalParticipant.count(),
      this.prisma.portalAttempt.count(),
      this.prisma.portalAttempt.count({ where: { submittedAt: { not: null } } })
    ]);

    const averageScore = await this.prisma.portalAttempt.aggregate({
      where: { score: { not: null } },
      _avg: { score: true }
    });

    return {
      success: true,
      data: {
        banksCount,
        questionsCount,
        sessionsCount,
        activeSessions,
        totalParticipants,
        totalAttempts,
        completedAttempts,
        averageScore: averageScore._avg.score ? Math.round(averageScore._avg.score) : null,
        completionRate: totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0
      }
    };
  }
}

