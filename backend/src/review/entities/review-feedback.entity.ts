import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PerformanceSubmission } from '../../performance/entities/performance-submission.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewAction } from '../../common/constants/enums';

@Entity('review_feedbacks')
export class ReviewFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  submission_id: string;

  @OneToOne(() => PerformanceSubmission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission: PerformanceSubmission;

  @Column({ type: 'uuid' })
  reviewer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({
    type: 'enum',
    enum: ReviewAction,
    default: ReviewAction.APPROVED,
  })
  action: ReviewAction;

  @Column({ type: 'text' })
  overall_feedback: string;

  @Column({ type: 'jsonb', default: {} })
  perspective_feedback: {
    FINANCIAL?: string;
    CUSTOMER?: string;
    INTERNAL_PROCESS?: string;
    LEARNING_GROWTH?: string;
  };

  @Column({ type: 'jsonb', default: [] })
  recommended_focus_areas: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
