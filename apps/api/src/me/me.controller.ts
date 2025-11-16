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
      const result: any[] = [];

      for (const cs of activeCohort.cohortSubjects) {
        const subject = cs.subject;
        
        // Subject 진도율 및 수료 상태 조회
        const subjectProgress = await this.progressService.getSubjectStatus(userId, subject.id);
        
        const lessons: any[] = [];
        for (const lesson of subject.lessons) {
          try {
            const lessonStatus = await this.progressService.getLessonStatus(userId, lesson.id);
            
            // Lesson 상태 결정
            let status: 'locked' | 'available' | 'passed';
            if (lessonStatus.completed) {
              status = 'passed';
            } else if (!lessonStatus.unlocked) {
              status = 'locked';
            } else {
              status = 'available';
            }
            
            lessons.push({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              order: lesson.order,
              subjectId: lesson.subjectId,
              progressPercent: lessonStatus.progressPercent,
              status: status,
              remainingTries: lessonStatus.remainingTries,
              totalDurationMs: 0,
            });
          } catch (error) {
            console.error(`Error getting lesson status for lesson ${lesson.id}:`, error);
            lessons.push({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              order: lesson.order,
              subjectId: lesson.subjectId,
              progressPercent: 0,
              status: 'available',
              remainingTries: 3,
              totalDurationMs: 0,
            });
          }
        }

        result.push({
          subject: {
            id: subject.id,
            name: subject.name,
            description: subject.description,
            order: subject.order,
            // Subject 수료 정보 추가
            progressPercent: subjectProgress.progressPercent,
            passed: subjectProgress.passed,
            finalScore: subjectProgress.finalScore,
            examAttemptCount: subjectProgress.examAttemptCount,
            remainingTries: subjectProgress.remainingTries,
            canTakeExam: subjectProgress.canTakeExam,
            canRestart: subjectProgress.canRestart,
            // Cohort 수강 기간 정보 추가
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



