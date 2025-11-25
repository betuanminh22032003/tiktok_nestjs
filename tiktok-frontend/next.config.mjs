const config = {
  turbopack: {
    // Use the monorepo root so hoisted/centralized workspace packages
    // (installed at the repo root) are resolvable by Turbopack.
    root: '../',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'commondatastorage.googleapis.com',
      },
    ],
  },
  transpilePackages: ['image-js'],
  webpack: (config, { isServer }) => {
    // Fix for image-js and bresenham-zingl module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    return config;
  },
};

export default config;
