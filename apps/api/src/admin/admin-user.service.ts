import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto, AdminUserResponseDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminUserService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService as any;
  }

  async createAdminUser(data: CreateAdminUserDto): Promise<AdminUserResponseDto> {
    // 1. username 중복 체크
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'USERNAME_ALREADY_EXISTS',
        message: '이미 사용 중인 사용자명입니다.',
      });
    }

    // 2. phone 중복 체크 (있는 경우)
    if (data.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });

      if (existingPhone) {
        throw new ConflictException({
          code: 'PHONE_ALREADY_REGISTERED',
          message: '이미 등록된 휴대폰 번호입니다.',
        });
      }
    }

    // 3. 회사 존재 확인 (있는 경우)
    if (data.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId },
      });

      if (!company) {
        throw new NotFoundException({
          code: 'COMPANY_NOT_FOUND',
          message: '존재하지 않는 회사입니다.',
        });
      }
    }

    // 4. 비밀번호 해시화
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 5. 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        role: data.role,
        email: data.email,
        phone: data.phone,
        companyId: data.companyId,
        phoneVerifiedAt: data.phone ? new Date() : null, // 관리자가 추가한 번호는 자동 인증됨
      },
    });

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone,
      companyId: user.companyId,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    };
  }

  async listAdminUsers(): Promise<AdminUserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'instructor'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone,
      companyId: user.companyId,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }));
  }

  async deleteAdminUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '존재하지 않는 사용자입니다.',
      });
    }

    if (user.role === 'student') {
      throw new ConflictException({
        code: 'CANNOT_DELETE_STUDENT',
        message: '학생 계정은 이 API로 삭제할 수 없습니다.',
      });
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}









