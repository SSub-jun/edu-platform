import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ description: '문제 내용' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '선택지 목록', type: [String], example: ['선택지 1', '선택지 2', '선택지 3', '선택지 4'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  choices: string[];

  @ApiProperty({ description: '정답 인덱스 (0부터 시작)', example: 0 })
  @IsNumber()
  @IsNotEmpty()
  correctAnswer: number;

  @ApiProperty({ description: '해설', required: false })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ description: '난이도 (1-5)', example: 3, required: false })
  @IsNumber()
  @IsOptional()
  difficulty?: number;

  @ApiProperty({ description: '태그 (쉼표로 구분)', example: '안전, 기초', required: false })
  @IsString()
  @IsOptional()
  tags?: string;
}

export class UpdateQuestionDto {
  @ApiProperty({ description: '문제 내용', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '선택지 목록', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  choices?: string[];

  @ApiProperty({ description: '정답 인덱스 (0부터 시작)', required: false })
  @IsNumber()
  @IsOptional()
  correctAnswer?: number;

  @ApiProperty({ description: '해설', required: false })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiProperty({ description: '난이도 (1-5)', required: false })
  @IsNumber()
  @IsOptional()
  difficulty?: number;

  @ApiProperty({ description: '태그 (쉼표로 구분)', required: false })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiProperty({ description: '활성 상태', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

