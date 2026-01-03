import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../auth/entities/user.entity';
import { Complaint } from '../entities/complaint.entity';
import { Student } from '../entities/student.entity';
import { Admin } from '../entities/admin.entity';
import { Personnel } from '../entities/personnel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Complaint, Student, Admin, Personnel])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

