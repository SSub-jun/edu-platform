import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PortalSelectionMode {
  RANDOM = 'RANDOM',
  MANUAL = 'MANUAL',
}

export class CreateSessionDto {
  @ApiProperty({ description: '세션 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '세션 번호' })
  @IsInt()
  @Min(1)
  sessionNo: number;

  @ApiProperty({ enum: PortalSelectionMode, description: '문제 선택 모드' })
  @IsEnum(PortalSelectionMode)
  mode: PortalSelectionMode;

  @ApiProperty({ description: '출제 문항 수', required: false, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  questionCount?: number;

  @ApiProperty({ description: '제한시간(분)', required: false, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  timeLimitMinutes?: number;

  @ApiProperty({ description: '문제은행 ID (RANDOM 모드에서 필수)', required: false })
  @IsOptional()
  @IsString()
  bankId?: string;
}





