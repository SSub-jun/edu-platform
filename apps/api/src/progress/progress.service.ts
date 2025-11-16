import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PingProgressDto, ProgressStatusDto, NextAvailableDto, LessonStatusDto } from './dto/progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async pingProgress(userId: string, pingDto: PingProgressDto) {
    const { lessonId, maxReachedSeconds, videoDuration } = pingDto;

    // 사용자와 회사 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            activeLessons: {
              include: {
                lesson: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!user.company) {
      throw new ForbiddenException('회사에 소속되지 않은 사용자입니다.');
    }

    // 회사 수강기간 확인
    const now = new Date();
    if (user.company.startDate && user.company.endDate && (now < user.company.startDate || now > user.company.endDate)) {
      throw new ForbiddenException('수강기간이 아닙니다.');
    }

    // 레슨이 회사 활성화 레슨에 포함되는지 확인
    const isActiveLesson = user.company.activeLessons.some(cl => cl.lessonId === lessonId);
    if (!isActiveLesson) {
      throw new ForbiddenException('해당 레슨에 접근할 권한이 없습니다.');
    }

    // 레슨 존재 여부 확인
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isActive: true },
      include: { subject: true }
    });

    if (!lesson) {
      throw new NotFoundException('레슨을 찾을 수 없습니다.');
    }

    // 기존 Progress 조회 또는 생성
    let progress = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    if (!progress) {
      progress = await this.prisma.progress.create({
        data: {
          userId,
          lessonId,
          progressPercent: 0,
          maxReachedSeconds: 0,
          videoDuration: videoDuration || 0,
          status: 'inProgress'
        }
      });
    }

    // maxReachedSeconds는 항상 증가만 가능 (되돌리기 불가)
    const newMaxReached = Math.max(progress.maxReachedSeconds, maxReachedSeconds);
    const newVideoDuration = videoDuration || progress.videoDuration || 240; // 기본 4분
    
    // 진도율 계산: (maxReachedSeconds / videoDuration) * 100
    let newProgressPercent = 0;
    if (newVideoDuration > 0) {
      newProgressPercent = Math.min((newMaxReached / newVideoDuration) * 100, 100);
    }

    // Progress 업데이트
    progress = await this.prisma.progress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      data: {
        maxReachedSeconds: newMaxReached,
        videoDuration: newVideoDuration,
        progressPercent: newProgressPercent,
        status: newProgressPercent >= 90 ? 'completed' : 'inProgress',
        updatedAt: new Date()
      }
    });

    return {
      progressPercent: progress.progressPercent,
      maxReachedSeconds: progress.maxReachedSeconds,
      lessonProgressPercent: progress.progressPercent,
      subjectProgressEstimate: 50 // 임시값
    };
  }

  async getStatus(userId: string): Promise<ProgressStatusDto> {
    // 사용자 기본 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            activeLessons: {
              include: {
                lesson: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.company) {
      throw new ForbiddenException('회사에 소속되지 않은 사용자입니다.');
    }

    // 회사 수강기간 확인
    const now = new Date();
    if (user.company.startDate && user.company.endDate && (now < user.company.startDate || now > user.company.endDate)) {
      throw new ForbiddenException('수강기간이 아닙니다.');
    }

    const activeLessons = user.company.activeLessons.map(cl => cl.lesson);
    const subjectIds = Array.from(new Set(activeLessons.map(lesson => lesson.subjectId)));
    const subjects = await this.prisma.subject.findMany({ where: { id: { in: subjectIds } } });
    
    // 사용자의 진도 조회
    const userProgress = await this.prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            subject: true
          }
        }
      }
    });

    // 과목별 진도 계산
    const subjectProgresses = subjects.map(subject => {
      const subjectLessons = activeLessons.filter(lesson => lesson.subjectId === subject.id);
      const subjectProgress = userProgress.filter(p => p.lesson.subjectId === subject.id);
      
      const totalLessons = subjectLessons.length;
      if (totalLessons === 0) {
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          progressPercent: 0,
          completedLessons: 0,
          totalLessons: 0
        };
      }

      // ✅ 레슨 개수 기반이 아닌, 레슨 progressPercent 기반 평균 진도율로 계산
      // - 각 레슨의 progressPercent(0~100)를 모두 합산 후, 레슨 수로 나눔
      // - 일부 레슨만 조금씩 수강한 경우도 비례 반영
      const sumProgressPercent = subjectLessons.reduce((sum, lesson) => {
        const progress = subjectProgress.find(p => p.lessonId === lesson.id);
        return sum + (progress?.progressPercent ?? 0);
      }, 0);

      const progressPercent = sumProgressPercent / totalLessons;

      // 참고용: 90% 이상 완료된 레슨 수는 별도로 유지
      const completedLessons = subjectLessons.filter(lesson => {
        const progress = subjectProgress.find(p => p.lessonId === lesson.id);
        return (progress?.progressPercent ?? 0) >= 90;
      }).length;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        progressPercent,
        completedLessons,
        totalLessons
      };
    });

    let currentSubject: {
      subjectId: string;
      subjectName: string;
      progressPercent: number;
      currentLessonId: string;
      currentLessonTitle: string;
    } | null = null;
    
    // 현재 학습 중인 과목 찾기
    for (const subject of subjects) {
      const subjectProgress = userProgress.filter(p => p.lesson.subjectId === subject.id);
      const incompleteProgress = subjectProgress.find(p => p.progressPercent < 90);
      
      if (incompleteProgress) {
        currentSubject = {
          subjectId: subject.id,
          subjectName: subject.name,
          progressPercent: incompleteProgress.progressPercent,
          currentLessonId: incompleteProgress.lessonId,
          currentLessonTitle: incompleteProgress.lesson.title
        };
        break;
      }
    }

    // 첫 번째 과목의 정보를 반환 (단일 과목 기준 DTO)
    const firstSubject = subjectProgresses[0];
    if (!firstSubject) {
      throw new NotFoundException('활성화된 과목이 없습니다.');
    }

    return {
      subjectId: firstSubject.subjectId,
      subjectName: firstSubject.subjectName,
      progressPercent: firstSubject.progressPercent,
      lastLessonId: currentSubject?.currentLessonId || null,
      lastPartId: null, // 추후 구현
      lastPlayedMs: 0, // 추후 구현
      lockedLessons: [], // 추후 구현
      nextAvailableLessonId: null // 추후 구현
    };
  }

  async getNextAvailable(userId: string): Promise<NextAvailableDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            activeLessons: {
              include: {
                lesson: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.company) {
      throw new ForbiddenException('회사에 소속되지 않은 사용자입니다.');
    }

    // 회사 수강기간 확인
    const now = new Date();
    if (user.company.startDate && user.company.endDate && (now < user.company.startDate || now > user.company.endDate)) {
      throw new ForbiddenException('수강기간이 아닙니다.');
    }

    const activeLessons = user.company.activeLessons
      .map(cl => cl.lesson)
      .sort((a, b) => a.order - b.order);

    if (activeLessons.length === 0) {
      return {
        nextSubject: null,
        currentSubject: null,
        lock: false,
        blockedBy: null
      };
    }

    const userLessonProgress = await this.prisma.progress.findMany({
      where: {
        userId,
        lessonId: {
          in: activeLessons.map(l => l.id)
        }
      }
    });

    let nextLesson: typeof activeLessons[0] | null = null;
    let lock = false;
    let blockedBy: { lessonId: string; lessonTitle: string; order: number } | null = null;

    for (let i = 0; i < activeLessons.length; i++) {
      const lesson = activeLessons[i];
      const progress = userLessonProgress.find(p => p.lessonId === lesson.id);
      const progressPercent = progress?.progressPercent || 0;

      // 이전 레슨 시험 합격 여부 확인
      let previousPassed = true;
      if (i > 0) {
        const previousLesson = activeLessons[i - 1];
        const previousExamAttempt = await this.prisma.examAttempt.findFirst({
          where: {
            userId,
            lessonId: previousLesson.id,
            passed: true
          }
        });
        previousPassed = !!previousExamAttempt;
      }

      // 현재 레슨이 해금되어 있는지 확인 (이전 레슨 합격 AND 진도 90% 이상)
      const unlocked = previousPassed && progressPercent >= 90;

      if (unlocked && !nextLesson) {
        nextLesson = lesson;
      } else if (!unlocked && !nextLesson) {
        // 첫 번째 잠긴 레슨을 찾음
        lock = true;
        if (i > 0) {
          const previousLesson = activeLessons[i - 1];
          blockedBy = {
            lessonId: previousLesson.id,
            lessonTitle: previousLesson.title,
            order: previousLesson.order
          };
        }
        break;
      }
    }

    // 다음 레슨이 없으면 첫 번째 레슨 (모든 레슨 완료 또는 초기 상태)
    if (!nextLesson && activeLessons.length > 0) {
      nextLesson = activeLessons[0];
    }

    return {
      nextSubject: nextLesson ? {
        subjectId: nextLesson.subject.id,
        subjectName: nextLesson.subject.name,
        lessonId: nextLesson.id,
        lessonTitle: nextLesson.title,
        partId: `part-${nextLesson.id}-1`,
        partTitle: `${nextLesson.title} - 1부`
      } : null,
      currentSubject: null, // Lesson 단위에서는 사용하지 않음
      lock,
      blockedBy
    };
  }

  async getLessonStatus(userId: string, lessonId: string): Promise<LessonStatusDto> {
    // 사용자와 회사 정보 조회
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            activeLessons: {
              include: {
                lesson: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.company) {
      throw new ForbiddenException('회사에 소속되지 않은 사용자입니다.');
    }

    // 회사 수강기간 확인
    const now = new Date();
    if (user.company.startDate && user.company.endDate && (now < user.company.startDate || now > user.company.endDate)) {
      throw new ForbiddenException('수강기간이 아닙니다.');
    }

    // 해당 레슨이 활성화 레슨인지 확인
    const isActiveLesson = user.company.activeLessons.some(cl => cl.lessonId === lessonId);
    if (!isActiveLesson) {
      throw new ForbiddenException('해당 레슨에 접근할 권한이 없습니다.');
    }

    // 레슨 정보 조회 (비디오 정보 포함)
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { 
        subject: true,
        videoParts: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!lesson) {
      throw new NotFoundException('레슨을 찾을 수 없습니다.');
    }

    // 해당 레슨의 진도 조회
    const progress = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    // 이전 레슨들의 상태 확인
    const previousLesson = await this.prisma.lesson.findFirst({
      where: {
        subjectId: lesson.subjectId,
        order: lesson.order - 1,
        isActive: true
      }
    });

    let unlocked = true;
    const blockers: Array<{
      type: 'prevNotCompleted' | 'period' | 'notAssigned';
      lessonId?: string;
      lessonTitle?: string;
      message: string;
    }> = [];

    // 이전 레슨 진도율 확인 (시험은 Subject 단위이므로 진도율만 체크)
    if (previousLesson) {
      const previousProgress = await this.prisma.progress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: previousLesson.id,
          },
        },
      });

      // 이전 레슨이 90% 이상 완료되지 않았으면 잠금
      if (!previousProgress || previousProgress.progressPercent < 90) {
        unlocked = false;
        blockers.push({
          type: 'prevNotCompleted' as const,
          lessonId: previousLesson.id,
          lessonTitle: previousLesson.title,
          message: '이전 레슨을 90% 이상 완료해야 합니다.'
        });
      }
    }

    // 레슨 단위 남은 응시 횟수 계산 (최대 2사이클 × 3회 = 6회)
    const maxAttemptsPerCycle = 3;
    const maxCycles = 2;
    const maxAttempts = maxAttemptsPerCycle * maxCycles;

    const totalAttemptsForLesson = await this.prisma.examAttempt.count({
      where: {
        userId,
        lessonId
      }
    });

    const lessonPassed = !!progress?.passed;
    const remainingTries = lessonPassed
      ? 0
      : Math.max(0, maxAttempts - totalAttemptsForLesson);

    return {
      lessonId,
      lessonTitle: lesson.title,
      progressPercent: progress?.progressPercent || 0,
      maxReachedSeconds: progress?.maxReachedSeconds || 0,
      subjectId: lesson.subjectId,
      unlocked,
      completed: lessonPassed,
      remainingTries,
      blockers,
      completedAt: progress?.completedAt ? progress.completedAt.toISOString() : null,
      videoParts: lesson.videoParts.map(vp => ({
        id: vp.id,
        title: vp.title,
        videoUrl: vp.videoUrl,
        order: vp.order
      }))
    };
  }

  private async hasPassedLesson(userId: string, lessonId: string): Promise<boolean> {
    // Lesson 기반이 아니라 Subject 기반으로 변경되었으므로
    // 해당 lesson의 subject 시험 합격 여부 확인
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { subjectId: true }
    });

    if (!lesson) return false;

    const passedAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        userId,
        subjectId: lesson.subjectId,
        passed: true
      }
    });

    return !!passedAttempt;
  }

  private async calculateLessonTotalDuration(lessonId: string): Promise<number> {
    const result = await this.prisma.videoPart.aggregate({
      where: {
        lessonId,
        isActive: true
      },
      _sum: {
        durationMs: true
      }
    });

    return result._sum.durationMs || 0;
  }

  /**
   * Subject 진도율 및 시험 가능 여부 조회
   */
  async getSubjectStatus(userId: string, subjectId: string) {
    // Subject 정보 및 Lesson 목록 조회
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        lessons: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!subject) {
      throw new NotFoundException('과목을 찾을 수 없습니다.');
    }

    // SubjectProgress 조회 또는 생성
    let subjectProgress = await this.prisma.subjectProgress.findUnique({
      where: {
        userId_subjectId: {
          userId,
          subjectId
        }
      }
    });

    if (!subjectProgress) {
      subjectProgress = await this.prisma.subjectProgress.create({
        data: {
          userId,
          subjectId,
          progressPercent: 0,
          examAttemptCount: 0,
          cycle: 1
        }
      });
    }

    // 각 Lesson의 진도율 조회
    const lessonProgresses = await this.prisma.progress.findMany({
      where: {
        userId,
        lessonId: { in: subject.lessons.map(l => l.id) }
      }
    });

    // Lesson 평균 수강률 계산
    const totalLessons = subject.lessons.length;
    let sumProgressPercent = 0;
    let allLessonsAbove90 = true;

    for (const lesson of subject.lessons) {
      const progress = lessonProgresses.find(p => p.lessonId === lesson.id);
      const progressPercent = progress?.progressPercent ?? 0;
      sumProgressPercent += progressPercent;

      if (progressPercent < 90) {
        allLessonsAbove90 = false;
      }
    }

    const avgProgressPercent = totalLessons > 0 ? sumProgressPercent / totalLessons : 0;

    // SubjectProgress의 progressPercent 업데이트
    if (Math.abs(subjectProgress.progressPercent - avgProgressPercent) > 0.01) {
      subjectProgress = await this.prisma.subjectProgress.update({
        where: {
          userId_subjectId: {
            userId,
            subjectId
          }
        },
        data: {
          progressPercent: avgProgressPercent
        }
      });
    }

    // 현재 사이클의 시험 시도 횟수 조회
    const currentCycleAttempts = await this.prisma.examAttempt.count({
      where: {
        userId,
        subjectId,
        cycle: subjectProgress.cycle
      }
    });

    // 시험 가능 여부 판정
    // 1. 모든 Lesson이 90% 이상이어야 함
    // 2. 현재 사이클에서 3회 미만 시도
    // 3. 아직 수료하지 않았어야 함
    const canTakeExam = allLessonsAbove90 && currentCycleAttempts < 3 && !subjectProgress.passed;

    // 다시 수강하기 가능 여부
    // 1. 수료하지 않았고
    // 2. 현재 사이클에서 3회 모두 시도했을 때
    const canRestart = !subjectProgress.passed && currentCycleAttempts >= 3;

    // 남은 시험 횟수
    const remainingTries = subjectProgress.passed ? 0 : Math.max(0, 3 - currentCycleAttempts);

    return {
      progressPercent: avgProgressPercent,
      passed: subjectProgress.passed ?? false,
      finalScore: subjectProgress.finalScore ?? null,
      examAttemptCount: currentCycleAttempts,
      remainingTries,
      canTakeExam,
      canRestart,
      cycle: subjectProgress.cycle,
      allLessonsAbove90,
      completedAt: subjectProgress.completedAt ?? null
    };
  }
}