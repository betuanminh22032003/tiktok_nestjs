import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum FollowStatus {
  FOLLOWING = 'following',
  REQUESTED = 'requested', // For private accounts
  BLOCKED = 'blocked',
}

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  followerId: string; // Reference to auth service user (who follows)

  @Column()
  @Index()
  followingId: string; // Reference to auth service user (being followed)

  @Column({
    type: 'enum',
    enum: FollowStatus,
    default: FollowStatus.FOLLOWING,
  })
  status: FollowStatus;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
