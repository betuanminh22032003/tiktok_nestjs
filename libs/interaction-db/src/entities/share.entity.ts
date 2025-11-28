import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ShareType {
  DIRECT = 'direct',
  SOCIAL = 'social',
  COPY_LINK = 'copy_link',
  DOWNLOAD = 'download',
}

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // Reference to auth service user (who shared)

  @Column()
  @Index()
  videoId: string; // Reference to video service video

  @Column({
    type: 'enum',
    enum: ShareType,
  })
  shareType: ShareType;

  @Column({ nullable: true })
  platform: string; // e.g., 'facebook', 'twitter', 'whatsapp'

  @Column({ nullable: true })
  targetUserId: string; // For direct shares

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}