# =============================================================================
# Build stage
# =============================================================================
FROM node:20-alpine AS builder

# Install build dependencies for canvas and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

# Copy only frontend package files
COPY package*.json ./

# Install dependencies with cache mount (standalone frontend)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

# Copy frontend source code
COPY . .

# Build the application
RUN npm run build

# =============================================================================
# Production stage
# =============================================================================
FROM node:20-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nextjs -u 1001

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="localhost"

# Expose port
EXPOSE 3000

# Start the application using standalone server
CMD ["node", "server.js"]
