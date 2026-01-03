import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Enrollment } from './enrollment.entity';
import { Complaint } from './complaint.entity';

@Entity('student')
export class Student {
  @PrimaryGeneratedColumn()
  studentId: number;

  @Column()
  userId: number;

  @Column()
  studentNumber: string;

  @Column()
  enrollmentYear: number;

  @Column()
  currentYear: number;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  GPA: number;

  @OneToOne(() => User, (user) => user.student)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => Complaint, (complaint) => complaint.student)
  complaints: Complaint[];
}

