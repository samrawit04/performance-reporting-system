import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('rating_thresholds')
export class RatingThreshold {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string; // e.g. "Excellent", "Good", "Satisfactory", "Needs Improvement"

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  min_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  max_score: number;

  @Column({ default: 0 })
  sort_order: number;

  @Column({ default: false })
  is_confirmed: boolean;
}
