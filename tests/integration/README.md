# Integration Tests

Integration tests verify the service functionality with real dependencies (PostgreSQL, Docker services, etc.).

## Overview

The integration test suite uses `docker-compose.integration.yml` to provision:

- **PostgreSQL** (postgres:16-alpine) - Test database
- **kaggle-data-api** - Fastify service with database connectivity

Tests are located in this directory and run against the provisioned services.

## Quick Start

### Option 1: One-Command Full Test Cycle (Recommended)

```bash
just integ-test-full
```

This command:

1. Starts PostgreSQL + kaggle-data-api services
2. Waits for services to be healthy
3. Runs all integration tests
4. Cleans up services (even if tests fail)

### Option 2: Manual Workflow (for Development)

Start services:

```bash
just integ-setup
```

Run tests in watch mode:

```bash
just test-integration-watch
```

View logs:

```bash
just integ-logs
```

Stop services:

```bash
just integ-down
```

## Available Just Commands

| Command                       | Purpose                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `just integ-test-full`        | Complete integration test cycle (setup → test → teardown)               |
| `just integ-setup`            | Start PostgreSQL + API services only                                    |
| `just integ-down`             | Stop all services                                                       |
| `just integ-logs`             | Stream live logs from services                                          |
| `just test-integration`       | Run tests against running services (assumes `integ-setup` has been run) |
| `just test-integration-watch` | Run tests in watch mode for development                                 |

## Test Files

### `docker-compose.test.ts`

- Validates `docker-compose.integration.yml` configuration
- Verifies Dockerfile setup
- Checks health check configurations
- Validates services and environment variables

### `kaggle-data-api-runtime.test.ts`

- Runtime integration tests against real PostgreSQL
- Tests database connectivity
- Validates `/datasets` endpoint
- Tests connection pool management
- Tests error handling

**Note:** These tests skip gracefully if PostgreSQL is unavailable (non-blocking)

## Configuration

Services are defined in `/docker-compose.integration.yml`:

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_password
  port: 5432

kaggle-data-api:
  build: services/kaggle-data-api/Dockerfile
  environment:
    DATABASE_URL: postgresql://test_user:test_password@postgres:5432/test_db
  port: 3000
  depends_on: postgres (service_healthy)
```

## Running in CI/CD

For CI/CD pipelines, use:

```bash
just integ-test-full
```

This ensures proper cleanup even if tests fail (safe for CI environments).

## Database Configuration

Tests auto-detect the database URL:

- Default: `postgresql://test_user:test_password@localhost:5432/test_db`
- Override: Set `TEST_DATABASE_URL` environment variable

Example:

```bash
TEST_DATABASE_URL=postgresql://user:pass@db.example.com:5432/test_db just test-integration
```

## Troubleshooting

### Tests are skipped

Database may be unavailable. Check if it's running:

```bash
docker-compose -f docker-compose.integration.yml ps
```

### Port 5432 already in use

Another PostgreSQL instance is running. Either:

1. Stop it: `sudo lsof -i :5432 | grep LISTEN | awk '{print $2}' | xargs kill -9`
2. Or modify port in `docker-compose.integration.yml`

### Tests hang

Services may not be healthy. Check logs:

```bash
just integ-logs
```

### Cleanup failed

Manually cleanup containers:

```bash
docker-compose -f docker-compose.integration.yml down -v
```

The `-v` flag removes named volumes (useful if PostgreSQL data is corrupted).

## Development Workflow

For iterative development:

```bash
# Terminal 1: Start services
just integ-setup

# Terminal 2: Run tests in watch mode
just test-integration-watch

# Edit tests, auto-run on save

# When done, cleanup:
just integ-down
```

## Test Isolation

- Each test run creates a fresh database (defined in `beforeAll()`)
- Tests are idempotent (can run multiple times)
- Cleanup happens in `afterAll()` hook
- No test data persists between runs

## Coverage

Run tests with coverage:

```bash
just integ-setup
pnpm exec vitest tests/integration --run --coverage
just integ-down
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [docker-compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js pg Library](https://node-postgres.com/)
