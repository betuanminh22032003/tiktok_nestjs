'use client';

import { UserCheck, UserPlus } from 'lucide-react';
import React from 'react';

export interface FollowButtonProps {
  userId: string;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing = false,
  onFollow,
  onUnfollow,
  size = 'md',
  variant = 'default',
  className = '',
  disabled = false,
  loading = false,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    try {
      if (isFollowing) {
        await onUnfollow?.();
      } else {
        await onFollow?.();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonContent = () => {
    if (loading || isProcessing) {
      return (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      );
    }

    if (isFollowing) {
      return (
        <>
          <UserCheck className="w-4 h-4" />
          <span>{isHovered ? 'Unfollow' : 'Following'}</span>
        </>
      );
    }

    return (
      <>
        <UserPlus className="w-4 h-4" />
        <span>Follow</span>
      </>
    );
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-lg
    transition-all duration-200 active:scale-95
    ${sizeClasses[size]}
  `;

  const variantClasses = () => {
    if (variant === 'outline') {
      return isFollowing
        ? 'border-2 border-gray-300 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-500'
        : 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20';
    }

    return isFollowing
      ? 'bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white'
      : 'bg-primary-500 text-white hover:bg-primary-600 shadow-button';
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || isProcessing}
      className={`
        ${baseClasses}
        ${variantClasses()}
        ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {getButtonContent()}
    </button>
  );
};

export default FollowButton;
