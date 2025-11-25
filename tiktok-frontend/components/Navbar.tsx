'use client';

import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Home, LogOut, PlusSquare, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              TikTok Clone
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
            >
              <Home className="w-5 h-5" />
              <span className="hidden md:inline font-medium">Home</span>
            </Link>

            <Link
              href="/search"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
            >
              <Search className="w-5 h-5" />
              <span className="hidden md:inline font-medium">Search</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <PlusSquare className="w-5 h-5" />
                  <span className="hidden md:inline font-medium">Upload</span>
                </Link>

                <Link
                  href={`/profile/${user?.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline font-medium">{user?.username}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
