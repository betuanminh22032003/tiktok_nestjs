# ───────────────────────────────────────────────
#   BASE: Cài đặt OS + NodeJS chung
# ───────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Bật npm ci dùng cho CI/CD
ENV CI=true

# ───────────────────────────────────────────────
#   DEPS: Cài dependencies (cache tốt nhất)
# ───────────────────────────────────────────────
FROM base AS deps

# Cài thêm dependencies build (nếu dùng canvas)
RUN apk add --no-cache python3 make g++ pixman-dev cairo-dev pango-dev

COPY package.json package-lock.json* ./

# Nếu có package-lock.json → npm ci
# Nếu không có → npm install
RUN if [ -f package-lock.json ]; then \
        npm ci --ignore-scripts; \
    else \
        npm install --ignore-scripts; \
    fi

# ───────────────────────────────────────────────
#   BUILDER: Build Next.js
# ───────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ───────────────────────────────────────────────
#   RUNTIME: Nhẹ nhất (chỉ 50MB)
# ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Tạo user non-root
RUN addgroup --system nextjs && adduser --system nextjs --ingroup nextjs

# Copy output cho runtime
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/package.json ./package.json

# Cài dependencies cần cho runtime (không cần dev deps)
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
