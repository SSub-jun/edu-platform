import { IsArray, IsNumber, IsString, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ description: '문제 ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: '선택한 답 인덱스 (0-3)', minimum: 0, maximum: 3 })
  @IsNumber()
  choiceIndex: number;
}

export class SubmitExamDto {
  @ApiProperty({ 
    type: [AnswerDto], 
    description: '제출 답안',
    minItems: 1,
    maxItems: 50
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

export class QuestionResponseDto {
  @ApiProperty({ description: '문제 ID' })
  id: string;

  @ApiProperty({ description: '문제 내용' })
  content: string;

  @ApiProperty({ description: '선택지 배열', type: [String] })
  choices: string[];
}

export class StartExamResponseDto {
  @ApiProperty({ description: '시험 시도 ID' })
  attemptId: string;

  @ApiProperty({ description: '과목 ID' })
  subjectId: string;

  @ApiProperty({ type: [QuestionResponseDto], description: '출제된 문제 목록' })
  questions: QuestionResponseDto[];
}

export class SubmitExamResponseDto {
  @ApiProperty({ description: '시험 점수 (0-100)', minimum: 0, maximum: 100 })
  examScore: number;

  @ApiProperty({ description: '합격 여부 (70점 이상)' })
  passed: boolean;
}

export class RetakeExamResponseDto {
  @ApiProperty({ description: '재응시 가능 여부' })
  allowed: boolean;

  @ApiProperty({ description: '다음 사이클 번호', required: false })
  nextCycle?: number;
}

export class ResetExamAttemptsDto {
  @ApiProperty({ 
    description: '학생 사용자 ID',
    example: 'cmedy080y000d46adnevuchsh'
  })
  @IsString()
  userId: string;

  @ApiProperty({ 
    description: '과목 ID',
    example: 'subject-math'
  })
  @IsString()
  subjectId: string;
}

export class ResetExamAttemptsResponseDto {
  @ApiProperty({ description: '초기화 성공 여부' })
  success: boolean;

  @ApiProperty({ description: '결과 메시지' })
  message: string;

  @ApiProperty({ description: '삭제된 시도 기록 수' })
  deletedCount: number;
}

export class DeleteExamAttemptResponseDto {
  @ApiProperty({ description: '삭제 성공 여부' })
  success: boolean;

  @ApiProperty({ description: '결과 메시지' })
  message: string;

  @ApiProperty({ description: '삭제된 시험 기록 정보', required: false })
  deletedAttempt?: {
    attemptId: string;
    subjectName: string;
    score: number;
    attemptNumber: number;
  };
}