import { ApiResponse, Post, VideosResponse } from '@/app/types'
import { apiClient } from '@/libs/api-client'

const useGetPostsByUserId = async (userId: string): Promise<Post[]> => {
  try {
    const response = (await apiClient.getPostsByUserId(userId)) as {
      data: ApiResponse<VideosResponse>
    }
    if (response?.data?.data?.videos && Array.isArray(response.data.data.videos)) {
      // Map API response to our Post type
      return response.data.data.videos.map(video => ({
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
      }))
    }
    return []
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return []
  }
}

export default useGetPostsByUserId
