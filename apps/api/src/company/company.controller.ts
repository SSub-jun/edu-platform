import { Controller, Post, Patch, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { ModeAwareAuthGuard } from '../auth/guards/mode-aware-auth.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { CreateCompanyDto, AssignStudentsDto, UpdateActiveLessonsDto, CompanyInfoDto } from './dto/company.dto';

@ApiTags('Company')
@Controller('company')
@UseGuards(ModeAwareAuthGuard)
@ApiBearerAuth()
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: '회사 생성',
    description: '새로운 회사를 생성하고 활성화할 레슨을 설정합니다.'
  })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ 
    status: 201, 
    description: '회사 생성 성공'
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (관리자만 가능)' })
  async createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    const company = await this.companyService.createCompany({
      ...createCompanyDto,
      startDate: new Date(createCompanyDto.startDate),
      endDate: new Date(createCompanyDto.endDate)
    });
    return company;
  }

  @Patch(':id/assign-students')
  @Roles('admin')
  @ApiOperation({
    summary: '학생 할당',
    description: '회사에 학생들을 할당합니다.'
  })
  @ApiParam({ name: 'id', description: '회사 ID', example: 'company-a' })
  @ApiBody({ type: AssignStudentsDto })
  @ApiResponse({ 
    status: 200, 
    description: '학생 할당 성공'
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (관리자만 가능)' })
  @ApiResponse({ status: 404, description: '회사를 찾을 수 없음' })
  async assignStudents(
    @Param('id') companyId: string,
    @Body() assignStudentsDto: AssignStudentsDto
  ) {
    return await this.companyService.assignStudents(companyId, assignStudentsDto.userIds);
  }

  @Patch(':id/lessons')
  @Roles('admin')
  @ApiOperation({
    summary: '활성화 레슨 변경',
    description: '회사의 활성화 레슨 목록을 변경합니다.'
  })
  @ApiParam({ name: 'id', description: '회사 ID', example: 'company-a' })
  @ApiBody({ type: UpdateActiveLessonsDto })
  @ApiResponse({ 
    status: 200, 
    description: '활성화 레슨 변경 성공'
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (관리자만 가능)' })
  @ApiResponse({ status: 404, description: '회사를 찾을 수 없음' })
  async updateActiveLessons(
    @Param('id') companyId: string,
    @Body() updateActiveLessonsDto: UpdateActiveLessonsDto
  ) {
    return await this.companyService.updateActiveLessons(companyId, updateActiveLessonsDto.activeLessons);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({
    summary: '회사 정보 조회',
    description: '회사의 상세 정보와 소속 학생, 활성화 레슨을 조회합니다.'
  })
  @ApiParam({ name: 'id', description: '회사 ID', example: 'company-a' })
  @ApiResponse({ 
    status: 200, 
    description: '회사 정보 조회 성공',
    type: CompanyInfoDto
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiResponse({ status: 403, description: '권한 없음 (관리자만 가능)' })
  @ApiResponse({ status: 404, description: '회사를 찾을 수 없음' })
  async getCompanyInfo(@Param('id') companyId: string) {
    return await this.companyService.getCompanyInfo(companyId);
  }
}
