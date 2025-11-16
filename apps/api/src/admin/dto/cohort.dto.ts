import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateCohortDto {
  @ApiProperty({ description: '회사 ID' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: '기수 이름', example: '2025년 1기' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '수강 시작일', example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: '수강 종료일', example: '2025-06-30T23:59:59.999Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: '활성 상태', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCohortDto {
  @ApiProperty({ description: '기수 이름', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '수강 시작일', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: '수강 종료일', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: '활성 상태', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignCohortSubjectsDto {
  @ApiProperty({ description: '배정할 과목 ID 목록', type: [String] })
  @IsArray()
  @IsString({ each: true })
  subjectIds: string[];
}

export class AssignCohortStudentsDto {
  @ApiProperty({ description: '배정할 학생 ID 목록', type: [String] })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

export class CohortResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

