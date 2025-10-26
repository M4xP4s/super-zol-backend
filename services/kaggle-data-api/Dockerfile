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
RUN pnpm nx build kaggle-data-api --configuration=production

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/dist/services/kaggle-data-api ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify && \
    chown -R fastify:nodejs /app

USER fastify

EXPOSE 3000

# Start the application
CMD ["node", "main.js"]
