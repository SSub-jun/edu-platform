import { Injectable, NotFoundException, UnprocessableEntityException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitExamDto, StartExamResponseDto, SubmitExamResponseDto } from './dto/exam.dto';
import { selectRandom } from '../utils/shuffle';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

  /**
   * 과목 시험 응시 가능 여부 확인
   *
   * TODO: 현재 구현은 Subject 단위 시도 3회를 기준으로 remainingAttempts를 계산한다.
   *       레슨 단위 사이클(cycle) 로직은 /exam/lessons/:id/start /retake 설계에 따라
   *       별도 엔드포인트에서 구현 예정이며, 여기서는 기존 동작을 유지한다.
   */
  async checkEligibility(userId: string, subjectId: string) {
    // 회사 수강기간 체크
    await this.ensureWithinCompanyPeriod(userId);

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
   *
   * TODO: 레슨 단위 시험(cycle/tryIndex)은 /exam/lessons/:id/start로 분리 설계되어 있다.
   *       본 메서드는 Subject 단위 구버전 플로우를 지원하며, cycle 로직과는 분리해서 유지한다.
   */
  async startExam(userId: string, subjectId: string): Promise<StartExamResponseDto> {
    // 회사 수강기간 체크
    await this.ensureWithinCompanyPeriod(userId);

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
    // 회사 수강기간 체크
    await this.ensureWithinCompanyPeriod(userId);

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

    // ✅ 기본 합격 여부(과목 단위 시험용, 기존 로직 유지)
    // 레슨 단위 수료 로직은 아래에서 별도로 Progress.finalScore / passed에 반영
    const passed = examScore >= 70;

    // 4-A. 레슨 단위 수료 로직 (lessonId가 있는 경우에만 적용)
    // - 진도율(progressPercent) 20% + 시험 점수 80% = 최종 점수(finalScore)
    // - finalScore >= 70 && progressPercent >= 90일 때 해당 레슨을 수료로 간주
    if (attempt.lessonId) {
      const lessonId = attempt.lessonId;

      // 해당 레슨의 Progress 조회 (없을 수도 있으므로 upsert 형태로 처리)
      let progress = await this.prisma.progress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        }
      });

      if (!progress) {
        // 이론상 시험 응시 전에는 항상 Progress가 존재해야 하지만,
        // 방어적으로 기본 레코드를 생성해 둔다.
        progress = await this.prisma.progress.create({
          data: {
            userId,
            lessonId,
            progressPercent: 0,
            maxReachedSeconds: 0,
            videoDuration: 0,
            status: 'inProgress'
          }
        });
      }

      const rawProgressPercent = progress.progressPercent ?? 0;
      const clampedProgressPercent = Math.max(0, Math.min(100, rawProgressPercent));

      const progressScore = clampedProgressPercent * 0.2; // 100% 진도 시 20점
      const examScoreComponent = examScore * 0.8;         // 시험 점수(0~100)를 80% 비중으로 반영
      const finalScore = progressScore + examScoreComponent; // 0 ~ 100

      const lessonPassed = finalScore >= 70 && clampedProgressPercent >= 90;

      await this.prisma.progress.update({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        data: {
          finalScore,
          passed: lessonPassed,
          // 이미 completedAt이 있는 경우는 유지, 새로 수료된 경우에만 완료 시점 기록
          completedAt: lessonPassed && !progress.completedAt ? new Date() : progress.completedAt
        }
      });
    }

    // 4-B. 시험 시도 기록 저장 (과목/레슨 공통)
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
   * 레슨 단위 시험 시작
   * - 경로: POST /exam/lessons/:lessonId/start
   * - 전제:
   *   - 회사 수강기간 내
   *   - 회사 활성 레슨
   *   - 레슨 진도율 ≥ 90%
   */
  async startLessonExam(userId: string, lessonId: string) {
    // 회사 수강기간 체크
    await this.ensureWithinCompanyPeriod(userId);

    // 사용자 + 회사 + 활성 레슨 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            activeLessons: {
              include: {
                lesson: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.company) {
      throw new ForbiddenException('회사에 소속되지 않은 사용자입니다.');
    }

    const activeLesson = user.company.activeLessons.find(
      (cl) => cl.lessonId === lessonId,
    );
    if (!activeLesson || !activeLesson.lesson?.isActive) {
      throw new ForbiddenException('해당 레슨에 접근할 권한이 없습니다.');
    }

    const lesson = activeLesson.lesson;

    // 레슨 진도율 확인 (90% 미만이면 시험 불가)
    const progress = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (!progress || (progress.progressPercent ?? 0) < 90) {
      throw new ForbiddenException(
        '레슨 진도율이 90% 이상이어야 시험을 시작할 수 있습니다.',
      );
    }

    // 레슨에 대한 기존 시험 시도 조회
    const existingAttempts = await this.prisma.examAttempt.findMany({
      where: {
        userId,
        lessonId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 이미 합격한 경우 시험 시작 불가
    if (existingAttempts.some((a) => a.passed)) {
      throw new ForbiddenException('이미 이 레슨 시험에 합격하셨습니다.');
    }

    // 다음 사이클/시도 정보 계산 (최대 2사이클 × 3회 = 6회)
    const {
      cycle,
      attemptNumber,
    } = await this.getNextLessonAttemptMeta(userId, lessonId, existingAttempts);

    // 문제은행 조회 (과목 단위)
    const questions = await this.prisma.question.findMany({
      where: {
        subjectId: lesson.subjectId,
        isActive: true,
      },
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (questions.length < 10) {
      throw new UnprocessableEntityException(
        `문제은행이 부족합니다. 최소 10문항이 필요하지만 현재 ${questions.length}문항만 있습니다.`,
      );
    }

    const selectedQuestions = selectRandom(
      questions,
      Math.min(10, questions.length),
    );
    const questionIds = selectedQuestions.map((q) => q.id);

    const attempt = await this.prisma.examAttempt.create({
      data: {
        userId,
        subjectId: lesson.subjectId,
        lessonId: lesson.id,
        cycle,
        attemptNumber,
        status: 'inProgress',
        questionIds,
        startedAt: new Date(),
      },
    });

    const responseQuestions = selectedQuestions.map((q) => ({
      id: q.id,
      content: q.stem,
      choices: q.choices.map((c) => c.text),
    }));

    return {
      attemptId: attempt.id,
      lessonId: lesson.id,
      questions: responseQuestions,
    };
  }

  /**
   * 레슨 단위 시험 재응시
   * - 경로: POST /exam/lessons/:lessonId/retake
   * - 결과는 allowed 플래그와 사이클/시도 정보로 반환
   *   (에러 코드 대신 응답 본문으로 처리하여 프론트에서 메시지 제어)
   */
  async retakeLessonExam(userId: string, lessonId: string) {
    // 회사 수강기간 체크
    await this.ensureWithinCompanyPeriod(userId);

    // 레슨 및 진도, 회사 활성 레슨 여부는 start와 동일하게 검증
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            activeLessons: {
              include: {
                lesson: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.company) {
      return {
        allowed: false,
        cycle: 0,
        tryIndex: 0,
        remainingTries: 0,
        message: '회사에 소속되지 않은 사용자입니다.',
      };
    }

    const activeLesson = user.company.activeLessons.find(
      (cl) => cl.lessonId === lessonId,
    );
    if (!activeLesson || !activeLesson.lesson?.isActive) {
      return {
        allowed: false,
        cycle: 0,
        tryIndex: 0,
        remainingTries: 0,
        message: '해당 레슨에 접근할 권한이 없습니다.',
      };
    }

    const progress = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (!progress || (progress.progressPercent ?? 0) < 90) {
      return {
        allowed: false,
        cycle: 0,
        tryIndex: 0,
        remainingTries: 0,
        message: '레슨 진도율이 90% 이상이어야 재응시할 수 있습니다.',
      };
    }

    const existingAttempts = await this.prisma.examAttempt.findMany({
      where: {
        userId,
        lessonId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 이미 합격한 경우 재응시 불가
    if (existingAttempts.some((a) => a.passed)) {
      return {
        allowed: false,
        cycle: 0,
        tryIndex: 0,
        remainingTries: 0,
        message: '이미 이 레슨 시험에 합격하셨습니다.',
      };
    }

    const maxAttemptsPerCycle = 3;
    const maxCycles = 2;
    const maxAttempts = maxAttemptsPerCycle * maxCycles;
    const totalAttempts = existingAttempts.length;

    if (totalAttempts >= maxAttempts) {
      return {
        allowed: false,
        cycle: maxCycles,
        tryIndex: maxAttemptsPerCycle,
        remainingTries: 0,
        message: '재응시 기회를 모두 사용하셨습니다.',
      };
    }

    const {
      cycle,
      attemptNumber,
      tryIndex,
      remainingTries,
    } = await this.getNextLessonAttemptMeta(userId, lessonId, existingAttempts);

    const lesson = activeLesson.lesson;

    // 문제은행 조회 (과목 단위)
    const questions = await this.prisma.question.findMany({
      where: {
        subjectId: lesson.subjectId,
        isActive: true,
      },
      include: {
        choices: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (questions.length < 10) {
      return {
        allowed: false,
        cycle,
        tryIndex,
        remainingTries,
        message: `문제은행이 부족합니다. 최소 10문항이 필요하지만 현재 ${questions.length}문항만 있습니다.`,
      };
    }

    const selectedQuestions = selectRandom(
      questions,
      Math.min(10, questions.length),
    );
    const questionIds = selectedQuestions.map((q) => q.id);

    await this.prisma.examAttempt.create({
      data: {
        userId,
        subjectId: lesson.subjectId,
        lessonId: lesson.id,
        cycle,
        attemptNumber,
        status: 'inProgress',
        questionIds,
        startedAt: new Date(),
      },
    });

    return {
      allowed: true,
      cycle,
      tryIndex,
      remainingTries,
    };
  }

  /**
   * 회사 수강기간(교육기간) 내인지 확인
   * - 회사 미배정 또는 비활성/기간 외인 경우 시험 관련 모든 행위를 차단
   */
  private async ensureWithinCompanyPeriod(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
      },
    });

    if (!user || !user.company) {
      throw new ForbiddenException('회사에 소속되지 않은 사용자입니다.');
    }

    const now = new Date();
    if (now < user.company.startDate || now > user.company.endDate) {
      throw new ForbiddenException('수강기간이 아닙니다.');
    }
  }

  /**
   * 레슨 단위 다음 시험 시도 메타 계산
   * - cycle: 1~2 (최대 2사이클)
   * - attemptNumber: 전체 시도 순번
   * - tryIndex: 해당 사이클 내 시도 순번 (1~3)
   */
  private async getNextLessonAttemptMeta(
    userId: string,
    lessonId: string,
    existingAttempts?: Array<{
      id: string;
      cycle: number;
      attemptNumber: number;
      passed: boolean | null;
    }>,
  ): Promise<{
    cycle: number;
    attemptNumber: number;
    tryIndex: number;
    remainingTries: number;
  }> {
    const maxAttemptsPerCycle = 3;
    const maxCycles = 2;
    const maxAttempts = maxAttemptsPerCycle * maxCycles;

    const attempts =
      existingAttempts ??
      (await this.prisma.examAttempt.findMany({
        where: { userId, lessonId },
        orderBy: { createdAt: 'asc' },
      }));

    const totalAttempts = attempts.length;

    if (totalAttempts >= maxAttempts) {
      throw new ForbiddenException('재응시 기회를 모두 사용했습니다.');
    }

    const latestCycle =
      attempts.reduce(
        (max, a) => (a.cycle && a.cycle > max ? a.cycle : max),
        0,
      ) || 0;

    let cycle: number;
    let tryIndex: number;

    if (latestCycle === 0) {
      // 첫 시도
      cycle = 1;
      tryIndex = 1;
    } else {
      const attemptsInLatestCycle = attempts.filter(
        (a) => (a.cycle || 1) === latestCycle,
      );
      if (attemptsInLatestCycle.length < maxAttemptsPerCycle) {
        // 현재 사이클에서 다음 시도
        cycle = latestCycle;
        tryIndex = attemptsInLatestCycle.length + 1;
      } else {
        // 사이클 변경
        if (latestCycle >= maxCycles) {
          throw new ForbiddenException('재응시 기회를 모두 사용했습니다.');
        }
        cycle = latestCycle + 1;
        tryIndex = 1;
      }
    }

    const attemptNumber = totalAttempts + 1;
    const remainingTries = Math.max(0, maxAttempts - attemptNumber);

    return { cycle, attemptNumber, tryIndex, remainingTries };
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
