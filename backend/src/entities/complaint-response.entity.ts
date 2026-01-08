import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Complaint } from './complaint.entity';
import { Personnel } from './personnel.entity';
import { User } from '../auth/entities/user.entity';

@Entity('complaint_response')
export class ComplaintResponse {
  @PrimaryGeneratedColumn()
  responseId: number;

  @Column()
  complaintId: number;

  @Column({ nullable: true })
  respondedByPersonnelId: number | null;

  @Column({ nullable: true })
  respondedByUserId: number | null;

  @Column({ type: 'text', nullable: true })
  personnelResponse: string | null;

  @Column({ type: 'text', nullable: true })
  studentResponse: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Complaint, (complaint) => complaint.responses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'complaintId' })
  complaint: Complaint;

  @ManyToOne(() => Personnel, { nullable: true })
  @JoinColumn({ name: 'respondedByPersonnelId' })
  respondedByPersonnel: Personnel;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'respondedByUserId' })
  respondedByUser: User;
}

