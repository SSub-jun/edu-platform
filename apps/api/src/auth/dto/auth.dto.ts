import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'admin123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SignupDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 'newuser',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: '액세스 토큰',
    example: 'dev-token',
  })
  accessToken: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: ['admin', 'instructor', 'student'],
    example: 'admin',
  })
  role: 'admin' | 'instructor' | 'student';
}

export class SignupResponseDto {
  @ApiProperty({
    description: '회원가입 성공 여부',
    example: true,
  })
  ok: boolean;
}

