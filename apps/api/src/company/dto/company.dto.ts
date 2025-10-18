import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: '회사명',
    example: 'A기업'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '수강 시작일',
    example: '2024-01-01'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: '수강 종료일',
    example: '2024-12-31'
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: '활성화할 레슨 ID 목록',
    type: [String],
    example: ['lesson-1', 'lesson-2', 'lesson-3']
  })
  @IsArray()
  @IsString({ each: true })
  activeLessons: string[];
}

export class AssignStudentsDto {
  @ApiProperty({
    description: '할당할 학생 ID 목록',
    type: [String],
    example: ['user-1', 'user-2']
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

export class UpdateActiveLessonsDto {
  @ApiProperty({
    description: '활성화할 레슨 ID 목록',
    type: [String],
    example: ['lesson-1', 'lesson-2']
  })
  @IsArray()
  @IsString({ each: true })
  activeLessons: string[];
}

export class CompanyInfoDto {
  @ApiProperty({
    description: '회사 ID',
    example: 'company-a'
  })
  id: string;

  @ApiProperty({
    description: '회사명',
    example: 'A기업'
  })
  name: string;

  @ApiProperty({
    description: '수강 시작일',
    example: '2024-01-01'
  })
  startDate: string;

  @ApiProperty({
    description: '수강 종료일',
    example: '2024-12-31'
  })
  endDate: string;

  @ApiProperty({
    description: '활성화 여부',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: '소속 학생 수',
    example: 5
  })
  studentCount: number;

  @ApiProperty({
    description: '활성화된 레슨 목록',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        lessonId: { type: 'string', example: 'lesson-1' },
        lessonTitle: { type: 'string', example: '1장: 수와 연산' },
        subjectName: { type: 'string', example: '수학' }
      }
    }
  })
  activeLessons: Array<{
    lessonId: string;
    lessonTitle: string;
    subjectName: string;
  }>;
}
