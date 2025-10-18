import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, Matches } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    description: '회사명',
    example: 'ABC 교육센터',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '수강 시작일',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: '수강 종료일',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: '초대코드 (6자리 영대문자+숫자, 필수 입력)',
    example: 'COMPANY',
  })
  @IsString()
  @Matches(/^[A-Z0-9]{6}$/, {
    message: '초대코드는 6자리 영대문자와 숫자 조합이어야 합니다',
  })
  inviteCode: string;

  @ApiProperty({
    description: '활성 상태',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateInviteCodeDto {
  @ApiProperty({
    description: '새 초대코드 (6자리 영대문자+숫자, 필수 입력)',
    example: 'NEWCODE',
  })
  @IsString()
  @Matches(/^[A-Z0-9]{6}$/, {
    message: '초대코드는 6자리 영대문자와 숫자 조합이어야 합니다',
  })
  inviteCode: string;
}

export class CompanyResponseDto {
  @ApiProperty({ description: '회사 ID' })
  id: string;

  @ApiProperty({ description: '회사명' })
  name: string;

  @ApiProperty({ description: '수강 시작일' })
  startDate: string;

  @ApiProperty({ description: '수강 종료일' })
  endDate: string;

  @ApiProperty({ description: '초대코드' })
  inviteCode: string;

  @ApiProperty({ description: '활성 상태' })
  isActive: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: string;

  @ApiProperty({ description: '수정일' })
  updatedAt: string;
}

export class InviteCodeResponseDto {
  @ApiProperty({ description: '회사 ID' })
  id: string;

  @ApiProperty({ description: '초대코드' })
  inviteCode: string;
}
