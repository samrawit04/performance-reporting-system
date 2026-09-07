import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BscPerspective } from '../../common/constants/enums';
import { PerformanceSubmission } from './performance-submission.entity';

@Entity('bsc_perspective_scores')
@Index(['submission_id', 'perspective'])
export class BSCPerspectiveScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  submission_id: string;

  @ManyToOne(() => PerformanceSubmission, (sub) => sub.perspective_scores, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submission_id' })
  submission: PerformanceSubmission;

  @Column({
    type: 'enum',
    enum: BscPerspective,
  })
  perspective: BscPerspective;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  average_score: number;

  @Column()
  rating: string;
}
