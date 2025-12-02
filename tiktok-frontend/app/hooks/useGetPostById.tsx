import { ApiResponse, Post } from '@/app/types'
import { apiClient } from '@/libs/api-client'

const useGetPostById = async (id: string): Promise<Post | null> => {
  try {
    const response = (await apiClient.getPostById(id)) as { data: ApiResponse<{ video: Post }> }
    if (response?.data?.data?.video) {
      const video = response.data.data.video
      // Map API response to our Post type
      return {
        id: video.id,
        user_id: video.user_id,
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
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export default useGetPostById
