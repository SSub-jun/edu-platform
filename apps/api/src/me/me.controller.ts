import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('Me')
@Controller('me')
@Auth()
@ApiBearerAuth()
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService
  ) {}

  @Get('profile')
  @ApiOperation({
    summary: '사용자 프로필 조회',
    description: '현재 로그인한 사용자의 프로필 정보를 조회합니다. 회사 배정 상태도 포함됩니다.'
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    schema: {
      example: {
        success: true,
        data: {
          id: 'user123',
          username: 'testuser',
          phone: '01012345678',
          email: 'test@example.com',
          role: 'student',
          isCompanyAssigned: false,
          company: null,
          createdAt: '2024-08-24T06:00:00.000Z'
        }
      }
    }
  })
  async profile(@Request() req: any) {
    const userId = req.user.sub as string;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        }
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: (user as any).name ?? null,
        username: user.username,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isCompanyAssigned: !!user.companyId,
        company: user.company,
        createdAt: user.createdAt,
      }
    };
  }

  @Get('curriculum')
  async curriculum(@Request() req: any) {
    const userId = req.user.sub as string;
    
    // 사용자의 활성 Cohort 조회
    const userCohorts = await this.prisma.userCohort.findMany({
      where: { 
        userId,
        cohort: {
          isActive: true
        }
      },
      include: {
        cohort: {
          include: {
            company: true,
            cohortSubjects: {
              include: {
                subject: {
                  include: {
                    lessons: {
                      where: { isActive: true },
                      orderBy: { order: 'asc' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userCohorts || userCohorts.length === 0) {
      return { success: true, data: [] };
    }

    // 첫 번째 활성 Cohort 사용 (나중에 여러 Cohort 지원 가능)
    const activeCohort = userCohorts[0].cohort;
    if (!activeCohort) {
      return { success: true, data: [] };
    }

    const now = new Date();
    const end = activeCohort.endDate as Date;
    const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Cohort 기반 커리큘럼
    if (activeCohort.cohortSubjects && activeCohort.cohortSubjects.length > 0) {
      // ✅ 최적화: 모든 subjectId와 lessonId를 미리 수집
      const allSubjectIds = activeCohort.cohortSubjects.map(cs => cs.subject.id);
      const allLessonIds = activeCohort.cohortSubjects.flatMap(cs => 
        cs.subject.lessons.map(l => l.id)
      );

      // ✅ 최적화: 모든 진도율 데이터를 한 번에 조회
      const [subjectProgressMap, lessonProgressMap, examAttemptsMap] = await Promise.all([
        // Subject 진도율
        this.prisma.subjectProgress.findMany({
          where: { userId, subjectId: { in: allSubjectIds } }
        }).then(data => new Map(data.map(sp => [sp.subjectId, sp]))),
        
        // Lesson 진도율
        this.prisma.progress.findMany({
          where: { userId, lessonId: { in: allLessonIds } }
        }).then(data => new Map(data.map(p => [p.lessonId, p]))),
        
        // Exam 시도 횟수
        this.prisma.examAttempt.groupBy({
          by: ['subjectId'],
          where: { userId, subjectId: { in: allSubjectIds } },
          _count: { id: true }
        }).then(data => new Map(data.map(e => [e.subjectId, e._count.id])))
      ]);

      const result: any[] = [];

      for (const cs of activeCohort.cohortSubjects) {
        const subject = cs.subject;
        const subjectProgress = subjectProgressMap.get(subject.id);
        const examAttemptCount = examAttemptsMap.get(subject.id) || 0;

        // 레슨 목록 및 진도율 계산
        const lessons: any[] = [];
        let sumLessonProgress = 0;

        for (const lesson of subject.lessons) {
          const lessonProgress = lessonProgressMap.get(lesson.id);
          const lessonProgressPercent = lessonProgress?.progressPercent || 0;
          sumLessonProgress += lessonProgressPercent;

          // Lesson 상태 결정 (간단화)
          let status: 'locked' | 'available' | 'passed';
          if (lessonProgressPercent >= 90) {
            status = 'passed';
          } else {
            status = 'available';
          }

          lessons.push({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            subjectId: lesson.subjectId,
            progressPercent: lessonProgressPercent,
            status: status,
            remainingTries: 3,
            totalDurationMs: 0,
          });
        }

        // ✅ 과목 진도율: 레슨 진도율 평균으로 직접 계산 (SubjectProgress 테이블 대신)
        const calculatedProgressPercent = subject.lessons.length > 0
          ? sumLessonProgress / subject.lessons.length
          : 0;

        // Subject 수료 상태 (passed, finalScore는 SubjectProgress에서 가져옴)
        const passed = subjectProgress?.passed || false;
        const finalScore = subjectProgress?.finalScore;
        const remainingTries = Math.max(0, 3 - examAttemptCount);
        const canTakeExam = calculatedProgressPercent >= 90 && remainingTries > 0 && !passed;
        const canRestart = examAttemptCount >= 3 && !passed;

        result.push({
          subject: {
            id: subject.id,
            name: subject.name,
            description: subject.description,
            order: subject.order,
            progressPercent: calculatedProgressPercent,
            passed,
            finalScore,
            examAttemptCount,
            remainingTries,
            canTakeExam,
            canRestart,
            startDate: activeCohort.startDate,
            endDate: activeCohort.endDate,
          },
          lessons,
          remainingDays
        });
      }

      return { success: true, data: result };
    }

    // activeSubjects가 없으면 빈 배열 반환
    return { success: true, data: [] };
  }
}



