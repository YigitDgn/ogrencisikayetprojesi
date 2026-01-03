import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Department } from './department.entity';
import { Enrollment } from './enrollment.entity';
import { Complaint } from './complaint.entity';

@Entity('course')
export class Course {
  @PrimaryGeneratedColumn()
  courseId: number;

  @Column()
  departmentId: number;

  @Column()
  courseName: string;

  @Column()
  courseCode: string;

  @Column()
  credits: number;

  @Column()
  semester: string;

  @ManyToOne(() => Department, (department) => department.courses)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];

  @OneToMany(() => Complaint, (complaint) => complaint.course)
  complaints: Complaint[];
}

