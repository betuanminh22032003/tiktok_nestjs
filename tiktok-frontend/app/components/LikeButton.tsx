'use client'

import { useLikeStatus, useLikeVideo, useUnlikeVideo } from '@/libs/swr-hooks'
import { useEffect, useState } from 'react'
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai'
import { useUser } from '../context/user'
import { useGeneralStore } from '../stores/general'
import { BiLoaderCircle } from './icons'

interface LikeButtonProps {
  videoId: string
  likesCount?: number
  size?: number
  showCount?: boolean
  className?: string
}

export default function LikeButton({
  videoId,
  likesCount: initialLikesCount = 0,
  size = 25,
  showCount = true,
  className = '',
}: LikeButtonProps) {
  const userContext = useUser()
  const { setIsLoginOpen } = useGeneralStore()
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLikedLocal, setIsLikedLocal] = useState(false)

  const { isLiked: isLikedFromApi, isLoading: loadingStatus } = useLikeStatus(
    userContext?.user ? videoId : ''
  )
  const { like, isLoading: isLiking } = useLikeVideo(videoId)
  const { unlike, isLoading: isUnliking } = useUnlikeVideo(videoId)

  const isLoading = isLiking || isUnliking

  useEffect(() => {
    if (!loadingStatus && userContext?.user) {
      setIsLikedLocal(isLikedFromApi)
    }
  }, [isLikedFromApi, loadingStatus, userContext?.user])

  useEffect(() => {
    setLikesCount(initialLikesCount)
  }, [initialLikesCount])

  const handleToggleLike = async () => {
    if (!userContext?.user) {
      setIsLoginOpen(true)
      return
    }

    if (isLoading) return

    // Optimistic UI update
    const previousLiked = isLikedLocal
    const previousCount = likesCount

    try {
      if (isLikedLocal) {
        setIsLikedLocal(false)
        setLikesCount(prev => Math.max(0, prev - 1))
        await unlike()
      } else {
        setIsLikedLocal(true)
        setLikesCount(prev => prev + 1)
        await like()
      }
    } catch (error) {
      // Revert on error
      console.error('Error toggling like:', error)
      setIsLikedLocal(previousLiked)
      setLikesCount(previousCount)
    }
  }

  return (
    <button
      onClick={handleToggleLike}
      disabled={isLoading}
      className={`flex items-center gap-2 transition ${className}`}
      aria-label={isLikedLocal ? 'Unlike' : 'Like'}
    >
      {isLoading ? (
        <BiLoaderCircle className="animate-spin" size={size} />
      ) : isLikedLocal ? (
        <AiFillHeart size={size} className="text-[#F12B56]" />
      ) : (
        <AiOutlineHeart size={size} />
      )}
      {showCount && <span className="text-sm font-semibold">{likesCount}</span>}
    </button>
  )
}
