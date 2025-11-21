import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({ description: '과목명' })
  @IsString()
  name: string;

  @ApiProperty({ description: '과목 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '정렬 순서', required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ description: '활성 여부', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubjectDto {
  @ApiProperty({ description: '과목명', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '과목 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '정렬 순서', required: false })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiProperty({ description: '활성 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
