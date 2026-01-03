import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { ComplaintType } from './complaint-type.entity';
import { Course } from './course.entity';
import { Personnel } from './personnel.entity';

@Entity('complaint')
export class Complaint {
  @PrimaryGeneratedColumn()
  complaintId: number;

  @Column()
  studentId: number;

  @Column()
  complaintTypeId: number;

  @Column({ nullable: true })
  courseId: number;

  @Column({ nullable: true })
  handledByPersonnelId: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isAnonymous: boolean;

  @ManyToOne(() => Student, (student) => student.complaints)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @ManyToOne(() => ComplaintType, (complaintType) => complaintType.complaints)
  @JoinColumn({ name: 'complaintTypeId' })
  complaintType: ComplaintType;

  @ManyToOne(() => Course, (course) => course.complaints)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => Personnel, (personnel) => personnel.handledComplaints)
  @JoinColumn({ name: 'handledByPersonnelId' })
  handledByPersonnel: Personnel;
}

