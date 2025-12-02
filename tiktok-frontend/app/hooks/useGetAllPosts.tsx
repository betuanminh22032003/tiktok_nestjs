import { PostWithProfile } from '@/app/types'
import { apiClient } from '@/libs/api-client'

const useGetAllPosts = async (): Promise<PostWithProfile[]> => {
  try {
    const response = (await apiClient.getAllPosts()) as any
    if (response?.videos && Array.isArray(response.videos)) {
      // Map API response to PostWithProfile type
      return response.videos.map((video: any) => ({
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
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

export default useGetAllPosts
