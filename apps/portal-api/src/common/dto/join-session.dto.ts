import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinSessionDto {
  @ApiProperty({ description: '참가자 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '4자리 PIN', pattern: '^\\d{4}$' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin4: string;
}





