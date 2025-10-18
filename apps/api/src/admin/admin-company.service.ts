import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateInviteCodeDto } from './dto/company.dto';

@Injectable()
export class AdminCompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(createCompanyDto: CreateCompanyDto) {
    const { name, startDate, endDate, inviteCode, isActive } = createCompanyDto;

    // 제공된 초대코드 중복 체크
    const existingCompany = await this.prisma.company.findUnique({
      where: { inviteCode },
    });

    if (existingCompany) {
      throw new ConflictException({
        code: 'INVITE_CODE_CONFLICT',
        message: '이미 사용 중인 초대코드입니다.',
      });
    }

    // 회사 생성
    const company = await this.prisma.company.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        inviteCode,
        isActive: isActive ?? true,
      },
    });

    return {
      id: company.id,
      name: company.name,
      startDate: company.startDate.toISOString(),
      endDate: company.endDate.toISOString(),
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

    // 제공된 초대코드 중복 체크 (같은 회사가 아닌 경우만)
    const conflictCompany = await this.prisma.company.findUnique({
      where: { inviteCode: updateInviteCodeDto.inviteCode },
    });

    if (conflictCompany && conflictCompany.id !== companyId) {
      throw new ConflictException({
        code: 'INVITE_CODE_CONFLICT',
        message: '이미 사용 중인 초대코드입니다.',
      });
    }

    // 초대코드 업데이트
    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: { inviteCode: updateInviteCodeDto.inviteCode },
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
      startDate: company.startDate.toISOString(),
      endDate: company.endDate.toISOString(),
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
      startDate: company.startDate.toISOString(),
      endDate: company.endDate.toISOString(),
      inviteCode: company.inviteCode,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      userCount: company._count.users,
      activeLessonCount: company._count.activeLessons,
    }));
  }


}
