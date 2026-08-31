import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255, nullable: true })
  userEmail: string | null;

  @Column({ name: 'user_role', type: 'varchar', length: 50, nullable: true })
  userRole: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  entity: string;

  @Index()
  @Column({ name: 'entity_id', type: 'varchar', length: 255, nullable: true })
  entityId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
