# Kaggle Data API Service

A production-ready FastAPI service for querying Kaggle datasets from a PostgreSQL database. Part of the Super Zol backend monorepo (Phase 2).

## Overview

This service provides a REST API for accessing Kaggle dataset metadata stored in PostgreSQL. It features:

- **FastAPI with Fastify** - High-performance async HTTP server
- **PostgreSQL Integration** - Connection pooling and safe query execution
- **Docker Support** - Multi-stage builds with health checks
- **Security First** - Parameterized queries, input validation, secure error handling
- **Comprehensive Testing** - Unit and integration tests with 100% pass rate
- **Production Ready** - Non-root containers, Alpine base, minimal attack surface

## Quick Start

### Prerequisites

- Node.js ≥22
- pnpm ≥10
- Docker & Docker Compose (optional, for containerized deployment)
- PostgreSQL 16+ (local or Docker)

### Local Development

```bash
# 1. Install dependencies (from root of monorepo)
pnpm install

# 2. Start PostgreSQL (in Docker)
docker run -d \
  --name postgres-local \
  -e POSTGRES_DB=kaggle \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine

# 3. Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kaggle"

# 4. Start the service
pnpm nx serve kaggle-data-api

# 5. Test the endpoint
curl http://localhost:3000/health
curl http://localhost:3000/datasets
```

### Running with Docker Compose

```bash
# Start PostgreSQL + service
docker-compose -f docker-compose.integration.yml up -d

# Service will be available at http://localhost:3000

# Stop services
docker-compose -f docker-compose.integration.yml down
```

### Running Tests

```bash
# Unit tests
pnpm nx test kaggle-data-api

# Integration tests
pnpm test-integration

# Tests with watch mode
pnpm exec vitest services/kaggle-data-api/tests --watch
```

## API Endpoints

### Health Check

**GET /health**

Check if the service is alive and ready.

**Response (200):**

```json
{
  "status": "ok"
}
```

### Get Datasets

**GET /datasets**

Fetch datasets from the database with optional pagination and filtering.

**Query Parameters:**

- `limit` (optional) - Number of results (1-1000, default: 100)
- `offset` (optional) - Number of results to skip (default: 0)
- `order` (optional) - Order by column: 'name', 'id', 'created_at' (default: 'name')

**Example Requests:**

```bash
# Get first 10 datasets
curl "http://localhost:3000/datasets?limit=10"

# Get datasets 20-30
curl "http://localhost:3000/datasets?limit=10&offset=20"

# Get datasets ordered by creation date
curl "http://localhost:3000/datasets?order=created_at"
```

**Response (200):**

```json
{
  "datasets": [
    {
      "id": 1,
      "name": "dataset-1",
      "description": "First dataset",
      "created_at": "2025-10-26T14:33:58Z"
    },
    {
      "id": 2,
      "name": "dataset-2",
      "description": "Second dataset",
      "created_at": "2025-10-26T14:33:59Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 2
  }
}
```

**Error Response (500):**

```json
{
  "error": "Failed to fetch datasets from database",
  "message": "Connection refused (only in development mode)"
}
```

## Environment Variables

### Required

At least one of these configurations must be present:

1. **Single URL:**
   - `DATABASE_URL` - PostgreSQL connection string
     - Format: `postgresql://user:password@host:port/database`
     - Example: `postgresql://postgres:postgres@localhost:5432/kaggle`

2. **Individual Parameters:**
   - `DB_HOST` - PostgreSQL host (default: localhost)
   - `DB_PORT` - PostgreSQL port (default: 5432)
   - `DB_USER` - PostgreSQL user (default: postgres)
   - `DB_PASSWORD` - PostgreSQL password (default: postgres)
   - `DB_NAME` - PostgreSQL database (default: postgres)

### Optional

- `NODE_ENV` - Set to 'development' for detailed error messages (default: production)
- `DB_POOL_SIZE` - Max database connections (default: 10)
- `DB_IDLE_TIMEOUT` - Idle connection timeout in ms (default: 30000)
- `PORT` - HTTP server port (default: 3000)
- `HOST` - HTTP server host (default: 0.0.0.0)

### Environment Variable Precedence

1. `DATABASE_URL` takes precedence if set
2. Falls back to individual `DB_*` variables
3. Uses defaults if variables are missing

**Example .env file:**

```bash
# Option 1: Single URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kaggle

# Option 2: Individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=kaggle

# Optional tuning
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=60000
NODE_ENV=development
```

## Security

This service implements production-ready security practices:

### Database Security

- **Parameterized Queries** - All queries use safe parameterized statements to prevent SQL injection
- **Input Validation** - All query parameters are validated and sanitized
- **Connection Pooling** - Efficient connection reuse with configurable limits
- **Environment Validation** - Clear error messages for misconfigured connections

### API Security

- **Error Handling** - Generic error messages in production, detailed messages in development
- **No Information Disclosure** - Error responses don't leak database credentials or SQL details
- **Rate Limiting Ready** - Can be added in future phases
- **Input Bounds** - Pagination limits prevent resource exhaustion

### Container Security

- **Non-root User** - Fastify user (UID 1001) runs the application
- **Alpine Linux** - Minimal base image with small attack surface
- **Multi-stage Builds** - Production image excludes dev dependencies
- **Health Checks** - Container orchestration can verify liveness

**For detailed security analysis, see [SECURITY_ANALYSIS.md](../../SECURITY_ANALYSIS.md)**

## Development

### Project Structure

```
services/kaggle-data-api/
├── src/
│   ├── main.ts                      # Entry point
│   ├── app/
│   │   ├── app.ts                   # Fastify app setup
│   │   ├── routes/
│   │   │   ├── root.ts              # Health check
│   │   │   └── datasets.ts          # Dataset queries
│   │   └── plugins/
│   │       └── sensible.ts          # Sensible defaults
│   └── infrastructure/
│       └── database.ts              # PostgreSQL module
├── tests/
│   ├── kaggle-data-api.test.ts      # Unit tests
│   └── datasets-route.test.ts       # Route tests
├── Dockerfile                       # Multi-stage build
├── .dockerignore                    # Build optimization
└── project.json                     # Nx configuration
```

### Running Locally

```bash
# Serve with hot reload
pnpm nx serve kaggle-data-api

# Build for production
pnpm nx build kaggle-data-api --configuration=production

# Run tests
pnpm nx test kaggle-data-api

# Run linter
pnpm nx lint kaggle-data-api

# Bundle with Docker
./scripts/bundle-docker.sh kaggle-data-api
```

### Common Commands

```bash
# From root of monorepo
pnpm nx serve kaggle-data-api              # Start dev server
pnpm nx test kaggle-data-api --run         # Run tests once
pnpm nx test kaggle-data-api               # Run tests in watch mode
pnpm nx build kaggle-data-api              # Build for production
pnpm nx lint kaggle-data-api               # Lint code
just serve-api                             # Start API service (if using just)
```

## Database Schema

The service expects a `datasets` table with the following structure:

```sql
CREATE TABLE datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

For migrations and schema management, see Phase 3 roadmap in [TODO.md](../../TODO.md).

## Testing

### Unit Tests

Located in `tests/` directory, these test:

- Database module functions
- Route handlers and parameter validation
- Error handling
- Input sanitization

```bash
pnpm exec vitest services/kaggle-data-api/tests --run
```

### Integration Tests

Located in `tests/integration/`, these test:

- Docker configuration
- Real database connectivity
- Full API workflows
- Connection pool behavior

```bash
pnpm test-integration
```

### Test Coverage

- ✅ SQL injection prevention (parameterized queries)
- ✅ Parameter validation and bounds checking
- ✅ Error handling and information disclosure prevention
- ✅ Connection pool management under load
- ✅ Docker build configuration
- ✅ Environment variable validation

**All tests passing:** 34 unit tests + 8 integration tests = 42 tests total

## Deployment

### Docker Image

Build the Docker image:

```bash
# Using the bundle script
./scripts/bundle-docker.sh kaggle-data-api

# Or manually
docker build -t kaggle-data-api:latest \
  --file services/kaggle-data-api/Dockerfile \
  .
```

### Running in Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/db" \
  kaggle-data-api:latest
```

### Docker Compose

See [docker-compose.integration.yml](../../docker-compose.integration.yml) for a complete example with PostgreSQL.

### Health Checks

The container includes a HEALTHCHECK that verifies the service is running:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Performance

### Connection Pooling

The service uses PostgreSQL connection pooling for efficient resource usage:

- **Max Connections:** 10 (configurable via `DB_POOL_SIZE`)
- **Idle Timeout:** 30 seconds (configurable via `DB_IDLE_TIMEOUT`)
- **Singleton Pattern:** Pool is reused across all requests

### Pagination

The `/datasets` endpoint supports pagination to limit response size:

- **Default Limit:** 100 results
- **Max Limit:** 1000 results
- **Offset Support:** Skip results for pagination

```bash
# Get results 100-200
curl "http://localhost:3000/datasets?limit=100&offset=100"
```

## Troubleshooting

### Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**

1. Ensure PostgreSQL is running: `docker ps | grep postgres`
2. Check `DATABASE_URL` or `DB_HOST` is correct
3. Verify PostgreSQL port (default: 5432)
4. Check database credentials

### Invalid DATABASE_URL

**Error:** `Error: Invalid DATABASE_URL: Must start with postgresql:// or postgres://`

**Solutions:**

1. Ensure URL starts with `postgresql://` or `postgres://`
2. Include all required parts: `postgresql://user:password@host:port/database`
3. URL-encode special characters in password (e.g., `@` becomes `%40`)

### Port Already in Use

**Error:** `Error: listen EADDRINUSE :::3000`

**Solutions:**

1. Find process using port: `lsof -i :3000`
2. Kill the process: `kill -9 <PID>`
3. Or use a different port: `PORT=3001 pnpm nx serve kaggle-data-api`

### Invalid Port Number

**Error:** `Error: Invalid DB_PORT: Must be a number between 1 and 65535`

**Solutions:**

1. Ensure `DB_PORT` is numeric: `5432` not `"5432"`
2. Port must be in valid range: 1-65535
3. Default PostgreSQL port is 5432

## Next Steps

- **Phase 3:** Database migrations and expanded CRUD operations
- **Phase 4:** Kubernetes deployment and orchestration
- **Phase 5:** Advanced querying and data transformation
- **Phase 6:** Rate limiting and authentication

## References

- [SECURITY_ANALYSIS.md](../../SECURITY_ANALYSIS.md) - Detailed security implementation
- [DEVELOPMENT.md](../../DEVELOPMENT.md) - Development commands and workflows
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Technical architecture overview
- [Fastify Documentation](https://www.fastify.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## License

MIT - Part of Super Zol Backend

## Support

For questions or issues, refer to the main repository documentation or create an issue in the project repository.
