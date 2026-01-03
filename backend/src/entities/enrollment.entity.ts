import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Course } from './course.entity';

@Entity('enrollment')
export class Enrollment {
  @PrimaryGeneratedColumn()
  enrollmentId: number;

  @Column()
  studentId: number;

  @Column()
  courseId: number;

  @Column('date')
  enrollmentDate: Date;

  @Column({ nullable: true })
  grade: string;

  @ManyToOne(() => Student, (student) => student.enrollments)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @ManyToOne(() => Course, (course) => course.enrollments)
  @JoinColumn({ name: 'courseId' })
  course: Course;
}

