import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateInviteCodeDto } from './dto/company.dto';

@Injectable()
export class AdminCompanyService {
  constructor(private readonly prisma: PrismaService) {}

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private async generateUniqueInviteCode(excludeCompanyId?: string) {
    let attempts = 0;
    while (attempts < 10) {
      const candidate = this.generateInviteCode();
      const existing = await this.prisma.company.findUnique({
        where: { inviteCode: candidate },
      });
      if (!existing || existing.id === excludeCompanyId) {
        return candidate;
      }
      attempts++;
    }
    throw new ConflictException({
      code: 'INVITE_CODE_GENERATION_FAILED',
      message: '초대코드 생성에 실패했습니다. 다시 시도해주세요.',
    });
  }

  async createCompany(createCompanyDto: CreateCompanyDto) {
    const { name, startDate, endDate, inviteCode, isActive } = createCompanyDto;

    // 초대코드 생성 또는 검증
    let finalInviteCode = inviteCode?.toUpperCase();
    if (!finalInviteCode) {
      finalInviteCode = await this.generateUniqueInviteCode();
    } else {
    // 제공된 초대코드 중복 체크
    const existingCompany = await this.prisma.company.findUnique({
        where: { inviteCode: finalInviteCode },
    });

    if (existingCompany) {
      throw new ConflictException({
        code: 'INVITE_CODE_CONFLICT',
        message: '이미 사용 중인 초대코드입니다.',
      });
      }
    }

    // 회사 생성
    const company = await this.prisma.company.create({
      data: {
        name,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        inviteCode: finalInviteCode,
        isActive: isActive ?? true,
      },
    });

    return {
      id: company.id,
      name: company.name,
      startDate: company.startDate?.toISOString() || null,
      endDate: company.endDate?.toISOString() || null,
      inviteCode: company.inviteCode!,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }

  async updateInviteCode(companyId: string, updateInviteCodeDto: UpdateInviteCodeDto) {
    // 회사 존재 확인
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: '회사를 찾을 수 없습니다.',
      });
    }

    let nextInviteCode = updateInviteCodeDto.inviteCode?.toUpperCase();
    if (nextInviteCode) {
    // 제공된 초대코드 중복 체크 (같은 회사가 아닌 경우만)
    const conflictCompany = await this.prisma.company.findUnique({
        where: { inviteCode: nextInviteCode },
    });

    if (conflictCompany && conflictCompany.id !== companyId) {
      throw new ConflictException({
        code: 'INVITE_CODE_CONFLICT',
        message: '이미 사용 중인 초대코드입니다.',
      });
      }
    } else {
      nextInviteCode = await this.generateUniqueInviteCode(companyId);
    }

    // 초대코드 업데이트
    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { inviteCode: nextInviteCode },
    });

    return {
      id: updatedCompany.id,
      inviteCode: updatedCompany.inviteCode!,
    };
  }

  async getCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
        activeLessons: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                order: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: '회사를 찾을 수 없습니다.',
      });
    }

    return {
      id: company.id,
      name: company.name,
      startDate: company.startDate?.toISOString() || '',
      endDate: company.endDate?.toISOString() || '',
      inviteCode: company.inviteCode,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      users: company.users,
      activeLessons: company.activeLessons.map(cl => cl.lesson),
    };
  }

  async listCompanies() {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            activeLessons: true,
          },
        },
      },
    });

    return companies.map(company => ({
      id: company.id,
      name: company.name,
      startDate: company.startDate?.toISOString() || null,
      endDate: company.endDate?.toISOString() || null,
      inviteCode: company.inviteCode,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      userCount: company._count.users,
      activeLessonCount: company._count.activeLessons,
    }));
  }

  async deleteCompany(companyId: string) {
    // 회사 존재 확인
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: '회사를 찾을 수 없습니다.',
      });
    }

    // 회사 삭제 (Cascade로 연관 데이터 자동 삭제)
    await this.prisma.company.delete({
      where: { id: companyId },
    });

    return {
      success: true,
      message: '회사가 삭제되었습니다.',
    };
  }

  async getCompanyOverview(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        cohorts: {
          include: {
            cohortSubjects: {
              include: {
                subject: {
                  include: {
                    lessons: {
                      where: { isActive: true },
                      select: { id: true },
                    },
                  },
                },
              },
            },
            userCohorts: {
              include: {
                user: {
                  select: { id: true },
                },
              },
            },
          },
          orderBy: { startDate: 'asc' },
        },
        users: {
          where: { role: 'student' },
          select: {
            id: true,
            username: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true,
            lastLoginAt: true,
            userCohorts: {
              select: { cohortId: true },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: '회사를 찾을 수 없습니다.',
      });
    }

    const now = new Date();
    const totalStudents = company.users.length;
    const unassignedStudents = company.users.filter(
      (user) => user.userCohorts.length === 0,
    );
    const assignedToCohort = totalStudents - unassignedStudents.length;

    const recentLogins = company.users
      .filter((user) => !!user.lastLoginAt)
      .sort(
        (a, b) =>
          (b.lastLoginAt?.getTime() || 0) - (a.lastLoginAt?.getTime() || 0),
      )
      .slice(0, 6)
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
      }));

    const unassignedPreview = unassignedStudents.slice(0, 6).map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
    }));

    const cohortSummaries = company.cohorts.map((cohort) => {
      const durationInDays = Math.ceil(
        (cohort.endDate.getTime() - cohort.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      let status: 'upcoming' | 'ongoing' | 'finished' = 'upcoming';
      let remainingDays: number | null = null;
      if (now < cohort.startDate) {
        status = 'upcoming';
        remainingDays = Math.ceil(
          (cohort.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
      } else if (now > cohort.endDate) {
        status = 'finished';
      } else {
        status = 'ongoing';
        remainingDays = Math.ceil(
          (cohort.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      return {
        id: cohort.id,
        name: cohort.name,
        startDate: cohort.startDate.toISOString(),
        endDate: cohort.endDate.toISOString(),
        isActive: cohort.isActive,
        status,
        durationDays: durationInDays,
        remainingDays,
        subjectCount: cohort.cohortSubjects.length,
        studentCount: cohort.userCohorts.length,
      };
    });

    const activeCohorts = cohortSummaries.filter((cohort) => cohort.isActive);

    const subjectMap = new Map<
      string,
      { id: string; name: string; lessonCount: number; cohortCount: number }
    >();
    company.cohorts.forEach((cohort) => {
      cohort.cohortSubjects.forEach((cohortSubject) => {
        const subject = cohortSubject.subject;
        if (!subject) {
          return;
        }
        if (!subjectMap.has(subject.id)) {
          subjectMap.set(subject.id, {
            id: subject.id,
            name: subject.name,
            lessonCount: subject.lessons.length,
            cohortCount: 0,
          });
        }
        const summary = subjectMap.get(subject.id)!;
        summary.cohortCount += 1;
      });
    });
    const subjectSummaries = Array.from(subjectMap.values());
    const totalLessons = subjectSummaries.reduce(
      (sum, subject) => sum + subject.lessonCount,
      0,
    );

    const studentIds = company.users.map((user) => user.id);

    let avgProgressPercent = 0;
    let progressEntries = 0;
    let completedLessonCount = 0;
    if (studentIds.length > 0) {
      const progressAggregate = await this.prisma.progress.aggregate({
        where: { userId: { in: studentIds } },
        _avg: { progressPercent: true },
        _count: { _all: true },
      });
      avgProgressPercent = progressAggregate._avg.progressPercent || 0;
      progressEntries = progressAggregate._count._all || 0;

      completedLessonCount = await this.prisma.progress.count({
        where: {
          userId: { in: studentIds },
          progressPercent: { gte: 90 },
        },
      });
    }

    let examAttempts = 0;
    let passedExamAttempts = 0;
    let examAverageScore: number | null = null;
    if (studentIds.length > 0) {
      examAttempts = await this.prisma.examAttempt.count({
        where: { userId: { in: studentIds } },
      });
      passedExamAttempts = await this.prisma.examAttempt.count({
        where: { userId: { in: studentIds }, passed: true },
      });
      const examScoreAggregate = await this.prisma.examAttempt.aggregate({
        where: {
          userId: { in: studentIds },
          score: { not: null },
        },
        _avg: { score: true },
      });
      examAverageScore = examScoreAggregate._avg.score ?? null;
    }

    let activeStudents30d = 0;
    if (totalStudents > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      activeStudents30d = await this.prisma.user.count({
        where: {
          companyId,
          role: 'student',
          lastLoginAt: { gte: thirtyDaysAgo },
        },
      });
    }

    const referenceCohort =
      activeCohorts.find((cohort) => cohort.status === 'ongoing') || null;
    let remainingDays: number | null = null;
    if (referenceCohort?.remainingDays != null) {
      remainingDays = referenceCohort.remainingDays;
    } else if (company.endDate) {
      remainingDays = Math.ceil(
        (company.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      company: {
        id: company.id,
        name: company.name,
        inviteCode: company.inviteCode,
        isActive: company.isActive,
        startDate: company.startDate?.toISOString() || null,
        endDate: company.endDate?.toISOString() || null,
        remainingDays,
        totalStudents,
        assignedToCohort,
        unassignedToCohort: unassignedStudents.length,
        activeStudents30d,
      },
      inviteCode: {
        value: company.inviteCode,
        lastUpdatedAt: company.updatedAt.toISOString(),
      },
      cohorts: {
        total: cohortSummaries.length,
        activeCount: activeCohorts.filter((c) => c.status === 'ongoing').length,
        upcomingCount: cohortSummaries.filter((c) => c.status === 'upcoming')
          .length,
        pastCount: cohortSummaries.filter((c) => c.status === 'finished').length,
        items: cohortSummaries,
      },
      subjects: {
        total: subjectSummaries.length,
        lessons: totalLessons,
        items: subjectSummaries,
      },
      progress: {
        avgPercent: avgProgressPercent,
        entryCount: progressEntries,
        completedLessons: completedLessonCount,
      },
      exams: {
        attempts: examAttempts,
        passed: passedExamAttempts,
        avgScore: examAverageScore,
      },
      students: {
        unassigned: unassignedPreview,
        recentLogins,
      },
    };
  }
}
