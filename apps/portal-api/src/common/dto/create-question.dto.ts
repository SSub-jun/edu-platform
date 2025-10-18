import { IsString, IsArray, IsInt, Min, Max, IsNotEmpty, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChoiceDto {
  @ApiProperty({ description: '보기 텍스트' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class CreateQuestionDto {
  @ApiProperty({ description: '문제 내용' })
  @IsString()
  @IsNotEmpty()
  stem: string;

  @ApiProperty({ 
    description: '보기 목록',
    type: [CreateChoiceDto],
    minItems: 3,
    maxItems: 10
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChoiceDto)
  @ArrayMinSize(3)
  @ArrayMaxSize(10)
  choices: CreateChoiceDto[];

  @ApiProperty({ description: '정답 보기 인덱스 (0부터 시작)' })
  @IsInt()
  @Min(0)
  @Max(9)
  answerIndex: number;
}





