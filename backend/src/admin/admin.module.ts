import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../auth/entities/user.entity';
import { Complaint } from '../entities/complaint.entity';
import { Student } from '../entities/student.entity';
import { Admin } from '../entities/admin.entity';
import { Personnel } from '../entities/personnel.entity';
import { Department } from '../entities/department.entity';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../auth/guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Complaint, Student, Admin, Personnel, Department]),
    AuthModule, // JwtModule'ü AuthModule'den al (aynı secret key kullanılır)
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}

