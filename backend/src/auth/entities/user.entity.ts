import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToOne } from 'typeorm';
import { Student } from '../../entities/student.entity';
import { Admin } from '../../entities/admin.entity';
import { Personnel } from '../../entities/personnel.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ nullable: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  roleType: string;

  @Column({ nullable: true })
  photo: string;
  

  @OneToOne(() => Student, (student) => student.user)
  student: Student;

  @OneToOne(() => Admin, (admin) => admin.user)
  admin: Admin;

  @OneToOne(() => Personnel, (personnel) => personnel.user)
  personnel: Personnel;
}




