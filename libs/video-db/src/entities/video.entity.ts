import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VideoStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  PRIVATE = 'private',
  DELETED = 'deleted',
}

export enum VideoQuality {
  SD = 'sd', // 480p
  HD = 'hd', // 720p
  FHD = 'fhd', // 1080p
  UHD = 'uhd', // 4K
}

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // Reference to auth service user

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  videoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  duration: number; // Duration in seconds

  @Column({ type: 'bigint', default: 0 })
  fileSize: number; // File size in bytes

  @Column({
    type: 'enum',
    enum: VideoQuality,
    default: VideoQuality.HD,
  })
  quality: VideoQuality;

  @Column({
    type: 'enum',
    enum: VideoStatus,
    default: VideoStatus.UPLOADING,
  })
  status: VideoStatus;

  @Column({ type: 'json', nullable: true })
  metadata: {
    width?: number;
    height?: number;
    fps?: number;
    codec?: string;
    bitrate?: number;
  };

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: true })
  @Index()
  isPublic: boolean;

  @Column({ default: false })
  allowComments: boolean;

  @Column({ default: false })
  allowDuet: boolean;

  @Column({ default: false })
  allowStitch: boolean;

  @Column({ type: 'bigint', default: 0 })
  @Index()
  views: number;

  @Column({ type: 'int', default: 0 })
  likesCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'int', default: 0 })
  sharesCount: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
