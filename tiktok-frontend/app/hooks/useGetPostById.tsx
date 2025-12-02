import { PostWithProfile } from '@/app/types'
import { apiClient } from '@/libs/api-client'

const useGetPostById = async (id: string): Promise<PostWithProfile | null> => {
  try {
    const response = (await apiClient.getPostById(id)) as any
    if (response?.data?.video) {
      const video = response.data.video
      // Map API response to PostWithProfile type
      return {
        id: video.id,
        user_id: video.user?.id || video.userId,
        video_url: video.videoUrl || video.video_url || '',
        text: video.description || video.text || '',
        created_at: video.createdAt || video.created_at || '',
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        views: video.views,
        createdAt: video.createdAt,
        // Map user object to profile
        profile: video.user
          ? {
              user_id: video.user.id,
              name: video.user.fullName || video.user.username || 'Unknown',
              image: video.user.avatar || '',
            }
          : undefined,
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export default useGetPostById
