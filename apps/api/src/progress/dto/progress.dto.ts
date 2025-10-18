import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class PingProgressDto {
  @ApiProperty({
    description: '레슨 ID',
    example: 'lesson-1'
  })
  @IsString()
  lessonId: string;

  @ApiProperty({
    description: '비디오 파트 ID (선택사항)',
    example: 'part-lesson-1-1',
    required: false
  })
  @IsOptional()
  @IsString()
  partId?: string;

  @ApiProperty({
    description: '사용자가 도달한 최대 시청 시점 (초)',
    example: 150.5,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  maxReachedSeconds: number;

  @ApiProperty({
    description: '비디오 총 길이 (초)',
    example: 300,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  videoDuration: number;

  @ApiProperty({
    description: '(하위 호환) 재생된 시간 (밀리초)',
    example: 300000,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  playedMs?: number;
}

export class ProgressStatusDto {
  @ApiProperty({
    description: '과목 ID',
    example: 'subject-math'
  })
  subjectId: string;

  @ApiProperty({
    description: '과목명',
    example: '수학'
  })
  subjectName: string;

  @ApiProperty({
    description: '현재 진도율 (0.0 ~ 100.0)',
    example: 25.5
  })
  progressPercent: number;

  @ApiProperty({
    description: '마지막 학습한 강의 ID',
    example: 'lesson-1',
    nullable: true
  })
  lastLessonId: string | null;

  @ApiProperty({
    description: '마지막 학습한 비디오 파트 ID',
    example: 'part-lesson-1-1',
    nullable: true
  })
  lastPartId: string | null;

  @ApiProperty({
    description: '마지막 재생 시간 (밀리초)',
    example: 300000
  })
  lastPlayedMs: number;

  @ApiProperty({
    description: '잠긴 강의 목록 (진도율 90% 미만인 강의들)',
    type: [String],
    example: ['lesson-2', 'lesson-3']
  })
  lockedLessons: string[];

  @ApiProperty({
    description: '다음 학습 가능한 강의 ID',
    example: 'lesson-1',
    nullable: true
  })
  nextAvailableLessonId: string | null;
}

export class NextAvailableDto {
  @ApiProperty({
    description: '다음 학습 가능한 과목 정보',
    type: 'object',
    properties: {
      subjectId: { type: 'string', example: 'subject-math' },
      subjectName: { type: 'string', example: '수학' },
      lessonId: { type: 'string', example: 'lesson-1' },
      lessonTitle: { type: 'string', example: '1장: 수와 연산' },
      partId: { type: 'string', example: 'part-lesson-1-1' },
      partTitle: { type: 'string', example: '1장: 수와 연산 - 1부' }
    },
    nullable: true
  })
  nextSubject: {
    subjectId: string;
    subjectName: string;
    lessonId: string;
    lessonTitle: string;
    partId: string;
    partTitle: string;
  } | null;

  @ApiProperty({
    description: '현재 진행 중인 과목 정보',
    type: 'object',
    properties: {
      subjectId: { type: 'string', example: 'subject-math' },
      subjectName: { type: 'string', example: '수학' },
      progressPercent: { type: 'number', example: 25.5 },
      currentLessonId: { type: 'string', example: 'lesson-1' },
      currentLessonTitle: { type: 'string', example: '1장: 수와 연산' }
    },
    nullable: true
  })
  currentSubject: {
    subjectId: string;
    subjectName: string;
    progressPercent: number;
    currentLessonId: string;
    currentLessonTitle: string;
  } | null;

  @ApiProperty({
    description: '레슨 잠금 여부 (이전 레슨이 완료되지 않았을 때 true)',
    example: false
  })
  lock: boolean;

  @ApiProperty({
    description: '잠금 원인 레슨 정보 (lock=true일 때만 제공)',
    type: 'object',
    properties: {
      lessonId: { type: 'string', example: 'lesson-1' },
      lessonTitle: { type: 'string', example: '1장: 수와 연산' },
      order: { type: 'number', example: 1 }
    },
    nullable: true
  })
  blockedBy: {
    lessonId: string;
    lessonTitle: string;
    order: number;
  } | null;
}

export class LessonStatusDto {
  @ApiProperty({
    description: '레슨 ID',
    example: 'lesson-1'
  })
  lessonId: string;

  @ApiProperty({
    description: '레슨 제목',
    example: '1장: 수와 연산'
  })
  lessonTitle: string;

  @ApiProperty({
    description: '진도율 (0.0 ~ 100.0)',
    example: 75.5
  })
  progressPercent: number;

  @ApiProperty({
    description: '해금 여부 (이전 레슨 시험 합격 && 진도율 ≥90%)',
    example: false
  })
  unlocked: boolean;

  @ApiProperty({
    description: '완료 여부 (시험 합격)',
    example: false
  })
  completed: boolean;

  @ApiProperty({
    description: '남은 시험 응시 횟수',
    example: 3
  })
  remainingTries: number;

  @ApiProperty({
    description: '잠금 사유들',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'prevNotCompleted' },
        lessonId: { type: 'string', example: 'lesson-1' },
        lessonTitle: { type: 'string', example: '1장: 기초' },
        message: { type: 'string', example: '이전 레슨의 시험에 합격해야 합니다.' }
      }
    }
  })
  blockers: Array<{
    type: 'prevNotCompleted' | 'period' | 'notAssigned';
    lessonId?: string;
    lessonTitle?: string;
    message: string;
  }>;

  @ApiProperty({
    description: '완료 시간',
    example: '2024-01-15T10:30:00Z',
    nullable: true
  })
  completedAt: string | null;

  @ApiProperty({
    description: '사용자가 도달한 최대 시청 시점 (초)',
    example: 150.5
  })
  maxReachedSeconds: number;

  @ApiProperty({
    description: '과목 ID',
    example: 'subject-math'
  })
  subjectId: string;

  @ApiProperty({
    description: '레슨에 포함된 비디오 파트들',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'video-1' },
        title: { type: 'string', example: '1부: 개요' },
        videoUrl: { type: 'string', example: '/uploads/videos/video-123.mp4' },
        order: { type: 'number', example: 0 }
      }
    }
  })
  videoParts: Array<{
    id: string;
    title: string;
    videoUrl: string | null;
    order: number;
  }>;
}

export class CompanyLessonDto {
  @ApiProperty({
    description: '회사 ID',
    example: 'company-a'
  })
  companyId: string;

  @ApiProperty({
    description: '회사명',
    example: 'A기업'
  })
  companyName: string;

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
    description: '활성화된 레슨 목록',
    type: [String],
    example: ['lesson-1', 'lesson-2', 'lesson-3']
  })
  activeLessons: string[];
}
