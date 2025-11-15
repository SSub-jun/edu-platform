import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(createCompanyDto: {
    name: string;
    startDate: Date;
    endDate: Date;
    activeLessons?: string[];  // 구버전 호환용 (deprecated)
    activeSubjects?: string[]; // 신규: Subject 단위 배정
  }) {
    const { name, startDate, endDate, activeLessons, activeSubjects } = createCompanyDto;

    // 날짜 유효성 검사
    if (startDate >= endDate) {
      throw new BadRequestException('시작일은 종료일보다 이전이어야 합니다.');
    }

    // 교육기간은 "임의의 시작일 기준 6개월 단위"로 운영
    // - 고정 상/하반기(1~6월, 7~12월)가 아니라, 관리자가 설정한 startDate를 기준으로 정확히 6개월 뒤까지 허용
    // - 6개월 정의: 동일한 일(day-of-month)을 기준으로 month를 +6 한 날짜
    //   예) 2025-03-10 시작 → 2025-09-10 종료
    const expectedEnd = new Date(startDate.getTime());
    expectedEnd.setMonth(expectedEnd.getMonth() + 6);

    const toDateKey = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD 기준 비교
    if (toDateKey(endDate) !== toDateKey(expectedEnd)) {
      throw new BadRequestException(
        `교육기간은 시작일 기준 6개월 단위로만 설정할 수 있습니다. (예: 시작일이 ${toDateKey(
          startDate,
        )}이면 종료일은 ${toDateKey(expectedEnd)}이어야 합니다.)`,
      );
    }

    // 신규: Subject 단위 배정 (우선순위)
    if (activeSubjects && activeSubjects.length > 0) {
      // Subject들이 존재하는지 확인
      const subjects = await this.prisma.subject.findMany({
        where: {
          id: { in: activeSubjects },
          isActive: true
        }
      });

      if (subjects.length !== activeSubjects.length) {
        throw new BadRequestException('일부 과목을 찾을 수 없습니다.');
      }

      // 회사 생성
      const company = await this.prisma.company.create({
        data: {
          name,
          startDate,
          endDate,
          isActive: true
        }
      });

      // Subject 배정
      await Promise.all(
        activeSubjects.map(subjectId =>
          this.prisma.companySubject.create({
            data: {
              companyId: company.id,
              subjectId
            }
          })
        )
      );

      return company;
    }

    // 구버전 호환: Lesson 단위 배정 (deprecated, activeSubjects가 없을 때만 사용)
    if (activeLessons && activeLessons.length > 0) {
      const lessons = await this.prisma.lesson.findMany({
        where: {
          id: { in: activeLessons },
          isActive: true
        }
      });

      if (lessons.length !== activeLessons.length) {
        throw new BadRequestException('일부 레슨을 찾을 수 없습니다.');
      }

      // 회사 생성
      const company = await this.prisma.company.create({
        data: {
          name,
          startDate,
          endDate,
          isActive: true
        }
      });

      // 활성화 레슨 연결
      await Promise.all(
        activeLessons.map(lessonId =>
          this.prisma.companyLesson.create({
            data: {
              companyId: company.id,
              lessonId
            }
          })
        )
      );

      return company;
    }

    // activeSubjects도 activeLessons도 없으면 에러
    throw new BadRequestException('배정할 과목 또는 레슨을 지정해야 합니다.');
  }

  async assignStudents(companyId: string, userIds: string[]) {
    // 회사 존재 여부 확인
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, isActive: true }
    });

    if (!company) {
      throw new NotFoundException('회사를 찾을 수 없습니다.');
    }

    // 사용자들이 존재하는지 확인
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        role: 'student'
      }
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('일부 사용자를 찾을 수 없거나 학생이 아닙니다.');
    }

    // 사용자들을 회사에 할당
    await this.prisma.user.updateMany({
      where: {
        id: { in: userIds }
      },
      data: {
        companyId
      }
    });

    return { message: `${users.length}명의 학생이 회사에 할당되었습니다.` };
  }

  // 신규: Subject 단위 배정 업데이트
  async updateActiveSubjects(companyId: string, activeSubjects: string[]) {
    // 회사 존재 여부 확인
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, isActive: true }
    });

    if (!company) {
      throw new NotFoundException('회사를 찾을 수 없습니다.');
    }

    // Subject들이 존재하는지 확인
    const subjects = await this.prisma.subject.findMany({
      where: {
        id: { in: activeSubjects },
        isActive: true
      }
    });

    if (subjects.length !== activeSubjects.length) {
      throw new BadRequestException('일부 과목을 찾을 수 없습니다.');
    }

    // 기존 배정 삭제
    await this.prisma.companySubject.deleteMany({
      where: { companyId }
    });

    // 새로운 Subject 배정
    await Promise.all(
      activeSubjects.map(subjectId =>
        this.prisma.companySubject.create({
          data: {
            companyId,
            subjectId
          }
        })
      )
    );

    return { message: '배정 과목이 업데이트되었습니다.' };
  }

  // 구버전 호환: Lesson 단위 배정 업데이트 (deprecated)
  async updateActiveLessons(companyId: string, activeLessons: string[]) {
    // 회사 존재 여부 확인
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, isActive: true }
    });

    if (!company) {
      throw new NotFoundException('회사를 찾을 수 없습니다.');
    }

    // 활성화할 레슨들이 존재하는지 확인
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: { in: activeLessons },
        isActive: true
      }
    });

    if (lessons.length !== activeLessons.length) {
      throw new BadRequestException('일부 레슨을 찾을 수 없습니다.');
    }

    // 기존 활성화 레슨 삭제
    await this.prisma.companyLesson.deleteMany({
      where: { companyId }
    });

    // 새로운 활성화 레슨 연결
    await Promise.all(
      activeLessons.map(lessonId =>
        this.prisma.companyLesson.create({
          data: {
            companyId,
            lessonId
          }
        })
      )
    );

    return { message: '활성화 레슨이 업데이트되었습니다.' };
  }

  async getCompanyInfo(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, isActive: true },
      include: {
        users: {
          where: { role: 'student' },
          select: {
            id: true,
            username: true,
            createdAt: true
          }
        },
        activeSubjects: {
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
        },
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
    });

    if (!company) {
      throw new NotFoundException('회사를 찾을 수 없습니다.');
    }

    // 신규: Subject 단위 배정 정보 우선 반환
    if (company.activeSubjects && company.activeSubjects.length > 0) {
      return {
        id: company.id,
        name: company.name,
        startDate: company.startDate,
        endDate: company.endDate,
        isActive: company.isActive,
        studentCount: company.users.length,
        activeSubjects: company.activeSubjects.map(cs => ({
          subjectId: cs.subject.id,
          subjectName: cs.subject.name,
          subjectDescription: cs.subject.description,
          lessonCount: cs.subject.lessons.length,
          lessons: cs.subject.lessons.map(l => ({
            lessonId: l.id,
            lessonTitle: l.title,
            lessonOrder: l.order
          }))
        }))
      };
    }

    // 구버전 호환: Lesson 단위 배정 정보 반환
    return {
      id: company.id,
      name: company.name,
      startDate: company.startDate,
      endDate: company.endDate,
      isActive: company.isActive,
      studentCount: company.users.length,
      activeLessons: company.activeLessons.map(cl => ({
        lessonId: cl.lesson.id,
        lessonTitle: cl.lesson.title,
        subjectName: cl.lesson.subject.name
      }))
    };
  }
}
