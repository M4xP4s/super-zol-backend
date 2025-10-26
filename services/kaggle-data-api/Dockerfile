# Multi-stage build for kaggle-data-api service
# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
# Reset Nx cache for Docker builds to avoid machine ID issues
RUN pnpm nx reset
RUN pnpm nx build kaggle-data-api --configuration=production --skip-nx-cache

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# Copy package.json and lock file for dependency installation
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/dist/services/kaggle-data-api ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify && \
    chown -R fastify:nodejs /app

USER fastify

EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the application
CMD ["node", "main.js"]
