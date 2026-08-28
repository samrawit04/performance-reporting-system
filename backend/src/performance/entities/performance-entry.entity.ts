import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BscPerspective } from '../../common/constants/enums';
import { PerformanceSubmission } from './performance-submission.entity';
import { KpiDefinition } from '../../kpi/entities/kpi-definition.entity';

@Entity('performance_entries')
export class PerformanceEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  submission_id: string;

  @ManyToOne(() => PerformanceSubmission, (sub) => sub.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'submission_id' })
  submission: PerformanceSubmission;

  @Column({ type: 'uuid', nullable: true })
  kpi_definition_id?: string;

  @ManyToOne(() => KpiDefinition, { nullable: true })
  @JoinColumn({ name: 'kpi_definition_id' })
  kpi_definition?: KpiDefinition;

  @Column({
    type: 'enum',
    enum: BscPerspective,
  })
  perspective: BscPerspective;

  @Column()
  objective: string;

  @Column()
  measurement: string;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  plan_value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  actual_value: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Calculated fields
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  achievement_pct?: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  score?: number;

  @Column({ nullable: true })
  rating?: string;

  @CreateDateColumn()
  created_at: Date;
}
