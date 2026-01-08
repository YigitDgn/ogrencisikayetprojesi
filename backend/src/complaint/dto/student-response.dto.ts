import { IsString, IsNotEmpty } from 'class-validator';

export class StudentResponseDto {
  @IsString()
  @IsNotEmpty()
  response: string;
}

