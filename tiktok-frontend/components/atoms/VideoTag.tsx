'use client';

import { LucideIcon } from 'lucide-react';
import React from 'react';

export interface VideoTagProps {
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-gray-900/70 text-white',
  primary: 'bg-primary-500/90 text-white',
  success: 'bg-green-500/90 text-white',
  warning: 'bg-yellow-500/90 text-white',
  danger: 'bg-red-500/90 text-white',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export const VideoTag: React.FC<VideoTagProps> = ({
  label,
  icon: Icon,
  variant = 'default',
  size = 'sm',
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        backdrop-blur-sm transition-all duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}
        ${className}
      `}
    >
      {Icon && (
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      )}
      <span>{label}</span>
    </div>
  );
};

export default VideoTag;
