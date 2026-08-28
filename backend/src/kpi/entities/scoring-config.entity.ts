import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('scoring_configs')
export class ScoringConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  config_key: string;

  @Column({ type: 'jsonb' })
  config_value: any;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  is_confirmed: boolean;

  @UpdateDateColumn()
  updated_at: Date;
}
