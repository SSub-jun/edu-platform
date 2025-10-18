import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBankDto {
  @ApiProperty({ description: '문제은행 제목' })
  @IsString()
  @IsNotEmpty()
  title: string;
}





