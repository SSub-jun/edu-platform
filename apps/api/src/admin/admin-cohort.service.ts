import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCohortDto, UpdateCohortDto } from './dto/cohort.dto';

@Injectable()
export class AdminCohortService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cohort 생성
   */
  async createCohort(dto: CreateCohortDto) {
    const { companyId, name, startDate, endDate, isActive = true } = dto;

    // 회사 존재 확인
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // 날짜 유효성 검증
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Cohort 생성
    const cohort = await this.prisma.cohort.create({
      data: {
        companyId,
        name,
        startDate: start,
        endDate: end,
        isActive,
      },
      include: {
        company: true,
      },
    });

    return cohort;
  }

  /**
   * 특정 회사의 Cohort 목록 조회
   */
  async getCohortsByCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const cohorts = await this.prisma.cohort.findMany({
      where: { companyId },
      include: {
        company: true,
        cohortSubjects: {
          include: {
            subject: true,
          },
        },
        userCohorts: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cohorts;
  }

  /**
   * Cohort 상세 조회
   */
  async getCohortById(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        company: true,
        cohortSubjects: {
          include: {
            subject: true,
          },
        },
        userCohorts: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
    }

    return cohort;
  }

  /**
   * Cohort 수정
   */
  async updateCohort(cohortId: string, dto: UpdateCohortDto) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
    }

    const updateData: any = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.startDate !== undefined) {
      updateData.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      updateData.endDate = new Date(dto.endDate);
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    // 날짜 유효성 검증
    const finalStartDate = updateData.startDate || cohort.startDate;
    const finalEndDate = updateData.endDate || cohort.endDate;

    if (finalStartDate >= finalEndDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const updated = await this.prisma.cohort.update({
      where: { id: cohortId },
      data: updateData,
      include: {
        company: true,
      },
    });

    return updated;
  }

  /**
   * Cohort 삭제 (비활성화)
   */
  async deleteCohort(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
    }

    // 실제 삭제 대신 비활성화
    await this.prisma.cohort.update({
      where: { id: cohortId },
      data: { isActive: false },
    });

    return { success: true, message: 'Cohort deactivated successfully' };
  }

  /**
   * Cohort에 과목 배정
   */
  async assignSubjects(cohortId: string, subjectIds: string[]) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
    }

    // 과목 존재 확인
    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
    });

    if (subjects.length !== subjectIds.length) {
      throw new BadRequestException('One or more subjects not found');
    }

    // 기존 배정 삭제
    await this.prisma.cohortSubject.deleteMany({
      where: { cohortId },
    });

    // 새 배정 생성
    await this.prisma.cohortSubject.createMany({
      data: subjectIds.map((subjectId) => ({
        cohortId,
        subjectId,
      })),
    });

    // 업데이트된 Cohort 반환
    return this.getCohortById(cohortId);
  }

  /**
   * Cohort에 배정된 과목 목록 조회
   */
  async getCohortSubjects(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        cohortSubjects: {
          include: {
            subject: {
              include: {
                lessons: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
    }

    return cohort.cohortSubjects.map((cs) => cs.subject);
  }

  /**
   * Cohort에 학생 배정
   */
  async assignStudents(cohortId: string, userIds: string[]) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
    }

    // 학생 존재 확인
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        role: 'student',
      },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException('One or more students not found or not a student role');
    }

    // 기존 배정 삭제
    await this.prisma.userCohort.deleteMany({
      where: { cohortId },
    });

    // 새 배정 생성
    await this.prisma.userCohort.createMany({
      data: userIds.map((userId) => ({
        userId,
        cohortId,
      })),
    });

    // 업데이트된 Cohort 반환
    return this.getCohortById(cohortId);
  }

  /**
   * Cohort에 배정된 학생 목록 조회
   */
  async getCohortStudents(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        userCohorts: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                phone: true,
                role: true,
                companyId: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!cohort) {
      throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
    }

    return cohort.userCohorts.map((uc) => uc.user);
  }
}

