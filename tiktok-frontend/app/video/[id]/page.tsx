'use client';

import { Avatar } from '@/components/atoms/Avatar';
import { IconButton } from '@/components/atoms/IconButton';
import { TextCaption } from '@/components/atoms/TextCaption';
import { HeaderLayout } from '@/components/layout/HeaderLayout';
import { ActionGroup } from '@/components/molecules/ActionGroup';
import { UserBadge } from '@/components/molecules/UserBadge';
import type { Comment } from '@/components/organisms/CommentDrawer';
import { CommentDrawer } from '@/components/organisms/CommentDrawer';
import type { Video } from '@/components/organisms/VideoCard';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

const mockVideo: Video = {
  id: '1',
  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  thumbnail: 'https://picsum.photos/400/600?random=1',
  caption: 'Amazing video! Check this out 🔥 #trending #viral #fyp',
  hashtags: ['trending', 'viral', 'fyp'],
  music: {
    name: 'Original Sound',
    artist: 'User123',
  },
  user: {
    id: '1',
    username: 'user123',
    displayName: 'John Doe',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    verified: true,
  },
  stats: {
    likes: 15200,
    comments: 342,
    shares: 128,
  },
  isLiked: false,
  isSaved: false,
};

const mockComments: Comment[] = [
  {
    id: '1',
    user: {
      id: '3',
      username: 'commenter1',
      displayName: 'Alex Johnson',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      verified: false,
    },
    text: 'This is amazing! 🔥',
    likes: 45,
    isLiked: false,
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    user: {
      id: '4',
      username: 'commenter2',
      displayName: 'Sarah Williams',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      verified: true,
    },
    text: 'Love this content! Keep it up 💯',
    likes: 23,
    isLiked: true,
    createdAt: new Date(Date.now() - 7200000),
  },
];

export default function VideoDetailPage() {
  const router = useRouter();

  const [video, setVideo] = React.useState<Video>(mockVideo);
  const [commentDrawerOpen, setCommentDrawerOpen] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>(mockComments);

  const currentUser = {
    id: '1',
    username: 'currentuser',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
  };

  const handleLike = () => {
    setVideo((prev) => ({
      ...prev,
      isLiked: !prev.isLiked,
      stats: {
        ...prev.stats,
        likes: prev.isLiked ? prev.stats.likes - 1 : prev.stats.likes + 1,
      },
    }));
  };

  const handleSave = () => {
    setVideo((prev) => ({
      ...prev,
      isSaved: !prev.isSaved,
    }));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.caption,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <HeaderLayout user={currentUser} />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 p-4">
          {/* Video Player Section */}
          <div className="relative">
            {/* Back Button */}
            <div className="absolute top-4 left-4 z-10">
              <IconButton
                icon={ArrowLeft}
                onClick={() => router.back()}
                variant="ghost"
                size="lg"
                className="bg-black/50 text-white hover:bg-black/70"
              />
            </div>

            {/* Video Player */}
            <div className="aspect-[9/16] max-h-[calc(100vh-120px)] mx-auto bg-black rounded-lg overflow-hidden">
              <VideoPlayer url={video.url} thumbnail={video.thumbnail} autoPlay loop controls />
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="card p-6">
              <UserBadge
                userId={video.user.id}
                username={video.user.username}
                displayName={video.user.displayName}
                avatarUrl={video.user.avatarUrl}
                verified={video.user.verified}
                size="lg"
                onClick={() => router.push(`/user/${video.user.id}`)}
              />
            </div>

            {/* Caption */}
            <div className="card p-6">
              <TextCaption text={video.caption} hashtags={video.hashtags} expandable={false} />
            </div>

            {/* Actions */}
            <div className="card p-6">
              <ActionGroup
                likes={video.stats.likes}
                comments={video.stats.comments}
                shares={video.stats.shares}
                isLiked={video.isLiked}
                isSaved={video.isSaved}
                onLike={handleLike}
                onComment={() => setCommentDrawerOpen(true)}
                onShare={handleShare}
                onSave={handleSave}
                orientation="horizontal"
              />
            </div>

            {/* Music Info */}
            {video.music && (
              <div className="card p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">🎵</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {video.music.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{video.music.artist}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Preview */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Comments ({video.stats.comments})
                </h3>
                <button
                  onClick={() => setCommentDrawerOpen(true)}
                  className="text-primary-500 hover:text-primary-600 font-semibold text-sm"
                >
                  View all
                </button>
              </div>

              {comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="flex gap-3 mb-4 last:mb-0">
                  <Avatar
                    src={comment.user.avatarUrl}
                    alt={comment.user.displayName || comment.user.username}
                    size="sm"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">
                      {comment.user.displayName || comment.user.username}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Share Button (Mobile) */}
            <button
              onClick={handleShare}
              className="lg:hidden w-full btn-outline flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Video
            </button>
          </div>
        </div>
      </div>

      <CommentDrawer
        isOpen={commentDrawerOpen}
        onClose={() => setCommentDrawerOpen(false)}
        comments={comments}
        onAddComment={(text) => {
          const newComment: Comment = {
            id: Date.now().toString(),
            user: currentUser,
            text,
            likes: 0,
            isLiked: false,
            createdAt: new Date(),
          };
          setComments([newComment, ...comments]);
        }}
        onLikeComment={(commentId) => {
          setComments((prev) =>
            prev.map((c) =>
              c.id === commentId
                ? {
                    ...c,
                    isLiked: !c.isLiked,
                    likes: c.isLiked ? c.likes - 1 : c.likes + 1,
                  }
                : c,
            ),
          );
        }}
        onReply={(commentId, text) => console.log('Reply:', commentId, text)}
      />
    </div>
  );
}
