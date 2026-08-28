import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PerformanceSubmission } from '../../performance/entities/performance-submission.entity';

@Entity('ai_analyses')
export class AiAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  submission_id: string;

  @OneToOne(() => PerformanceSubmission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission: PerformanceSubmission;

  @Column({ type: 'text' })
  executive_summary: string;

  @Column({ type: 'jsonb', default: [] })
  strengths: string[];

  @Column({ type: 'jsonb', default: [] })
  improvement_areas: string[];

  @Column({ type: 'jsonb', default: {} })
  perspective_analysis: {
    FINANCIAL?: string;
    CUSTOMER?: string;
    INTERNAL_PROCESS?: string;
    LEARNING_GROWTH?: string;
  };

  @Column({ type: 'jsonb', default: [] })
  recommendations: string[];

  @Column({ default: 'gemini-2.5-flash' })
  model_used: string;

  @Column({ type: 'int', nullable: true })
  prompt_tokens?: number;

  @Column({ type: 'int', nullable: true })
  completion_tokens?: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
