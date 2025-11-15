# =============================================================================
# Build stage - Shared dependencies from monorepo
# =============================================================================
FROM node:20-bullseye-slim AS deps

WORKDIR /monorepo

# No build dependencies needed in deps stage; only in builder

# Copy root workspace package files
COPY package*.json ./

# Copy frontend package files
COPY tiktok-frontend/package*.json ./tiktok-frontend/

# Install dependencies from root (monorepo workspace)
RUN npm ci && npm cache clean --force

# =============================================================================
# Build stage
# =============================================================================
FROM node:20-bullseye AS builder

WORKDIR /monorepo

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy frontend source and package files
COPY tiktok-frontend ./tiktok-frontend
COPY tiktok-frontend/package*.json ./tiktok-frontend/
COPY package*.json ./

# Set working directory to frontend
WORKDIR /monorepo/tiktok-frontend

# Install frontend dependencies inside the builder so native modules
# are built for the container's environment (ensures lightningcss binary exists)
RUN npm ci --ignore-scripts=false --no-audit --no-fund
# Rebuild lightningcss native bindings for correct architecture
RUN npm rebuild lightningcss
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm run build

# =============================================================================
# Production stage
# =============================================================================
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# Create non-root user (Debian)
RUN groupadd -g 1001 nodejs && \
  useradd -m -u 1001 -g nodejs -s /bin/sh nextjs

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy necessary files from builder
COPY --from=builder /monorepo/tiktok-frontend/public ./public

# Copy the standalone output
COPY --from=builder /monorepo/tiktok-frontend/.next/standalone ./

# Copy static files
COPY --from=builder /monorepo/tiktok-frontend/.next/static ./.next/static

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js
CMD ["node", "server.js"]
