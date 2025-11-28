import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { debounce } from 'lodash';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Decimal from 'decimal.js';
import dayjs from 'dayjs';
import { HeartIcon, ShareIcon, ChatBubbleLeftIcon, PlayIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { cn, formatUtils } from '@/libs/utils';
import { useLikeVideo, useUnlikeVideo } from '@/libs/swr-hooks';
import { useAppDispatch } from '@/libs/store';
import { FadeIn, StaggeredList, StaggeredItem, AnimatedButton } from '@/libs/animations';
import type { Video } from '@/libs/store';

// Zod schema for video interaction
const videoInteractionSchema = z.object({
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment must be 500 characters or less'),
  shareType: z.enum(['link', 'whatsapp', 'twitter', 'facebook']).optional(),
});

type VideoInteractionData = z.infer<typeof videoInteractionSchema>;

interface VideoCardProps {
  video: Video;
  isActive?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isActive = false, onPlay, onPause }) => {
  const dispatch = useAppDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(video.liked || false);

  const { ref, inView } = useInView({ threshold: 0.5 });
  const { like } = useLikeVideo(video.id);
  const { unlike } = useUnlikeVideo(video.id);

  // Form for comments
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<VideoInteractionData>({
    resolver: zodResolver(videoInteractionSchema),
    mode: 'onChange',
  });

  // Auto-play when in view
  useEffect(() => {
    if (inView && isActive) {
      setIsPlaying(true);
      onPlay?.();
    } else {
      setIsPlaying(false);
      onPause?.();
    }
  }, [inView, isActive, onPlay, onPause]);

  // Debounced like function to prevent spam
  const debouncedLike = useCallback(
    debounce(async () => {
      try {
        if (isLiked) {
          await unlike();
          setIsLiked(false);
          toast.success('Unliked!');
        } else {
          await like();
          setIsLiked(true);
          toast.success('Liked!');
        }
      } catch (error) {
        toast.error('Something went wrong');
        // Revert optimistic update
        setIsLiked(!isLiked);
      }
    }, 300),
    [isLiked, like, unlike],
  );

  const handleLike = () => {
    // Optimistic update
    setIsLiked(!isLiked);
    debouncedLike();
  };

  const handleShare = useCallback(
    async (shareType: string = 'link') => {
      try {
        const shareUrl = `${window.location.origin}/video/${video.id}`;

        if (navigator.share && shareType === 'native') {
          await navigator.share({
            title: video.title,
            text: video.description || '',
            url: shareUrl,
          });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Link copied to clipboard!');
        }
      } catch (error) {
        toast.error('Failed to share video');
      }
    },
    [video],
  );

  const onCommentSubmit = (data: VideoInteractionData) => {
    // Here you would typically call an API to submit the comment
    console.log('Comment submitted:', data.comment);
    toast.success('Comment posted!');
    reset();
    setShowComments(false);
  };

  // Calculate engagement metrics using Decimal.js for precision
  const engagementRate = new Decimal(video.likeCount)
    .plus(video.commentCount)
    .plus(video.shareCount)
    .div(Math.max(video.viewCount, 1))
    .mul(100)
    .toFixed(2);

  return (
    <motion.div
      ref={ref}
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          className="w-full h-full object-cover"
          src={video.url}
          poster={video.thumbnailUrl}
          muted
          loop
          playsInline
          autoPlay={isPlaying}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Play/Pause Control */}
      <motion.button
        className="absolute inset-0 flex items-center justify-center"
        onClick={() => setIsPlaying(!isPlaying)}
        whileTap={{ scale: 0.95 }}
      >
        {!isPlaying && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="bg-black/50 rounded-full p-4"
          >
            <PlayIcon className="w-12 h-12 text-white ml-1" />
          </motion.div>
        )}
      </motion.button>

      {/* Video Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <FadeIn delay={0.2}>
          <div className="flex items-end justify-between">
            <div className="flex-1 mr-4">
              {/* User Info */}
              <div className="flex items-center mb-3">
                <img
                  src={video.user.avatarUrl || '/default-avatar.png'}
                  alt={video.user.displayName}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <div className="ml-3">
                  <p className="font-semibold text-lg">{video.user.displayName}</p>
                  <p className="text-sm text-gray-300">
                    {formatUtils.formatCount(video.user.followerCount)} followers
                  </p>
                </div>
                {video.user.verified && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Video Title and Description */}
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-gray-200 line-clamp-3 mb-3">{video.description}</p>
              )}

              {/* Tags */}
              {video.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {video.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-sm bg-white/20 rounded-full px-3 py-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>{formatUtils.formatCount(video.viewCount)} views</span>
                <span>•</span>
                <span>{dayjs(video.createdAt).fromNow()}</span>
                <span>•</span>
                <span>{engagementRate}% engagement</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-4">
              <AnimatedButton
                onClick={handleLike}
                className={cn('p-3 rounded-full', isLiked ? 'bg-red-500' : 'bg-white/20')}
              >
                {isLiked ? (
                  <HeartIconSolid className="w-6 h-6 text-white" />
                ) : (
                  <HeartIcon className="w-6 h-6 text-white" />
                )}
              </AnimatedButton>
              <span className="text-sm">{formatUtils.formatCount(video.likeCount)}</span>

              <AnimatedButton
                onClick={() => setShowComments(!showComments)}
                className="p-3 rounded-full bg-white/20"
              >
                <ChatBubbleLeftIcon className="w-6 h-6 text-white" />
              </AnimatedButton>
              <span className="text-sm">{formatUtils.formatCount(video.commentCount)}</span>

              <AnimatedButton
                onClick={() => handleShare()}
                className="p-3 rounded-full bg-white/20"
              >
                <ShareIcon className="w-6 h-6 text-white" />
              </AnimatedButton>
              <span className="text-sm">{formatUtils.formatCount(video.shareCount)}</span>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute top-0 right-0 w-96 h-full bg-black/90 backdrop-blur-lg border-l border-white/20"
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit(onCommentSubmit)} className="mb-4">
              <div className="flex gap-2">
                <input
                  {...register('comment')}
                  placeholder="Add a comment..."
                  className={cn(
                    'flex-1 bg-white/10 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm',
                    'border border-white/20 focus:border-white/40 outline-none',
                    errors.comment && 'border-red-500',
                  )}
                />
                <AnimatedButton
                  type="submit"
                  disabled={!isValid}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-semibold',
                    isValid
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed',
                  )}
                >
                  Post
                </AnimatedButton>
              </div>
              {errors.comment && (
                <p className="text-red-400 text-xs mt-1">{errors.comment.message}</p>
              )}
            </form>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto">
              <StaggeredList>
                {/* Mock comments for demonstration */}
                {Array.from({ length: 10 }, (_, i) => (
                  <StaggeredItem key={i}>
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="flex items-start gap-3">
                        <img
                          src="/default-avatar.png"
                          alt="Commenter"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-white font-semibold text-sm">User {i + 1}</p>
                          <p className="text-white/80 text-sm mt-1">
                            This is a sample comment for demonstration purposes.
                          </p>
                          <p className="text-white/50 text-xs mt-2">
                            {dayjs()
                              .subtract(i * 10, 'minutes')
                              .fromNow()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </StaggeredItem>
                ))}
              </StaggeredList>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoCard;
