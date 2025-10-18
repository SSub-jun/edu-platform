import { IsArray, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UpdateQuestionDto {
  @IsString()
  @IsNotEmpty()
  stem!: string;

  @IsArray()
  choices!: { label: string }[];

  @IsInt()
  @Min(0)
  answerIndex!: number; // 0-based index
}



