'use client';

import {
  Bookmark,
  Compass,
  Home,
  LogOut,
  LucideIcon,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
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
  { label: 'For You', icon: Home, href: '/' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Following', icon: Users, href: '/following', requireAuth: true },
  { label: 'Trending', icon: TrendingUp, href: '/trending' },
  { label: 'Saved', icon: Bookmark, href: '/saved', requireAuth: true },
  { label: 'Settings', icon: Settings, href: '/settings', requireAuth: true },
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
        hidden lg:flex flex-col w-64 xl:w-72
        h-[calc(100vh-4rem)] sticky top-16
        bg-white dark:bg-dark-900
        border-r border-gray-200 dark:border-dark-800
        overflow-y-auto custom-scrollbar
        ${className}
      `}
    >
      <div className="flex flex-col gap-6 p-4">
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
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-200
                  ${
                    active
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        {user && <div className="border-t border-gray-200 dark:border-dark-800" />}

        {/* Suggested Users */}
        {user && suggestedUsers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2">
              Suggested Accounts
            </h3>
            <div className="space-y-3">
              {suggestedUsers.slice(0, 5).map((suggestedUser) => (
                <div
                  key={suggestedUser.id}
                  className="flex items-center justify-between gap-2 px-2"
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
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {suggestedUser.displayName || suggestedUser.username}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </>
        )}

        {/* Footer Links */}
        <div className="pt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap gap-2">
            <Link href="/about" className="hover:underline">
              About
            </Link>
            <span>·</span>
            <Link href="/help" className="hover:underline">
              Help
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
          </div>
          <p>© 2025 TikTok Clone</p>
        </div>
      </div>
    </aside>
  );
};

export default SidebarLayout;
