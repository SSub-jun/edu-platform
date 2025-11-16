import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ description: '레슨 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '레슨 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '레슨 순서', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  order: number;
}

export class UpdateLessonDto {
  @ApiProperty({ description: '레슨 제목', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '레슨 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '레슨 순서', required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: '활성 상태', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateLessonPartDto {
  @ApiProperty({ description: '파트 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '파트 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '파트 순서', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  order: number;

  @ApiProperty({ description: '비디오 URL' })
  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @ApiProperty({ description: '비디오 길이 (밀리초)', example: 300000 })
  @IsNumber()
  @IsNotEmpty()
  durationMs: number;
}

export class UpdateLessonPartDto {
  @ApiProperty({ description: '파트 제목', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '파트 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '파트 순서', required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ description: '비디오 URL', required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ description: '비디오 길이 (밀리초)', required: false })
  @IsNumber()
  @IsOptional()
  durationMs?: number;

  @ApiProperty({ description: '활성 상태', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

