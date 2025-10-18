import { Controller, Post, Get, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminUserService } from './admin-user.service';
import { CreateAdminUserDto, AdminUserResponseDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// 학생 계정 생성용 DTO
class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class AdminUserController {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @ApiOperation({ 
    summary: '관리자/강사 계정 생성', 
    description: '관리자 권한으로 새로운 관리자 또는 강사 계정을 생성합니다.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: '사용자 생성 성공', 
    type: AdminUserResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: '중복된 사용자명 또는 휴대폰 번호',
    schema: {
      examples: {
        usernameConflict: {
          value: { code: 'USERNAME_ALREADY_EXISTS', message: '이미 사용 중인 사용자명입니다.' }
        },
        phoneConflict: {
          value: { code: 'PHONE_ALREADY_REGISTERED', message: '이미 등록된 휴대폰 번호입니다.' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '존재하지 않는 회사',
    schema: {
      example: { code: 'COMPANY_NOT_FOUND', message: '존재하지 않는 회사입니다.' }
    }
  })
  async createAdminUser(@Body() createUserDto: CreateAdminUserDto): Promise<AdminUserResponseDto> {
    return this.adminUserService.createAdminUser(createUserDto);
  }

  @Get()
  @ApiOperation({ 
    summary: '관리자/강사 목록 조회', 
    description: '등록된 모든 관리자와 강사 계정을 조회합니다.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '사용자 목록 조회 성공', 
    type: [AdminUserResponseDto] 
  })
  async listAdminUsers(): Promise<AdminUserResponseDto[]> {
    return this.adminUserService.listAdminUsers();
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: '관리자/강사 계정 삭제', 
    description: '지정된 관리자 또는 강사 계정을 삭제합니다. 학생 계정은 삭제할 수 없습니다.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '사용자 삭제 성공' 
  })
  @ApiResponse({ 
    status: 404, 
    description: '존재하지 않는 사용자',
    schema: {
      example: { code: 'USER_NOT_FOUND', message: '존재하지 않는 사용자입니다.' }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: '학생 계정 삭제 시도',
    schema: {
      example: { code: 'CANNOT_DELETE_STUDENT', message: '학생 계정은 이 API로 삭제할 수 없습니다.' }
    }
  })
  async deleteAdminUser(@Param('id') userId: string): Promise<{ success: boolean }> {
    await this.adminUserService.deleteAdminUser(userId);
    return { success: true };
  }

  // =============== 학생 계정 관리 ===============

  @Post('students')
  @ApiOperation({ 
    summary: '학생 계정 생성', 
    description: '관리자 권한으로 새로운 학생 계정을 생성합니다.' 
  })
  @ApiResponse({ status: 201, description: '학생 계정 생성 성공' })
  async createStudent(@Body() dto: CreateStudentDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    const student = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash: hashedPassword,
        phone: dto.phone,
        email: dto.email,
        role: 'student',
        companyId: dto.companyId || null,
        phoneVerifiedAt: new Date() // 관리자가 생성하는 계정은 즉시 인증됨
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return {
      success: true,
      data: {
        id: student.id,
        username: student.username,
        phone: student.phone,
        email: student.email,
        role: student.role,
        company: student.company,
        createdAt: student.createdAt
      }
    };
  }

  @Get('students')
  @ApiOperation({ 
    summary: '학생 계정 목록 조회', 
    description: '모든 학생 계정을 조회합니다.' 
  })
  @ApiResponse({ status: 200, description: '학생 목록 조회 성공' })
  async getStudents(@Query('companyId') companyId?: string) {
    const where: any = { role: 'student' };
    if (companyId) {
      where.companyId = companyId;
    }

    const students = await this.prisma.user.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        subjectProgress: {
          include: {
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            examAttempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: students.map(student => ({
        id: student.id,
        username: student.username,
        phone: student.phone,
        email: student.email,
        company: student.company,
        subjectProgress: student.subjectProgress,
        examAttempts: student._count.examAttempts,
        lastLoginAt: student.lastLoginAt,
        createdAt: student.createdAt
      }))
    };
  }

  @Delete('students/:id')
  @ApiOperation({ 
    summary: '학생 계정 삭제', 
    description: '지정된 학생 계정을 삭제합니다.' 
  })
  @ApiResponse({ status: 200, description: '학생 삭제 성공' })
  async deleteStudent(@Param('id') studentId: string) {
    await this.prisma.user.delete({
      where: { 
        id: studentId,
        role: 'student' // 안전을 위해 학생만 삭제 가능
      }
    });

    return { success: true, message: 'Student deleted successfully' };
  }
}





