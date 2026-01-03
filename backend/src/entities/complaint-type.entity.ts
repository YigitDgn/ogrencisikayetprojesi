import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Complaint } from './complaint.entity';

@Entity('complaint_type')
export class ComplaintType {
  @PrimaryGeneratedColumn()
  complaintTypeId: number;

  @Column()
  typeName: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: false })
  requiresCourse: boolean;

  @OneToMany(() => Complaint, (complaint) => complaint.complaintType)
  complaints: Complaint[];
}

