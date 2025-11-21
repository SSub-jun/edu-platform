import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminCompanyService } from './admin-company.service';
import { CreateCompanyDto, UpdateInviteCodeDto, CompanyResponseDto, InviteCodeResponseDto } from './dto/company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { IsArray, IsString } from 'class-validator';

// 기관별 과목 배정용 DTO
class AssignSubjectsDto {
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];
}

@ApiTags('Admin - Companies')
@Controller('admin/companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminCompanyController {
  constructor(
    private readonly adminCompanyService: AdminCompanyService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ 
    summary: '회사 생성',
    description: '새 회사를 생성합니다. 초대코드를 제공하지 않으면 자동으로 생성됩니다.'
  })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ 
    status: 201, 
    description: '회사 생성 성공',
    type: CompanyResponseDto
  })
  @ApiResponse({ 
    status: 409, 
    description: '초대코드 중복',
    schema: {
      example: { code: 'INVITE_CODE_CONFLICT', message: '이미 사용 중인 초대코드입니다.' }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: '권한 없음 - 관리자만 접근 가능'
  })
  async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.adminCompanyService.createCompany(createCompanyDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ 
    summary: '회사 목록 조회',
    description: '모든 회사 목록을 조회합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: '회사 목록 조회 성공',
    type: [CompanyResponseDto]
  })
  @ApiResponse({ 
    status: 403, 
    description: '권한 없음 - 관리자만 접근 가능'
  })
  async listCompanies() {
    return this.adminCompanyService.listCompanies();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: '회사 상세 조회',
    description: '특정 회사의 상세 정보를 조회합니다. 소속 사용자와 활성 레슨 정보를 포함합니다.'
  })
  @ApiParam({ name: 'id', description: '회사 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '회사 상세 조회 성공'
  })
  @ApiResponse({ 
    status: 404, 
    description: '회사를 찾을 수 없음',
    schema: {
      example: { code: 'COMPANY_NOT_FOUND', message: '회사를 찾을 수 없습니다.' }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: '권한 없음 - 관리자만 접근 가능'
  })
  async getCompany(@Param('id') id: string) {
    return this.adminCompanyService.getCompany(id);
  }

  @Get(':id/overview')
  @Roles('admin')
  @ApiOperation({ 
    summary: '회사 개요 조회',
    description: '회사별 학습 현황, Cohort, 과목, 학생 통계 등을 조회합니다.'
  })
  @ApiParam({ name: 'id', description: '회사 ID' })
  @ApiResponse({ status: 200, description: '회사 개요 조회 성공' })
  async getCompanyOverview(@Param('id') id: string) {
    return this.adminCompanyService.getCompanyOverview(id);
  }

  @Patch(':id/invite-code')
  @Roles('admin')
  @ApiOperation({ 
    summary: '초대코드 변경',
    description: '회사의 초대코드를 변경합니다. 새 코드를 제공하지 않으면 자동으로 생성됩니다.'
  })
  @ApiParam({ name: 'id', description: '회사 ID' })
  @ApiBody({ type: UpdateInviteCodeDto })
  @ApiResponse({ 
    status: 200, 
    description: '초대코드 변경 성공',
    type: InviteCodeResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: '회사를 찾을 수 없음',
    schema: {
      example: { code: 'COMPANY_NOT_FOUND', message: '회사를 찾을 수 없습니다.' }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: '초대코드 중복',
    schema: {
      example: { code: 'INVITE_CODE_CONFLICT', message: '이미 사용 중인 초대코드입니다.' }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: '권한 없음 - 관리자만 접근 가능'
  })
  async updateInviteCode(
    @Param('id') id: string,
    @Body() updateInviteCodeDto: UpdateInviteCodeDto,
  ): Promise<InviteCodeResponseDto> {
    return this.adminCompanyService.updateInviteCode(id, updateInviteCodeDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ 
    summary: '회사 삭제',
    description: '회사를 삭제합니다. 연관된 데이터(사용자, 레슨 배정 등)도 함께 삭제됩니다.'
  })
  @ApiParam({ name: 'id', description: '회사 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '회사 삭제 성공',
    schema: {
      example: { success: true, message: '회사가 삭제되었습니다.' }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '회사를 찾을 수 없음',
    schema: {
      example: { code: 'COMPANY_NOT_FOUND', message: '회사를 찾을 수 없습니다.' }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: '권한 없음 - 관리자만 접근 가능'
  })
  async deleteCompany(@Param('id') id: string) {
    return this.adminCompanyService.deleteCompany(id);
  }

  // =============== 기관별 과목 배정 ===============

  @Patch(':id/subjects')
  @Roles('admin')
  @ApiOperation({ 
    summary: '기관별 과목 배정',
    description: '기관에 제공할 과목들을 배정합니다. 기존 배정은 모두 교체됩니다.'
  })
  @ApiParam({ name: 'id', description: '기관 ID' })
  @ApiResponse({ status: 200, description: '과목 배정 성공' })
  async assignSubjects(
    @Param('id') companyId: string,
    @Body() dto: AssignSubjectsDto
  ) {
    // 기존 배정 삭제
    await this.prisma.companyLesson.deleteMany({
      where: { companyId }
    });

    // 새로운 과목들 배정
    const assignments = await Promise.all(
      dto.subjectIds.map(async (subjectId) => {
        // Subject의 모든 Lesson을 해당 Company에 배정
        const lessons = await this.prisma.lesson.findMany({
          where: { subjectId, isActive: true }
        });

        return Promise.all(
          lessons.map(lesson =>
            this.prisma.companyLesson.create({
              data: {
                companyId,
                lessonId: lesson.id
              }
            })
          )
        );
      })
    );

    return {
      success: true,
      data: {
        companyId,
        assignedSubjects: dto.subjectIds.length,
        assignedLessons: assignments.flat().length
      }
    };
  }

  @Get(':id/subjects')
  @Roles('admin')
  @ApiOperation({ 
    summary: '기관 배정 과목 조회',
    description: '기관에 배정된 과목 목록을 조회합니다.'
  })
  @ApiParam({ name: 'id', description: '기관 ID' })
  @ApiResponse({ status: 200, description: '배정 과목 조회 성공' })
  async getAssignedSubjects(@Param('id') companyId: string) {
    const companyLessons = await this.prisma.companyLesson.findMany({
      where: { companyId },
      include: {
        lesson: {
          include: {
            subject: true
          }
        }
      }
    });

    // Subject별로 그룹핑
    const subjectMap = new Map();
    companyLessons.forEach(cl => {
      const subject = cl.lesson.subject;
      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          id: subject.id,
          name: subject.name,
          description: subject.description,
          lessonCount: 0
        });
      }
      subjectMap.get(subject.id).lessonCount++;
    });

    return {
      success: true,
      data: Array.from(subjectMap.values())
    };
  }
}





