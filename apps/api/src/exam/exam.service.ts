import { Injectable, NotFoundException, UnprocessableEntityException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitExamDto, StartExamResponseDto, SubmitExamResponseDto } from './dto/exam.dto';
import { selectRandom } from '../utils/shuffle';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  /**
   * 과목 시험 응시 가능 여부 확인
   */
  async checkEligibility(userId: string, subjectId: string) {
    // 1. 과목의 모든 레슨 조회
    const lessons = await this.prisma.lesson.findMany({
      where: { subjectId, isActive: true },
      select: { id: true, title: true }
    });

    if (lessons.length === 0) {
      return {
        eligible: false,
        reason: '활성화된 레슨이 없습니다.',
        remainingAttempts: 0,
        lessonProgress: []
      };
    }

    // 2. 각 레슨의 진도율 조회
    const progressRecords = await this.prisma.progress.findMany({
      where: {
        userId,
        lessonId: { in: lessons.map(l => l.id) }
      }
    });

    const lessonProgress = lessons.map(lesson => {
      const progress = progressRecords.find(p => p.lessonId === lesson.id);
      return {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        progressPercent: progress?.progressPercent || 0
      };
    });

    // 3. 모든 레슨이 90% 이상인지 확인
    const allLessonsCompleted = lessonProgress.every(lp => lp.progressPercent >= 90);

    if (!allLessonsCompleted) {
      return {
        eligible: false,
        reason: '모든 레슨의 진도율이 90% 이상이어야 시험을 볼 수 있습니다.',
        remainingAttempts: 0,
        lessonProgress
      };
    }

    // 4. 시도 횟수 확인 (최대 3회)
    const attemptCount = await this.prisma.examAttempt.count({
      where: { userId, subjectId }
    });

    const remainingAttempts = Math.max(0, 3 - attemptCount);

    if (remainingAttempts === 0) {
      return {
        eligible: false,
        reason: '최대 응시 횟수(3회)를 초과했습니다.',
        remainingAttempts: 0,
        lessonProgress
      };
    }

    return {
      eligible: true,
      reason: '시험 응시 가능',
      remainingAttempts,
      lessonProgress
    };
  }

  /**
   * 과목 시험 시작
   */
  async startExam(userId: string, subjectId: string): Promise<StartExamResponseDto> {
    // 1. 응시 가능 여부 확인
    const eligibility = await this.checkEligibility(userId, subjectId);
    
    if (!eligibility.eligible) {
      throw new ForbiddenException(eligibility.reason);
    }

    // 2. 문제은행 조회 (과목의 모든 활성 문제)
    const questions = await this.prisma.question.findMany({
      where: { 
        subjectId,
        isActive: true
      },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (questions.length < 10) {
      throw new UnprocessableEntityException(`문제은행이 부족합니다. 최소 10문항이 필요하지만 현재 ${questions.length}문항만 있습니다.`);
    }

    // 3. 랜덤 10문항 선택
    const selectedQuestions = selectRandom(questions, Math.min(10, questions.length));
    const questionIds = selectedQuestions.map(q => q.id);

    // 4. 시도 번호 계산
    const attemptCount = await this.prisma.examAttempt.count({
      where: { userId, subjectId }
    });
    const attemptNumber = attemptCount + 1;

    // 5. ExamAttempt 생성
    const attempt = await this.prisma.examAttempt.create({
      data: {
        userId,
        subjectId,
        attemptNumber,
        status: 'inProgress',
        questionIds: questionIds,
        startedAt: new Date()
      }
    });

    // 6. 응답 구성
    const responseQuestions = selectedQuestions.map(q => ({
      id: q.id,
      content: q.stem,
      choices: q.choices.map(c => c.text)
    }));

    return {
      attemptId: attempt.id,
      subjectId,
      questions: responseQuestions
    };
  }

  /**
   * 시험 제출 및 채점
   */
  async submitExam(userId: string, attemptId: string, submitDto: SubmitExamDto): Promise<SubmitExamResponseDto> {
    // 1. 시도 검증
    const attempt = await this.prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        status: 'inProgress'
      }
    });

    if (!attempt) {
      throw new NotFoundException('진행 중인 시험을 찾을 수 없습니다.');
    }

    if (attempt.status === 'submitted') {
      throw new ConflictException('이미 제출된 시험입니다.');
    }

    // 2. 답안 검증
    const questionIds = attempt.questionIds as string[];
    const submittedQuestionIds = submitDto.answers.map(a => a.questionId);

    if (questionIds.length !== submittedQuestionIds.length) {
      throw new UnprocessableEntityException('제출된 답안 수가 일치하지 않습니다.');
    }

    // questionIds가 모두 포함되어 있는지 확인
    for (const qid of questionIds) {
      if (!submittedQuestionIds.includes(qid)) {
        throw new UnprocessableEntityException('답안에 포함되지 않은 문제가 있습니다.');
      }
    }

    // 3. 채점
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } }
    });

    let correctCount = 0;
    for (const answer of submitDto.answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.answerIndex === answer.choiceIndex) {
        correctCount++;
      }
    }

    const examScore = (correctCount / questionIds.length) * 100;
    const passed = examScore >= 70;

    // 4. 결과 저장
    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'submitted',
        score: examScore,
        passed,
        answers: submitDto.answers as any,
        submittedAt: new Date()
      }
    });

    return {
      examScore,
      passed
    };
  }

  /**
   * 학생의 과목별 시험 시도 기록 초기화 (강사/관리자 전용)
   */
  async resetExamAttempts(userId: string, subjectId: string) {
    // 1. 해당 사용자의 과목 시험 기록이 있는지 확인
    const existingAttempts = await this.prisma.examAttempt.findMany({
      where: {
        userId,
        subjectId
      }
    });

    if (existingAttempts.length === 0) {
      return {
        success: false,
        message: '초기화할 시험 기록이 없습니다.',
        deletedCount: 0
      };
    }

    // 2. 모든 시험 시도 기록 삭제
    const deleteResult = await this.prisma.examAttempt.deleteMany({
      where: {
        userId,
        subjectId
      }
    });

    return {
      success: true,
      message: `${deleteResult.count}개의 시험 시도 기록이 초기화되었습니다.`,
      deletedCount: deleteResult.count
    };
  }

  async deleteExamAttempt(attemptId: string) {
    // 1. 시험 기록 존재 여부 확인
    const examAttempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!examAttempt) {
      return {
        success: false,
        message: '삭제할 시험 기록을 찾을 수 없습니다.'
      };
    }

    // 2. 시험 기록 삭제
    await this.prisma.examAttempt.delete({
      where: { id: attemptId }
    });

    return {
      success: true,
      message: `${examAttempt.user.username}님의 ${examAttempt.subject.name} 시험 기록이 삭제되었습니다.`,
      deletedAttempt: {
        attemptId: examAttempt.id,
        subjectName: examAttempt.subject.name,
        score: examAttempt.score || 0,
        attemptNumber: examAttempt.attemptNumber
      }
    };
  }
}
