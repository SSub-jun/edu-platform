import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class AssignCompanyDto {
  @ApiProperty({
    description: '회사 초대코드',
    example: 'COMPANY123',
  })
  @IsString()
  @Matches(/^[A-Z0-9]{6,12}$/, {
    message: '초대코드는 6-12자리 영대문자와 숫자 조합이어야 합니다',
  })
  inviteCode: string;
}

export class AssignCompanyResponseDto {
  @ApiProperty({ description: '성공 여부' })
  success: boolean;

  @ApiProperty({ description: '배정된 회사 정보' })
  company: {
    id: string;
    name: string;
  };
}








