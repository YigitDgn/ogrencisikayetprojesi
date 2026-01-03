import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Personnel } from './personnel.entity';
import { Course } from './course.entity';

@Entity('department')
export class Department {
  @PrimaryGeneratedColumn()
  departmentId: number;

  @Column()
  departmentName: string;

  @Column()
  departmentCode: string;

  @Column()
  facultyName: string;

  @OneToMany(() => Personnel, (personnel) => personnel.department)
  personnel: Personnel[];

  @OneToMany(() => Course, (course) => course.department)
  courses: Course[];
}

