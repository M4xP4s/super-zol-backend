# Multi-stage Docker build for kaggle-data-api service
# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Reset Nx cache and build the service
RUN pnpm nx reset && pnpm nx build kaggle-data-api --configuration=production

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Install production dependencies only
ENV NODE_ENV=production

# Enable corepack for pnpm
RUN corepack enable

# Copy built application and dependencies from builder
COPY --from=builder /app/dist/services/kaggle-data-api ./
COPY --from=builder /app/dist/libs ./libs
COPY --from=builder /app/node_modules ./node_modules

# Configure package.json to resolve @libs paths
RUN node -e "const pkg=require('./package.json'); pkg.imports={'@libs/*':'./libs/*/index.js'}; require('fs').writeFileSync('./package.json', JSON.stringify(pkg,null,2));"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify && \
    chown -R fastify:nodejs /app

USER fastify

# Expose service port
EXPOSE 3000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "main.js"]
