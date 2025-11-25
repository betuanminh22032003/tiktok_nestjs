'use client';

import { Bell, Compass, Home, LogOut, LucideIcon, MessageCircle, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Avatar } from '../atoms/Avatar';
import { FollowButton } from '../molecules/FollowButton';

export interface SidebarLayoutProps {
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  suggestedUsers?: Array<{
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isFollowing?: boolean;
  }>;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onLogout?: () => void;
  className?: string;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  requireAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dành cho bạn', icon: Home, href: '/' },
  { label: 'Khám phá', icon: Compass, href: '/explore' },
  { label: 'Đang Follow', icon: Users, href: '/following', requireAuth: true },
  { label: 'Bạn bè', icon: Users, href: '/friends' },
  { label: 'Tin nhắn', icon: MessageCircle, href: '/messages', requireAuth: true },
  { label: 'Hoạt động', icon: Bell, href: '/activity', requireAuth: true },
  { label: 'Tải lên', icon: Plus, href: '/upload', requireAuth: true },
];

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  user,
  suggestedUsers = [],
  onFollow,
  onUnfollow,
  onLogout,
  className = '',
}) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside
      className={`
        hidden lg:flex flex-col w-60 xl:w-64
        h-screen sticky top-0
        bg-gradient-to-br from-gray-900 via-black to-purple-900
        text-white
        overflow-y-auto custom-scrollbar
        border-r border-white/10
        ${className}
      `}
    >
      <div className="flex flex-col h-full backdrop-blur-xl">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              TikTok
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full bg-white/5 backdrop-blur-md text-white placeholder-gray-400 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10 hover:bg-white/10 transition-all duration-300"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 px-2">
          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              // Hide auth-required items if user is not logged in
              if (item.requireAuth && !user) return null;

              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl
                  transition-all duration-300 group
                  ${
                    active
                      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md text-white font-bold shadow-lg border border-purple-500/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white hover:backdrop-blur-md'
                  }
                `}
                >
                  <Icon
                    className={`w-6 h-6 ${active ? 'stroke-[2.5] text-purple-400' : 'group-hover:text-purple-400'} transition-colors`}
                  />
                  <span className="text-base font-medium">{item.label}</span>
                  {active && (
                    <div className="ml-auto w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          {user && (
            <div className="border-t border-gradient-to-r from-purple-500/20 via-pink-500/20 to-transparent my-4" />
          )}

          {/* Suggested Users */}
          {user && suggestedUsers.length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="text-xs font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text px-4 uppercase tracking-wider">
                Các tài khoản Đã follow
              </h3>
              <div className="space-y-1">
                {suggestedUsers.slice(0, 5).map((suggestedUser) => (
                  <div
                    key={suggestedUser.id}
                    className="flex items-center justify-between gap-2 px-4 py-2 hover:bg-gray-900 rounded-lg"
                  >
                    <Link
                      href={`/user/${suggestedUser.id}`}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <Avatar
                        src={suggestedUser.avatarUrl}
                        alt={suggestedUser.displayName || suggestedUser.username}
                        size="sm"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white truncate">
                          {suggestedUser.displayName || suggestedUser.username}
                        </span>
                        <span className="text-xs text-gray-400 truncate">
                          @{suggestedUser.username}
                        </span>
                      </div>
                    </Link>
                    <FollowButton
                      userId={suggestedUser.id}
                      isFollowing={suggestedUser.isFollowing}
                      onFollow={() => onFollow?.(suggestedUser.id)}
                      onUnfollow={() => onUnfollow?.(suggestedUser.id)}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                ))}
              </div>
              <Link
                href="/explore/users"
                className="text-sm text-primary-500 hover:text-primary-600 font-semibold px-2"
              >
                See more
              </Link>
            </div>
          )}

          {/* Logout */}
          {user && (
            <>
              <div className="border-t border-gray-200 dark:border-dark-800" />
              <button
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-gray-900 transition-colors"
              >
                <LogOut className="w-6 h-6" />
                <span className="text-base font-medium">Đăng xuất</span>
              </button>
            </>
          )}

          {/* Profile Section */}
          {user && (
            <div className="mt-auto p-4 border-t border-gray-800">
              <Link
                href={`/user/${user.id}`}
                className="flex items-center gap-3 hover:bg-gray-900 rounded-lg p-2 transition-colors"
              >
                <Avatar src={user.avatarUrl} alt={user.username} size="md" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate">Hồ sơ</span>
                  <span className="text-xs text-gray-400 truncate">@{user.username}</span>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default SidebarLayout;
