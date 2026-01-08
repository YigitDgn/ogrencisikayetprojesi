import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Department } from './department.entity';
import { Complaint } from './complaint.entity';

@Entity('personnel')
export class Personnel {
  @PrimaryGeneratedColumn()
  personnelId: number;

  @Column()
  userId: number;

  @Column()
  employeeNumber: string;

  @Column()
  position: string;

  @Column()
  departmentId: number;

  @Column('date')
  hireDate: Date;

  @OneToOne(() => User, (user) => user.personnel)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Department, (department) => department.personnel)
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @OneToMany(() => Complaint, (complaint) => complaint.handledByPersonnel)
  handledComplaints: Complaint[];

  @OneToMany(() => Complaint, (complaint) => complaint.completedByPersonnel)
  completedComplaints: Complaint[];
}

