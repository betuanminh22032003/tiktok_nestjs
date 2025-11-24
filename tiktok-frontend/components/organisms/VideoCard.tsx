'use client';

import { Music } from 'lucide-react';
import React from 'react';
import { TextCaption } from '../atoms/TextCaption';
import { VideoTag } from '../atoms/VideoTag';
import { ActionGroup } from '../molecules/ActionGroup';
import { UserBadge } from '../molecules/UserBadge';
import { VideoPlayer } from './VideoPlayer';

export interface Video {
  id: string;
  url: string;
  thumbnail?: string;
  caption: string;
  hashtags?: string[];
  music?: {
    name: string;
    artist: string;
  };
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface VideoCardProps {
  video: Video;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onUserClick?: (userId: string) => void;
  className?: string;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onLike,
  onComment,
  onShare,
  onSave,
  onUserClick,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-screen snap-start snap-always ${className}`}>
      {/* Video Player */}
      <VideoPlayer url={video.url} thumbnail={video.thumbnail} autoPlay={false} loop muted />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
        <div className="p-4 pb-20 md:pb-4">
          <div className="flex items-end justify-between gap-4">
            {/* Left Side - User Info & Caption */}
            <div className="flex-1 space-y-3 pointer-events-auto">
              {/* User Badge */}
              <UserBadge
                userId={video.user.id}
                username={video.user.username}
                displayName={video.user.displayName}
                avatarUrl={video.user.avatarUrl}
                verified={video.user.verified}
                size="md"
                onClick={() => onUserClick?.(video.user.id)}
                showSubtitle={false}
              />

              {/* Caption */}
              <TextCaption
                text={video.caption}
                maxLines={3}
                hashtags={video.hashtags}
                className="text-white drop-shadow-lg"
              />

              {/* Music Info */}
              {video.music && (
                <div className="flex items-center gap-2 text-white">
                  <Music className="w-4 h-4" />
                  <span className="text-sm truncate">
                    {video.music.name} - {video.music.artist}
                  </span>
                </div>
              )}

              {/* Tags */}
              {video.hashtags && video.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {video.hashtags.slice(0, 3).map((tag, index) => (
                    <VideoTag key={index} label={`#${tag}`} variant="default" size="sm" />
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Actions */}
            <div className="pointer-events-auto">
              <ActionGroup
                likes={video.stats.likes}
                comments={video.stats.comments}
                shares={video.stats.shares}
                isLiked={video.isLiked}
                isSaved={video.isSaved}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onSave={onSave}
                orientation="vertical"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
