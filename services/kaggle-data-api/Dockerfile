# Kaggle Data API Service Dockerfile

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable

# Copy dependency files
COPY package.json pnpm-lock.yaml nx.json tsconfig.base.json ./

# Install all dependencies (needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the service (with bundling enabled)
RUN pnpm nx build kaggle-data-api --configuration=production

# Runtime stage - use base image with fallback
# Build with: docker build -f services/kaggle-data-api/Dockerfile .
# Or with base: docker build --build-arg USE_BASE=true -f services/kaggle-data-api/Dockerfile .
ARG USE_BASE=false
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Add wget for healthcheck
RUN apk add --no-cache wget

# Copy built application (all dependencies bundled in main.js)
COPY --from=builder /app/dist/services/kaggle-data-api ./

# Create and switch to non-root user
RUN addgroup --system --gid 1001 nodejs 2>/dev/null || true && \
    adduser --system --uid 1001 fastify 2>/dev/null || true && \
    chown -R fastify:nodejs /app

USER fastify

EXPOSE 3000

# Health check for Kubernetes liveness/readiness probes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/live || exit 1

# Start the service
CMD ["node", "main.js"]
