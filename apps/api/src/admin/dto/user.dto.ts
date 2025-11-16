import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, Matches, MinLength } from 'class-validator';

export enum AdminUserRole {
  admin = 'admin',
  instructor = 'instructor',
}

export class CreateAdminUserDto {
  @ApiProperty({
    description: '사용자 ID (영문, 숫자, 언더스코어만 허용)',
    example: 'admin001',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/, {
    message: '사용자 ID는 3-20자의 영문, 숫자, 언더스코어만 허용됩니다',
  })
  username: string;

  @ApiProperty({
    description: '비밀번호 (최소 8자, 대문자/소문자/숫자/특수문자 각 1+ 포함)',
    example: 'AdminPassword123!',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message: '비밀번호는 최소 8자이며, 대문자/소문자/숫자/특수문자를 각각 1개 이상 포함해야 합니다',
  })
  password: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: AdminUserRole,
    example: AdminUserRole.instructor,
  })
  @IsEnum(AdminUserRole)
  role: AdminUserRole;

  @ApiProperty({
    description: '이메일 주소 (선택사항)',
    example: 'admin@company.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: '휴대폰 번호 (선택사항)',
    example: '01012345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]{8,9}$/, {
    message: '올바른 휴대폰 번호 형식이 아닙니다 (01012345678)',
  })
  phone?: string;

  @ApiProperty({
    description: '소속 회사 ID (선택사항)',
    example: 'clx0z0z0z0000000000000001',
    required: false,
  })
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class AdminUserResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '사용자명 (로그인 ID)' })
  username: string;

  @ApiProperty({ description: '사용자 역할' })
  role: string;

  @ApiProperty({ description: '이메일', nullable: true })
  email: string | null;

  @ApiProperty({ description: '휴대폰 번호', nullable: true })
  phone: string | null;

  @ApiProperty({ description: '소속 회사 ID', nullable: true })
  companyId: string | null;

  @ApiProperty({ description: '생성일' })
  createdAt: string;

  @ApiProperty({ description: '마지막 로그인', nullable: true })
  lastLoginAt: string | null;
}











