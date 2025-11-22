export const SERVICES = {
  AUTH_SERVICE: 'AUTH_SERVICE',
  VIDEO_SERVICE: 'VIDEO_SERVICE',
  INTERACTION_SERVICE: 'INTERACTION_SERVICE',
  NOTIFICATION_SERVICE: 'NOTIFICATION_SERVICE',
};

export const KAFKA_TOPICS = {
  VIDEO_CREATED: 'video.created',
  VIDEO_DELETED: 'video.deleted',
  VIDEO_LIKED: 'video.liked',
  VIDEO_UNLIKED: 'video.unliked',
  VIDEO_VIEWED: 'video.viewed',
  COMMENT_CREATED: 'comment.created',
  COMMENT_DELETED: 'comment.deleted',
};

export const REDIS_KEYS = {
  VIDEO_VIEWS: (videoId: string) => `video:${videoId}:views`,
  VIDEO_LIKES: (videoId: string) => `video:${videoId}:likes`,
  VIDEO_COMMENTS: (videoId: string) => `video:${videoId}:comments`,
  VIDEO_FEED: (userId: string, page: number) => `feed:${userId}:${page}`,
  USER_SESSION: (userId: string) => `session:${userId}`,
};

export const GRPC_PACKAGES = {
  AUTH: 'auth',
  VIDEO: 'video',
  INTERACTION: 'interaction',
  NOTIFICATION: 'notification',
};
