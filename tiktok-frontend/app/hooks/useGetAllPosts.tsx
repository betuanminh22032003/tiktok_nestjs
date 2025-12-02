import { ApiResponse, Post, VideosResponse } from '@/app/types'
import { apiClient } from '@/libs/api-client'

const useGetAllPosts = async (): Promise<Post[]> => {
  try {
    const response = (await apiClient.getAllPosts()) as ApiResponse<VideosResponse>
    if (response?.data?.videos && Array.isArray(response.data.videos)) {
      // Map API response to our Post type, handling both old and new field names
      return response.data.videos.map(video => ({
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
    console.error('Error fetching posts:', error)
    return []
  }
}

export default useGetAllPosts
