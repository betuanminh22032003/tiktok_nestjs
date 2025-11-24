'use client';

import { Send, X } from 'lucide-react';
import React from 'react';
import { Avatar } from '../atoms/Avatar';
import { IconButton } from '../atoms/IconButton';
import { NumberFormatter } from '../atoms/NumberFormatter';

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  text: string;
  likes: number;
  isLiked?: boolean;
  createdAt: Date;
  replies?: Comment[];
}

export interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment?: (text: string) => void;
  onLikeComment?: (commentId: string) => void;
  onReply?: (commentId: string, text: string) => void;
  loading?: boolean;
  className?: string;
}

const CommentItem: React.FC<{
  comment: Comment;
  onLike?: () => void;
  onReply?: (text: string) => void;
}> = ({ comment, onLike, onReply }) => {
  const [showReplyInput, setShowReplyInput] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply?.(replyText);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <Avatar
          src={comment.user.avatarUrl}
          alt={comment.user.displayName || comment.user.username}
          size="sm"
          verified={comment.user.verified}
        />

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {comment.user.displayName || comment.user.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          <p className="text-sm text-gray-800 dark:text-gray-200">{comment.text}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <button
              onClick={onLike}
              className={`font-semibold hover:text-primary-500 ${
                comment.isLiked ? 'text-primary-500' : ''
              }`}
            >
              <NumberFormatter value={comment.likes} /> {comment.likes === 1 ? 'like' : 'likes'}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="font-semibold hover:text-gray-700 dark:hover:text-gray-300"
            >
              Reply
            </button>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Add a reply..."
                className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && handleReply()}
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="text-primary-500 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-dark-700 pl-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} onLike={() => onLike?.()} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CommentDrawer: React.FC<CommentDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  onAddComment,
  onLikeComment,
  onReply,
  loading = false,
  className = '',
}) => {
  const [commentText, setCommentText] = React.useState('');

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment?.(commentText);
      setCommentText('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-dark-900
          rounded-t-3xl shadow-2xl
          max-h-[80vh]
          animate-slide-up
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-800">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Comments</h3>
            <NumberFormatter
              value={comments.length}
              className="text-sm text-gray-500 dark:text-gray-400"
            />
          </div>
          <IconButton icon={X} onClick={onClose} variant="ghost" />
        </div>

        {/* Comments List */}
        <div className="overflow-y-auto custom-scrollbar p-4 space-y-4 max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</p>
              </div>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={() => onLikeComment?.(comment.id)}
                onReply={(text) => onReply?.(comment.id, text)}
              />
            ))
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </p>
            </div>
          )}
        </div>

        {/* Add Comment Input */}
        <div className="p-4 border-t border-gray-200 dark:border-dark-800">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-dark-800 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="p-3 bg-primary-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentDrawer;
