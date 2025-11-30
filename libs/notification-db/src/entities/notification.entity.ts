import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  VIDEO_UPLOAD = 'video_upload',
  MENTION = 'mention',
  SYSTEM = 'system',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  DISMISSED = 'dismissed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // Reference to auth service user (recipient)

  @Column()
  @Index()
  actorId: string; // Reference to auth service user (who triggered the notification)

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ type: 'json', nullable: true })
  metadata: {
    videoId?: string;
    commentId?: string;
    likeId?: string;
    followId?: string;
    [key: string]: any;
  };

  @Column({ nullable: true })
  actionUrl: string; // Deep link to the relevant content

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
