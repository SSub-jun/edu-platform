import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JoinSessionDto, SubmitAnswersDto } from '../common/dto';

@Injectable()
export class AttemptService {
  constructor(private prisma: PrismaService) {}

  // 세션 코드로 세션 조회
  async getSessionByCode(code: string) {
    const session = await this.prisma.portalExamSession.findUnique({
      where: { code },
      include: {
        bank: true,
        _count: {
          select: { participants: true }
        }
      }
    });
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    
    if (!session.isPublished) {
      throw new BadRequestException('Session is not published');
    }
    
    return session;
  }

  // 세션 참여
  async joinSession(sessionId: string, dto: JoinSessionDto) {
    const { name, pin4 } = dto;
    
    // 세션 존재 확인
    const session = await this.prisma.portalExamSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    
    if (!session.isPublished) {
      throw new BadRequestException('Session is not published');
    }

    // PIN 중복 확인
    const existingParticipant = await this.prisma.portalParticipant.findUnique({
      where: {
        sessionId_pin4: {
          sessionId,
          pin4
        }
      }
    });
    
    if (existingParticipant) {
      throw new ConflictException('PIN already exists in this session');
    }

    // 참가자 생성
    const participant = await this.prisma.portalParticipant.create({
      data: {
        sessionId,
        name,
        pin4
      }
    });

    return participant;
  }

  // 시험 시작
  async startExam(sessionId: string, participantId: string) {
    // 기존 시도 확인
    const existingAttempt = await this.prisma.portalAttempt.findUnique({
      where: {
        sessionId_participantId: {
          sessionId,
          participantId
        }
      }
    });
    
    if (existingAttempt) {
      throw new ConflictException('Attempt already exists');
    }

    // 세션 정보 조회
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
        questions: {
          include: {
            question: {
              include: {
                choices: true
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // 세션에 저장된 문제들 사용 (RANDOM/MANUAL 모두 동일)
    // RANDOM 모드는 세션 생성 시 이미 문제가 선택되어 PortalSessionQuestion에 저장됨
    // 선택지 순서도 고정 (모든 학생이 동일한 순서로 봄)
    const questions = session.questions.map(sq => ({
      id: sq.question.id,
      stem: sq.question.stem,
      choices: sq.question.choices.map(c => ({
        id: c.id,
        label: c.label
      }))
    }));

    // 시도 생성
    const attempt = await this.prisma.portalAttempt.create({
      data: {
        sessionId,
        participantId
      }
    });

    return {
      attemptId: attempt.id,
      questions
    };
  }

  // 답안 제출
  async submitAnswers(attemptId: string, dto: SubmitAnswersDto) {
    const { answers } = dto;
    
    // 시도 조회
    const attempt = await this.prisma.portalAttempt.findUnique({
      where: { id: attemptId },
      include: {
        session: true,
        participant: true
      }
    });
    
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    
    if (attempt.submittedAt) {
      throw new BadRequestException('Attempt already submitted');
    }

    // 답안 수 검증
    if (answers.length !== attempt.session.questionCount) {
      throw new BadRequestException(`Expected ${attempt.session.questionCount} answers, got ${answers.length}`);
    }

    // 답안 유효성 검증 및 채점
    let correctCount = 0;
    const answerRecords = [];

    for (const answer of answers) {
      // 문제와 보기 존재 확인
      const question = await this.prisma.portalQuestion.findUnique({
        where: { id: answer.questionId },
        include: { choices: true }
      });
      
      if (!question) {
        throw new BadRequestException(`Question ${answer.questionId} not found`);
      }
      
      // 빈 답안 처리: choiceId가 비어있거나 null인 경우 오답 처리하고 기록하지 않음
      if (!answer.choiceId || answer.choiceId.trim() === '') {
        // 빈 답안은 오답으로 처리하고 기록하지 않음 (correctCount 증가 안 함)
        continue;
      }
      
      const choice = question.choices.find(c => c.id === answer.choiceId);
      if (!choice) {
        throw new BadRequestException(`Invalid choice ${answer.choiceId} for question ${answer.questionId}`);
      }
      
      // 정답 확인
      if (answer.choiceId === question.answerId) {
        correctCount++;
      }
      
      answerRecords.push({
        attemptId,
        questionId: answer.questionId,
        choiceId: answer.choiceId
      });
    }

    // 점수 계산 (빈 답안도 포함하여 전체 문제 수로 계산)
    const totalQuestions = attempt.session.questionCount;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passingScore = parseInt(process.env.PORTAL_PASSING_SCORE || '60');
    const passed = score >= passingScore;

    // 트랜잭션으로 답안 저장 및 시도 업데이트
    return this.prisma.$transaction(async (tx) => {
      // 답안 저장
      await tx.portalAnswer.createMany({
        data: answerRecords
      });

      // 시도 업데이트
      const updatedAttempt = await tx.portalAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          score,
          passed
        }
      });

      return {
        attemptId,
        score,
        passed,
        correctCount,
        totalCount: totalQuestions
      };
    });
  }

  // 시험 결과 조회
  async getAttemptResult(attemptId: string) {
    const attempt = await this.prisma.portalAttempt.findUnique({
      where: { id: attemptId },
      include: {
        session: true,
        participant: true,
        answers: {
          include: {
            question: {
              include: {
                choices: true
              }
            }
          }
        }
      }
    });
    
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    
    if (!attempt.submittedAt) {
      throw new BadRequestException('Attempt not submitted yet');
    }
    
    return attempt;
  }

  // 세션 결과 목록 조회
  async getSessionResults(sessionId: string) {
    const session = await this.prisma.portalExamSession.findUnique({
      where: { id: sessionId },
      include: {
        attempts: {
          include: {
            participant: true,
            answers: {
              include: {
                question: {
                  include: {
                    choices: true,
                  },
                },
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      }
    });
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    
    return session.attempts;
  }

  // 세션 결과 CSV 생성
  async getSessionResultsCSV(sessionId: string) {
    const results = await this.getSessionResults(sessionId);
    const maxAnswers = Math.max(...results.map(r => r.answers?.length || 0));
    const answerHeaders = Array.from({ length: maxAnswers }, (_, i) => `Q${i + 1}`);

    const headers = ['Name', 'PIN', 'Score', 'Passed', 'Submitted At', ...answerHeaders];

    const rows = results.map(attempt => {
      const sortedAnswers = [...(attempt.answers || [])]
        .sort((a, b) => (a.question?.stem || '').localeCompare(b.question?.stem || ''));
      const answerLetters = answerHeaders.map((_, idx) => {
        const ans = sortedAnswers[idx];
        if (!ans) return '';
        const choiceIndex = (ans.question?.choices || []).findIndex(c => c.id === ans.choiceId);
        if (choiceIndex < 0) return '';
        // A, B, C ...
        return String.fromCharCode(65 + choiceIndex);
      });
      return [
        attempt.participant.name,
        attempt.participant.pin4,
        attempt.score || 0,
        attempt.passed ? 'Yes' : 'No',
        attempt.submittedAt?.toISOString() || '',
        ...answerLetters,
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }
}




