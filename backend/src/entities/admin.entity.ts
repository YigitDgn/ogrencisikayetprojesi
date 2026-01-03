import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/entities/user.entity';

@Entity('admin')
export class Admin {
  @PrimaryGeneratedColumn()
  adminId: number;

  @Column()
  userId: number;

  @Column()
  adminLevel: string;

  @Column({ nullable: true })
  permissions: string;

  @OneToOne(() => User, (user) => user.admin)
  @JoinColumn({ name: 'userId' })
  user: User;
}

