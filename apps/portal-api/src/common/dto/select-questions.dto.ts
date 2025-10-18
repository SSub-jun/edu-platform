import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectQuestionsDto {
  @ApiProperty({ 
    description: '선택된 문제 ID 목록',
    type: [String],
    minItems: 1,
    maxItems: 100
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  questionIds: string[];
}





