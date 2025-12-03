'use client'

import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/libs/swr-hooks'
import { useEffect, useState } from 'react'
import { useUser } from '../context/user'
import { useGeneralStore } from '../stores/general'
import { BiLoaderCircle } from './icons'

interface FollowButtonProps {
  userId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function FollowButton({ userId, className = '', size = 'md' }: FollowButtonProps) {
  const userContext = useUser()
  const { setIsLoginOpen } = useGeneralStore()
  const [isFollowingLocal, setIsFollowingLocal] = useState(false)

  const { isFollowing: isFollowingFromApi, isLoading: loadingStatus } = useFollowStatus(
    userContext?.user && userContext.user.id !== userId ? userId : ''
  )
  const { follow, isLoading: isFollowing } = useFollowUser(userId)
  const { unfollow, isLoading: isUnfollowing } = useUnfollowUser(userId)

  const isLoading = isFollowing || isUnfollowing

  useEffect(() => {
    if (!loadingStatus && userContext?.user) {
      setIsFollowingLocal(isFollowingFromApi)
    }
  }, [isFollowingFromApi, loadingStatus, userContext?.user])

  // Don't show follow button for own profile
  if (userContext?.user?.id === userId) {
    return null
  }

  const handleToggleFollow = async () => {
    if (!userContext?.user) {
      setIsLoginOpen(true)
      return
    }

    if (isLoading) return

    // Optimistic UI update
    const previousFollowing = isFollowingLocal

    try {
      if (isFollowingLocal) {
        setIsFollowingLocal(false)
        await unfollow()
      } else {
        setIsFollowingLocal(true)
        await follow()
      }
    } catch (error) {
      // Revert on error
      console.error('Error toggling follow:', error)
      setIsFollowingLocal(previousFollowing)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        isFollowingLocal
          ? 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
          : 'bg-[#F12B56] text-white hover:bg-[#d91f47]'
      } ${sizeClasses[size]} ${className}`}
    >
      {isLoading ? (
        <BiLoaderCircle className="animate-spin" size={20} />
      ) : isFollowingLocal ? (
        'Following'
      ) : (
        'Follow'
      )}
    </button>
  )
}
