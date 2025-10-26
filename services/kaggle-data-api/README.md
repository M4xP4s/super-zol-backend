# Kaggle Data API Service

RESTful API service for accessing processed Kaggle competition data. Built with Fastify 5.x with comprehensive security, rate limiting, and OpenAPI documentation.

## Features

- 🚀 **Fastify 5.x** - High-performance web framework
- 🔒 **Security** - CORS, Helmet, Rate Limiting
- 📚 **OpenAPI/Swagger** - Interactive API documentation at `/docs`
- ❤️ **Health Checks** - Kubernetes-ready liveness/readiness probes
- 🐳 **Docker Ready** - Multi-stage build with bundling
- ☸️ **Kubernetes Ready** - Helm chart included
- 🧪 **Well Tested** - 23 tests, 94.67% coverage

## Quick Start

### Development

```bash
# Install dependencies (from repository root)
pnpm install

# Run in development mode
pnpm nx serve kaggle-data-api

# Run tests
pnpm nx test kaggle-data-api

# Run tests with coverage
pnpm nx test kaggle-data-api --coverage

# Build
pnpm nx build kaggle-data-api
```

### Production Build

```bash
# Build for production
pnpm nx build kaggle-data-api --configuration=production

# Run production build
node dist/services/kaggle-data-api/main.js
```

## API Endpoints

### Info Routes

- `GET /` - API information and status
- `GET /v1/info` - Detailed API metadata with uptime

### Health Check Routes

- `GET /health` - Basic health status
- `GET /health/live` - Liveness probe (for Kubernetes)
- `GET /health/ready` - Readiness probe with database/redis checks

### Documentation

- `GET /docs` - Swagger UI (interactive API documentation)
- `GET /docs/json` - OpenAPI specification (JSON)

## Configuration

### Environment Variables

| Variable       | Description                            | Default        | Required         |
| -------------- | -------------------------------------- | -------------- | ---------------- |
| `NODE_ENV`     | Environment (development/production)   | `development`  | No               |
| `PORT`         | Server port                            | `3000`         | No               |
| `HOST`         | Server host                            | `0.0.0.0`      | No               |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `*` (dev only) | Yes (production) |

### Security Configuration

**CORS:**

- Development: Allows all origins for easier testing
- Production: Requires explicit origin whitelist via `CORS_ORIGINS` env var
- Example: `CORS_ORIGINS=https://app.example.com,https://admin.example.com`

**Rate Limiting:**

- Production: 100 requests/minute per IP
- Development: 1000 requests/minute
- Includes `X-RateLimit-*` headers in responses

**Security Headers (via Helmet):**

- X-DNS-Prefetch-Control
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- X-XSS-Protection
- Strict-Transport-Security (HTTPS enforcement in production)

## Docker

### Build Image

```bash
# From repository root
docker build -f services/kaggle-data-api/Dockerfile -t kaggle-data-api:latest .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e CORS_ORIGINS=https://example.com \
  kaggle-data-api:latest
```

### Health Check

The Docker image includes a built-in health check:

```bash
wget --no-verbose --tries=1 --spider http://localhost:3000/health/live
```

## Kubernetes Deployment

### Using Helm

```bash
# Install
helm install kaggle-data-api ./services/kaggle-data-api/helm \
  -f ./services/kaggle-data-api/helm/values-production.yaml \
  -n super-zol

# Upgrade
helm upgrade kaggle-data-api ./services/kaggle-data-api/helm \
  -f ./services/kaggle-data-api/helm/values-production.yaml \
  -n super-zol

# Uninstall
helm uninstall kaggle-data-api -n super-zol
```

### Health Probes

The Helm chart configures Kubernetes health probes:

- **Liveness**: `GET /health/live` (checks if service is alive)
- **Readiness**: `GET /health/ready` (checks if service is ready to accept traffic)
- **Startup**: `GET /health/live` (allows up to 5 minutes for startup)

## Testing

### Run All Tests

```bash
pnpm nx test kaggle-data-api
```

### Watch Mode

```bash
pnpm nx test kaggle-data-api --watch
```

### Coverage Report

```bash
pnpm nx test kaggle-data-api --coverage
```

### Test Organization

Tests are organized by feature:

- `tests/routes/` - Route endpoint tests
- `tests/plugins/` - Plugin registration tests
- `tests/security/` - Security feature tests (CORS, headers, rate-limit)
- `tests/errors/` - Error handling tests
- `tests/swagger/` - API documentation tests

## Architecture

### Project Structure

```
services/kaggle-data-api/
├── src/
│   ├── main.ts                    # Application entry point
│   └── app/
│       ├── app.ts                 # Fastify app configuration
│       ├── plugins/               # Fastify plugins
│       │   ├── sensible.ts       # Sensible defaults
│       │   ├── cors.ts           # CORS configuration
│       │   ├── helmet.ts         # Security headers
│       │   ├── rate-limit.ts     # Rate limiting
│       │   └── swagger.ts        # API documentation
│       └── routes/               # API routes
│           ├── root.ts           # Info endpoints
│           └── health.ts         # Health check endpoints
├── tests/                        # Test files (organized by feature)
├── helm/                         # Kubernetes Helm chart
├── Dockerfile                    # Docker configuration
├── project.json                  # Nx project configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts             # Test configuration
└── README.md                     # This file
```

### Plugins (Auto-loaded)

Plugins are automatically loaded from `src/app/plugins/`:

- `sensible.ts` - Useful utilities and better error handling
- `cors.ts` - Cross-Origin Resource Sharing configuration
- `helmet.ts` - Security headers
- `rate-limit.ts` - API rate limiting
- `swagger.ts` - OpenAPI documentation

### Routes (Auto-loaded)

Routes are automatically loaded from `src/app/routes/`:

- `root.ts` - API information endpoints (`/`, `/v1/info`)
- `health.ts` - Health check endpoints (`/health/*`)

## Dependencies

### Core Framework

- `fastify` (^5.0.0) - Fast web framework
- `fastify-plugin` (^5.0.0) - Plugin utility

### Plugins

- `@fastify/autoload` (^6.0.0) - Auto-load plugins and routes
- `@fastify/cors` (^10.0.0) - CORS support
- `@fastify/helmet` (^12.0.0) - Security headers
- `@fastify/rate-limit` (^10.0.0) - Rate limiting
- `@fastify/sensible` (^6.0.0) - Utilities
- `@fastify/swagger` (^9.0.0) - OpenAPI generation
- `@fastify/swagger-ui` (^5.0.0) - API documentation UI

See [DEPENDENCY_VERSIONS.md](./DEPENDENCY_VERSIONS.md) for version rationale.

## Development

### Adding a New Route

Create a file in `src/app/routes/`:

```typescript
// src/app/routes/example.ts
import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/example',
    {
      schema: {
        tags: ['example'],
        description: 'Example endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return { message: 'Hello World' };
    }
  );
}
```

Routes are auto-loaded on startup.

### Adding a New Plugin

Create a file in `src/app/plugins/`:

```typescript
// src/app/plugins/example.ts
import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

async function examplePlugin(fastify: FastifyInstance) {
  // Plugin logic here
}

export default fastifyPlugin(examplePlugin);
```

Plugins are auto-loaded on startup.

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### Docker Build Issues

```bash
# Clean Docker build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -f services/kaggle-data-api/Dockerfile -t kaggle-data-api:latest .
```

### Tests Failing

```bash
# Reset Nx cache
pnpm nx reset

# Run tests with verbose output
pnpm nx test kaggle-data-api --verbose
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development workflow and guidelines.

## License

See repository root for license information.
