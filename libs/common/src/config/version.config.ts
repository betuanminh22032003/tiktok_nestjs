// Application Version Configuration
// Quản lý versions của application tại đây

export const APP_VERSION = {
  MAJOR: 1,
  MINOR: 0,
  PATCH: 0,

  // Pre-release: 'alpha', 'beta', 'rc', or null for stable
  PRERELEASE: null as string | null,

  // Build metadata
  BUILD: null as string | null,
} as const;

// Helper functions
export function getVersionString(): string {
  let version = `${APP_VERSION.MAJOR}.${APP_VERSION.MINOR}.${APP_VERSION.PATCH}`;

  if (APP_VERSION.PRERELEASE) {
    version += `-${APP_VERSION.PRERELEASE}`;
  }

  if (APP_VERSION.BUILD) {
    version += `+${APP_VERSION.BUILD}`;
  }

  return version;
}

export function getVersionInfo() {
  return {
    version: getVersionString(),
    major: APP_VERSION.MAJOR,
    minor: APP_VERSION.MINOR,
    patch: APP_VERSION.PATCH,
    prerelease: APP_VERSION.PRERELEASE,
    build: APP_VERSION.BUILD,
    fullName: `TikTok Clone v${getVersionString()}`,
  };
}

// Version history for reference
export const VERSION_HISTORY = [
  {
    version: '1.0.0',
    date: '2025-11-23',
    description: 'Initial release with microservices architecture',
    features: [
      'User authentication with JWT',
      'Video upload and management',
      'Like and comment system',
      'Real-time notifications',
      'gRPC inter-service communication',
    ],
  },
  // Add new versions here as you release
] as const;
