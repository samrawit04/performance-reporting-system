import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BscPerspective, KpiDirection } from '../../common/constants/enums';

@Entity('kpi_definitions')
export class KpiDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
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

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: KpiDirection,
    default: KpiDirection.HIGHER_IS_BETTER,
  })
  direction: KpiDirection;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Index()
  @Column({ default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
