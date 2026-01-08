import { IsString, IsNotEmpty } from 'class-validator';

export class RespondComplaintDto {
  @IsString()
  @IsNotEmpty()
  response: string;
}

