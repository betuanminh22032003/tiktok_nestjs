'use client';

import { Avatar } from '@/components/atoms/Avatar';
import { NumberFormatter } from '@/components/atoms/NumberFormatter';
import { BottomNav } from '@/components/layout/BottomNav';
import { HeaderLayout } from '@/components/layout/HeaderLayout';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { FollowButton } from '@/components/molecules/FollowButton';
import type { Video } from '@/components/organisms/VideoCard';
import { BookmarkIcon, Grid, Heart, Settings } from 'lucide-react';
import { useParams } from 'next/navigation';
import React from 'react';

const mockUser = {
  id: '1',
  username: 'johndoe',
  displayName: 'John Doe',
  avatarUrl: 'https://i.pravatar.cc/300?img=1',
  verified: true,
  bio: 'Content creator | Travel enthusiast 🌍 | Follow for daily inspiration ✨',
  stats: {
    followers: 1250000,
    following: 523,
    likes: 8900000,
  },
  isFollowing: false,
};

const mockVideos: Video[] = [
  {
    id: '1',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://picsum.photos/300/400?random=1',
    caption: 'Amazing video!',
    hashtags: ['trending'],
    user: mockUser,
    stats: {
      likes: 15200,
      comments: 342,
      shares: 128,
    },
  },
];

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [activeTab, setActiveTab] = React.useState<'videos' | 'likes' | 'saved'>('videos');
  const [isFollowing, setIsFollowing] = React.useState(false);

  const currentUser = {
    id: '1',
    username: 'currentuser',
    avatarUrl: 'https://i.pravatar.cc/150?img=10',
  };

  const isOwnProfile = currentUser.id === userId;

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      <HeaderLayout user={currentUser} />

      <div className="flex">
        <SidebarLayout
          user={currentUser}
          suggestedUsers={[]}
          onLogout={() => console.log('Logout')}
        />

        <main className="flex-1 pb-20 md:pb-0">
          <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              <Avatar
                src={mockUser.avatarUrl}
                alt={mockUser.displayName}
                size="2xl"
                verified={mockUser.verified}
              />

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {mockUser.displayName}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">@{mockUser.username}</p>
                  </div>

                  {isOwnProfile ? (
                    <button className="btn-secondary flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <FollowButton
                      userId={mockUser.id}
                      isFollowing={isFollowing}
                      onFollow={() => setIsFollowing(true)}
                      onUnfollow={() => setIsFollowing(false)}
                      size="lg"
                    />
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center md:justify-start gap-8 mb-4">
                  <div className="text-center">
                    <NumberFormatter
                      value={mockUser.stats.following}
                      className="text-xl font-bold text-gray-900 dark:text-white block"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Following</span>
                  </div>
                  <div className="text-center">
                    <NumberFormatter
                      value={mockUser.stats.followers}
                      className="text-xl font-bold text-gray-900 dark:text-white block"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Followers</span>
                  </div>
                  <div className="text-center">
                    <NumberFormatter
                      value={mockUser.stats.likes}
                      className="text-xl font-bold text-gray-900 dark:text-white block"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Likes</span>
                  </div>
                </div>

                {/* Bio */}
                {mockUser.bio && (
                  <p className="text-gray-700 dark:text-gray-300 max-w-lg">{mockUser.bio}</p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-dark-800 mb-6">
              <div className="flex items-center justify-center md:justify-start gap-8">
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                    activeTab === 'videos'
                      ? 'border-primary-500 text-gray-900 dark:text-white font-semibold'
                      : 'border-transparent text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                  <span>Videos</span>
                </button>

                <button
                  onClick={() => setActiveTab('likes')}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                    activeTab === 'likes'
                      ? 'border-primary-500 text-gray-900 dark:text-white font-semibold'
                      : 'border-transparent text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Liked</span>
                </button>

                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                      activeTab === 'saved'
                        ? 'border-primary-500 text-gray-900 dark:text-white font-semibold'
                        : 'border-transparent text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <BookmarkIcon className="w-5 h-5" />
                    <span>Saved</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mockVideos.map((video) => (
                <div
                  key={video.id}
                  className="aspect-[9/16] relative rounded-lg overflow-hidden cursor-pointer group"
                >
                  <div className="relative w-full h-full">
                    <img
                      src={video.thumbnail || 'https://via.placeholder.com/400x600'}
                      alt={video.caption}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-3">
                    <div className="flex items-center gap-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" fill="white" />
                        <NumberFormatter value={video.stats.likes} className="text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {mockVideos.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4">
                  {activeTab === 'videos' && <Grid className="w-16 h-16 mx-auto text-gray-400" />}
                  {activeTab === 'likes' && <Heart className="w-16 h-16 mx-auto text-gray-400" />}
                  {activeTab === 'saved' && (
                    <BookmarkIcon className="w-16 h-16 mx-auto text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No {activeTab} yet</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav user={currentUser} />
    </div>
  );
}
