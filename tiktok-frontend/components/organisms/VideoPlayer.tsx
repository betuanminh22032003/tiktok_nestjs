'use client';

import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import dynamic from 'next/dynamic';
import React from 'react';
import { IconButton } from '../atoms/IconButton';

// Suppress TypeScript errors for react-player
/* eslint-disable @typescript-eslint/no-explicit-any */

// Dynamic import with proper typing
const ReactPlayer = dynamic(() => import('react-player'), {
  ssr: false,
}) as React.ComponentType<any>;

export interface VideoPlayerProps {
  url: string;
  thumbnail?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (progress: { played: number; playedSeconds: number }) => void;
  className?: string;
  controls?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  autoPlay = false,
  loop = true,
  muted: initialMuted = false,
  onPlay,
  onPause,
  onEnded,
  onProgress,
  className = '',
  controls = true,
}) => {
  const playerRef = React.useRef<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(autoPlay);
  const [muted, setMuted] = React.useState(initialMuted);
  const [progress, setProgress] = React.useState(0);
  const [showControls, setShowControls] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handlePlayPause = () => {
    const newPlayingState = !playing;
    setPlaying(newPlayingState);
    if (newPlayingState) {
      onPlay?.();
    } else {
      onPause?.();
    }
  };

  const handleMuteToggle = () => {
    setMuted(!muted);
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.played);
    onProgress?.(state);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Player */}
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        loop={loop}
        muted={muted}
        width="100%"
        height="100%"
        playsinline
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onProgress={handleProgress}
      />

      {/* Overlay for Play/Pause */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handlePlayPause}
      >
        {!playing && (
          <div className="bg-black/50 backdrop-blur-sm rounded-full p-4 animate-fade-in">
            <Play className="w-16 h-16 text-white" fill="white" />
          </div>
        )}
      </div>

      {/* Controls */}
      {controls && (
        <div
          className={`
            absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent
            transition-opacity duration-300
            ${showControls || !playing ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconButton
                icon={playing ? Pause : Play}
                onClick={handlePlayPause}
                variant="ghost"
                className="text-white hover:bg-white/20"
              />
              <IconButton
                icon={muted ? VolumeX : Volume2}
                onClick={handleMuteToggle}
                variant="ghost"
                className="text-white hover:bg-white/20"
              />
            </div>

            <IconButton
              icon={Maximize}
              onClick={handleFullscreen}
              variant="ghost"
              className="text-white hover:bg-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
