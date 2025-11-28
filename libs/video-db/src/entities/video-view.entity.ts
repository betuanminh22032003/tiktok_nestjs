import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

export enum ViewSource {
  FEED = 'feed',
  PROFILE = 'profile',
  SEARCH = 'search',
  SHARE = 'share',
  DIRECT = 'direct',
}

@Entity('video_views')
export class VideoView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  videoId: string;

  @Column({ nullable: true })
  @Index()
  userId: string; // Reference to auth service user (null for anonymous views)

  @Column({ nullable: true })
  sessionId: string; // For anonymous tracking

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({
    type: 'enum',
    enum: ViewSource,
    default: ViewSource.FEED,
  })
  source: ViewSource;

  @Column({ type: 'int', default: 0 })
  watchDuration: number; // Seconds watched

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number; // Percentage of video watched

  @Column({ default: false })
  isUnique: boolean; // True if this is user's first view of the video

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Video, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'videoId' })
  video: Video;
}
