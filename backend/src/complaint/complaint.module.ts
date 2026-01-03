import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplaintController } from './complaint.controller';
import { ComplaintService } from './complaint.service';
import { Complaint } from '../entities/complaint.entity';
import { ComplaintType } from '../entities/complaint-type.entity';
import { Course } from '../entities/course.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, ComplaintType, Course, Student]),
  ],
  controllers: [ComplaintController],
  providers: [ComplaintService],
})
export class ComplaintModule {}

