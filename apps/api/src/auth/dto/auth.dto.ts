import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '사용자명',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'admin123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: '액세스 토큰 (짧은 만료시간)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '리프레시 토큰 (긴 만료시간)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: ['admin', 'instructor', 'student'],
    example: 'admin',
  })
  role: 'admin' | 'instructor' | 'student';

  @ApiProperty({
    description: '사용자 정보',
    example: {
      id: 'user-123',
      username: 'admin',
      role: 'admin'
    }
  })
  user: {
    id: string;
    username: string;
    role: 'admin' | 'instructor' | 'student';
  };
}

export class RefreshResponseDto {
  @ApiProperty({
    description: '새로운 액세스 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '새로운 리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: '로그아웃 성공 메시지',
    example: 'Logged out successfully',
  })
  message: string;
}

