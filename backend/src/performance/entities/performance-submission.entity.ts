import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PeriodType, SubmissionStatus } from '../../common/constants/enums';
import { PerformanceEntry } from './performance-entry.entity';
import { BSCPerspectiveScore } from './bsc-perspective-score.entity';

@Entity('performance_submissions')
@Index(['executive_id', 'status'])
@Index(['executive_id', 'period_label'])
export class PerformanceSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  executive_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'executive_id' })
  executive: User;

  @Index()
  @Column({ type: 'uuid' })
  submitted_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitted_by' })
  submitter: User;

  @Column({
    type: 'enum',
    enum: PeriodType,
    default: PeriodType.MONTHLY,
  })
  period_type: PeriodType;

  @Column({ type: 'date', nullable: true })
  period_start?: Date;

  @Column({ type: 'date', nullable: true })
  period_end?: Date;

  @Index()
  @Column()
  period_label: string; // e.g. "Monthly — 2026-08"

  @Index()
  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.DRAFT,
  })
  status: SubmissionStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  overall_score?: number;

  @Column({ nullable: true })
  overall_rating?: string;

  @Column({ type: 'uuid', nullable: true })
  source_file_id?: string;

  @OneToMany(() => PerformanceEntry, (entry) => entry.submission)
  entries: PerformanceEntry[];

  @OneToMany(() => BSCPerspectiveScore, (bsc) => bsc.submission)
  perspective_scores: BSCPerspectiveScore[];

  @Index()
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
