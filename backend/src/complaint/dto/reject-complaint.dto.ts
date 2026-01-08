import { IsString, IsNotEmpty } from 'class-validator';

export class RejectComplaintDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

