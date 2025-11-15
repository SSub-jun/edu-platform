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
            startDate: true,
            endDate: true,
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            activeLessons: {
              include: {
                lesson: {
                  include: { subject: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.company) {
      return { success: true, data: [] };
    }

    const activeLessons = user.company.activeLessons.map(cl => cl.lesson);
    const grouped = new Map<string, { subject: any; lessons: any[]; remainingDays: number }>();
    
    for (const lesson of activeLessons) {
      const subject = lesson.subject;
      if (!grouped.has(subject.id)) {
        const now = new Date();
        const end = user.company.endDate as Date;
        const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        grouped.set(subject.id, { subject: { id: subject.id, name: subject.name, description: subject.description, order: subject.order }, lessons: [], remainingDays });
      }
      
      // 실제 레슨 상태를 가져오기
      try {
        const lessonStatus = await this.progressService.getLessonStatus(userId, lesson.id);
        
        // 상태 결정 로직: 합격 > 진행 중 > 사용 가능 > 잠김
        let status: 'locked' | 'available' | 'passed';
        if (lessonStatus.completed) {
          status = 'passed';  // 시험 합격
        } else if (!lessonStatus.unlocked) {
          status = 'locked';  // 이전 레슨 미완료
        } else {
          status = 'available';  // 학습 가능
        }
        
        grouped.get(subject.id)!.lessons.push({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          subjectId: lesson.subjectId,
          progressPercent: lessonStatus.progressPercent,
          status: status,
          remainingTries: lessonStatus.remainingTries,
          totalDurationMs: 0, // 임시로 0 유지
        });
      } catch (error) {
        // 에러 발생 시 기본값 사용
        console.error(`Error getting lesson status for lesson ${lesson.id}:`, error);
        grouped.get(subject.id)!.lessons.push({
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

    const data = Array.from(grouped.values());
    return { success: true, data };
  }
}



