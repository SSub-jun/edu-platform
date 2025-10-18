import { IsArray, IsString, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ description: '문제 ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: '선택한 보기 ID' })
  @IsString()
  choiceId: string;
}

export class SubmitAnswersDto {
  @ApiProperty({ 
    description: '답변 목록',
    type: [AnswerDto],
    minItems: 1,
    maxItems: 100
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  answers: AnswerDto[];
}





