import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintController } from './complaint.controller';
import { ComplaintService } from './complaint.service';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintResponse } from '../entities/complaint-response.entity';
import { ComplaintType } from '../entities/complaint-type.entity';
import { Course } from '../entities/course.entity';
import { Student } from '../entities/student.entity';
import { Personnel } from '../entities/personnel.entity';
import { User } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, ComplaintResponse, ComplaintType, Course, Student, Personnel, User]),
    AuthModule, // JwtModule ve AuthGuard için
  ],
  controllers: [ComplaintController],
  providers: [ComplaintService],
})
export class ComplaintModule {}

