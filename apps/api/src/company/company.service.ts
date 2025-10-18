import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(createCompanyDto: {
    name: string;
    startDate: Date;
    endDate: Date;
    activeLessons: string[];
  }) {
    const { name, startDate, endDate, activeLessons } = createCompanyDto;

    // 날짜 유효성 검사
    if (startDate >= endDate) {
      throw new BadRequestException('시작일은 종료일보다 이전이어야 합니다.');
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
