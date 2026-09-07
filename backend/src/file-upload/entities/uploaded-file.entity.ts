import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FileProcessingStatus } from '../../common/constants/enums';

@Entity('uploaded_files')
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  uploaded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column()
  original_filename: string;

  @Column()
  stored_path: string;

  @Column()
  mime_type: string;

  @Column({ type: 'int' })
  file_size: number;

  @Index()
  @Column({
    type: 'enum',
    enum: FileProcessingStatus,
    default: FileProcessingStatus.PENDING,
  })
  processing_status: FileProcessingStatus;

  @Column({ type: 'text', nullable: true })
  processing_error?: string;

  @CreateDateColumn()
  uploaded_at: Date;
}
