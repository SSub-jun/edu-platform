import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateSessionDto, CreateBankDto, CreateQuestionDto, SelectQuestionsDto } from '../common/dto';
import { generateSessionCode, randomSample } from '../common/util/random';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  // 세션 생성
  async createSession(dto: CreateSessionDto) {
    const { title, sessionNo, mode, questionCount, bankId } = dto;
    
    // 기본값 설정
    const finalQuestionCount = questionCount || parseInt(process.env.PORTAL_DEFAULT_QUESTION_COUNT || '20');
    
    // RANDOM 모드 검증
    if (mode === 'RANDOM') {
      if (!bankId) {
        throw new BadRequestException('Bank ID is required for RANDOM mode');
      }
      
      const bank = await this.prisma.portalExamBank.findUnique({
        where: { id: bankId },
        include: { questions: true }
      });
      
      if (!bank) {
        throw new NotFoundException('Bank not found');
      }
      
      if (bank.questions.length < finalQuestionCount) {
        throw new BadRequestException('NOT_ENOUGH_QUESTIONS', `Bank has only ${bank.questions.length} questions, but ${finalQuestionCount} are required`);
      }
    }

    // 세션 코드 생성 (유니크 확인, 항상 6자리 대문자+숫자, 영어/숫자 혼합 보장)
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 20;
    const targetLength = 6;
    const upperRe = /[A-Z]/;
    const digitRe = /\d/;
    
    while (!isUnique && attempts < maxAttempts) {
      const candidate = generateSessionCode(targetLength);
      // 영어 대문자와 숫자가 최소 1자 이상씩 포함되도록 검증
      if (!upperRe.test(candidate) || !digitRe.test(candidate)) {
        attempts++;
        continue;
      }
      const existing = await this.prisma.portalExamSession.findUnique({ where: { code: candidate } });
      if (!existing) {
        code = candidate;
        isUnique = true;
        break;
      }
      attempts++;
    }
    
    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique session code');
    }

    // 세션 생성 및 RANDOM 모드일 경우 문제 자동 선택
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.portalExamSession.create({
        data: {
          title,
          sessionNo,
          code: code!,
          mode,
          questionCount: finalQuestionCount,
          bankId: mode === 'RANDOM' ? bankId : null,
        },
      });

      // RANDOM 모드: 문제은행에서 랜덤하게 문제 선택
      if (mode === 'RANDOM' && bankId) {
        const bank = await tx.portalExamBank.findUnique({
          where: { id: bankId },
          include: { questions: true }
        });

        if (!bank) {
          throw new NotFoundException('Bank not found');
        }

        // 랜덤 샘플링
        const selectedQuestions = randomSample(bank.questions, finalQuestionCount);
        
        // PortalSessionQuestion에 저장
        const sessionQuestions = selectedQuestions.map((question, index) => ({
          sessionId: session.id,
          questionId: question.id,
          orderIndex: index,
        }));

        await tx.portalSessionQuestion.createMany({
          data: sessionQuestions
        });
      }

      return session;
    });
  }

  // MANUAL 모드에서 문제 선택
  async selectQuestions(sessionId: string, dto: SelectQuestionsDto) {
    const session = await this.prisma.portalExamSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    
    if (session.mode !== 'MANUAL') {
      throw new BadRequestException('Session is not in MANUAL mode');
    }
    
    if (dto.questionIds.length !== session.questionCount) {
      throw new BadRequestException('INVALID_QUESTION_COUNT', `Expected ${session.questionCount} questions, got ${dto.questionIds.length}`);
    }

    // 기존 선택된 문제들 삭제
    await this.prisma.portalSessionQuestion.deleteMany({
      where: { sessionId }
    });

    // 새로운 문제들 추가
    const sessionQuestions = dto.questionIds.map((questionId, index) => ({
      sessionId,
      questionId,
      orderIndex: index,
    }));

    await this.prisma.portalSessionQuestion.createMany({
      data: sessionQuestions
    });

    return { message: 'Questions selected successfully' };
  }

  // 문제은행 생성
  async createBank(dto: CreateBankDto) {
    return this.prisma.portalExamBank.create({
      data: dto
    });
  }

  // 문제은행 목록 조회
  async getBanks() {
    return this.prisma.portalExamBank.findMany({
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 문제은행 상세 조회
  async getBank(bankId: string) {
    const bank = await this.prisma.portalExamBank.findUnique({
      where: { id: bankId },
      include: {
        questions: {
          include: {
            choices: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!bank) {
      throw new NotFoundException('Bank not found');
    }
    
    return bank;
  }

  // 문제은행 CSV 생성
  async getBankQuestionsCSV(bankId: string) {
    const bank = await this.getBank(bankId);
    const maxChoices = Math.max(
      0,
      ...bank.questions.map((q) => q.choices.length),
    );
    const choiceHeaders = Array.from({ length: maxChoices }, (_, i) => `Choice_${i + 1}`);
    const headers = [
      'No',
      'Stem',
      ...choiceHeaders,
      'AnswerIndex',
      'AnswerLabel',
    ];

    const rows = bank.questions
      .slice()
      .reverse() // createdAt desc로 읽었으니 번호를 1부터 올리기 위해 역순 정렬
      .map((q, idx) => {
        const answerIndex = q.choices.findIndex((c) => c.id === q.answerId);
        const answerLabel = answerIndex >= 0 ? q.choices[answerIndex].label : '';
        const paddedChoices = [
          ...q.choices.map((c) => c.label),
          ...Array(Math.max(0, maxChoices - q.choices.length)).fill(''),
        ];
        return [
          String(idx + 1),
          q.stem,
          ...paddedChoices,
          String(answerIndex + 1),
          answerLabel,
        ];
      });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    return csvContent;
  }

  // 문제 생성
  async createQuestion(bankId: string, dto: CreateQuestionDto) {
    const { stem, choices, answerIndex } = dto;
    
    // 보기 수 검증
    const minChoices = parseInt(process.env.PORTAL_MIN_CHOICES_PER_QUESTION || '3');
    const maxChoices = parseInt(process.env.PORTAL_MAX_CHOICES_PER_QUESTION || '10');
    
    if (choices.length < minChoices || choices.length > maxChoices) {
      throw new BadRequestException(`Choices count must be between ${minChoices} and ${maxChoices}`);
    }
    
    if (answerIndex < 0 || answerIndex >= choices.length) {
      throw new BadRequestException('Invalid answer index');
    }

    // 문제은행 존재 확인
    const bank = await this.prisma.portalExamBank.findUnique({
      where: { id: bankId }
    });
    
    if (!bank) {
      throw new NotFoundException('Bank not found');
    }

    // 트랜잭션으로 문제와 보기 생성
    return this.prisma.$transaction(async (tx) => {
      const question = await tx.portalQuestion.create({
        data: {
          bankId,
          stem,
          answerId: '', // 임시값, 보기 생성 후 업데이트
        }
      });

      const createdChoices = await Promise.all(
        choices.map(choice => 
          tx.portalChoice.create({
            data: {
              questionId: question.id,
              label: choice.label,
            }
          })
        )
      );

      const answerChoice = createdChoices[answerIndex];
      await tx.portalQuestion.update({
        where: { id: question.id },
        data: { answerId: answerChoice.id }
      });

      return {
        ...question,
        answerId: answerChoice.id,
        choices: createdChoices
      };
    });
  }

  // 문제 수정
  async updateQuestion(bankId: string, questionId: string, dto: any) {
    const { stem, choices, answerIndex } = dto;

    // 존재 및 소속 은행 확인
    const question = await this.prisma.portalQuestion.findUnique({ where: { id: questionId } });
    if (!question || question.bankId !== bankId) {
      throw new NotFoundException('Question not found');
    }

    // 보기 수 검증
    const minChoices = parseInt(process.env.PORTAL_MIN_CHOICES_PER_QUESTION || '3');
    const maxChoices = parseInt(process.env.PORTAL_MAX_CHOICES_PER_QUESTION || '10');
    if (!Array.isArray(choices) || choices.length < minChoices || choices.length > maxChoices) {
      throw new BadRequestException(`Choices count must be between ${minChoices} and ${maxChoices}`);
    }
    if (answerIndex < 0 || answerIndex >= choices.length) {
      throw new BadRequestException('Invalid answer index');
    }

    return this.prisma.$transaction(async (tx) => {
      // stem 업데이트
      const updated = await tx.portalQuestion.update({
        where: { id: questionId },
        data: { stem },
      });

      // 기존 보기 삭제
      await tx.portalChoice.deleteMany({ where: { questionId } });

      // 새로운 보기 생성
      const createdChoices = [] as { id: string }[];
      for (const c of choices) {
        const created = await tx.portalChoice.create({
          data: { questionId, label: c.label },
        });
        createdChoices.push(created);
      }

      // 정답 설정
      const answerChoice = createdChoices[answerIndex];
      await tx.portalQuestion.update({
        where: { id: questionId },
        data: { answerId: answerChoice.id },
      });

      return { ...updated, answerId: answerChoice.id, choices: createdChoices };
    });
  }

  // 문제 삭제
  async deleteQuestion(bankId: string, questionId: string) {
    const question = await this.prisma.portalQuestion.findUnique({ where: { id: questionId } });
    if (!question || question.bankId !== bankId) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // 참조 정리
      await tx.portalAnswer.deleteMany({ where: { questionId } });
      await tx.portalSessionQuestion.deleteMany({ where: { questionId } });
      await tx.portalChoice.deleteMany({ where: { questionId } });
      await tx.portalQuestion.delete({ where: { id: questionId } });
    });

    return { message: 'Question deleted' };
  }

  // 세션 목록 조회
  async getSessions() {
    return this.prisma.portalExamSession.findMany({
      include: {
        bank: true,
        _count: {
          select: { 
            participants: true,
            attempts: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // 세션 상세 조회
  async getSession(sessionId: string) {
    const session = await this.prisma.portalExamSession.findUnique({
      where: { id: sessionId },
      include: {
        bank: true,
        questions: {
          include: {
            question: {
              include: {
                choices: true
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        participants: true,
        attempts: {
          include: {
            participant: true
          }
        }
      }
    });
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    
    return session;
  }

  // 세션 퍼블리시
  async publishSession(sessionId: string) {
    const session = await this.prisma.portalExamSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    
    return this.prisma.portalExamSession.update({
      where: { id: sessionId },
      data: { isPublished: true, closedAt: null }
    });
  }

  // 세션 종료 (공개 해제)
  async closeSession(sessionId: string) {
    const session = await this.prisma.portalExamSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return this.prisma.portalExamSession.update({
      where: { id: sessionId },
      data: { isPublished: false, closedAt: new Date() },
    });
  }
}




