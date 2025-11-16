import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminCohortService } from './admin-cohort.service';
import {
  CreateCohortDto,
  UpdateCohortDto,
  AssignCohortSubjectsDto,
  AssignCohortStudentsDto,
  CohortResponseDto,
} from './dto/cohort.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Admin - Cohorts')
@Controller('admin/cohorts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminCohortController {
  constructor(private readonly cohortService: AdminCohortService) {}

  @Post()
  @ApiOperation({ summary: 'Cohort 생성' })
  @ApiResponse({ status: 201, description: 'Cohort가 성공적으로 생성됨', type: CohortResponseDto })
  async createCohort(@Body() dto: CreateCohortDto) {
    return this.cohortService.createCohort(dto);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: '특정 회사의 Cohort 목록 조회' })
  @ApiParam({ name: 'companyId', description: '회사 ID' })
  @ApiResponse({ status: 200, description: 'Cohort 목록', type: [CohortResponseDto] })
  async getCohortsByCompany(@Param('companyId') companyId: string) {
    return this.cohortService.getCohortsByCompany(companyId);
  }

  @Get(':cohortId')
  @ApiOperation({ summary: 'Cohort 상세 조회' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiResponse({ status: 200, description: 'Cohort 상세 정보', type: CohortResponseDto })
  async getCohortById(@Param('cohortId') cohortId: string) {
    return this.cohortService.getCohortById(cohortId);
  }

  @Patch(':cohortId')
  @ApiOperation({ summary: 'Cohort 수정' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiResponse({ status: 200, description: 'Cohort가 성공적으로 수정됨', type: CohortResponseDto })
  async updateCohort(@Param('cohortId') cohortId: string, @Body() dto: UpdateCohortDto) {
    return this.cohortService.updateCohort(cohortId, dto);
  }

  @Delete(':cohortId')
  @ApiOperation({ summary: 'Cohort 삭제 (비활성화)' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiResponse({ status: 200, description: 'Cohort가 성공적으로 비활성화됨' })
  async deleteCohort(@Param('cohortId') cohortId: string) {
    return this.cohortService.deleteCohort(cohortId);
  }

  @Get(':cohortId/subjects')
  @ApiOperation({ summary: 'Cohort에 배정된 과목 목록 조회' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiResponse({ status: 200, description: '배정된 과목 목록' })
  async getCohortSubjects(@Param('cohortId') cohortId: string) {
    return this.cohortService.getCohortSubjects(cohortId);
  }

  @Put(':cohortId/subjects')
  @ApiOperation({ summary: 'Cohort에 과목 배정' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiResponse({ status: 200, description: '과목이 성공적으로 배정됨' })
  async assignSubjects(@Param('cohortId') cohortId: string, @Body() dto: AssignCohortSubjectsDto) {
    return this.cohortService.assignSubjects(cohortId, dto.subjectIds);
  }

  @Get(':cohortId/students')
  @ApiOperation({ summary: 'Cohort에 배정된 학생 목록 조회' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiResponse({ status: 200, description: '배정된 학생 목록' })
  async getCohortStudents(@Param('cohortId') cohortId: string) {
    return this.cohortService.getCohortStudents(cohortId);
  }

  @Put(':cohortId/students')
  @ApiOperation({ summary: 'Cohort에 학생 배정' })
  @ApiParam({ name: 'cohortId', description: 'Cohort ID' })
  @ApiResponse({ status: 200, description: '학생이 성공적으로 배정됨' })
  async assignStudents(@Param('cohortId') cohortId: string, @Body() dto: AssignCohortStudentsDto) {
    return this.cohortService.assignStudents(cohortId, dto.userIds);
  }
}

