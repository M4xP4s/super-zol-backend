# Integration Tests

This directory contains integration tests for the Super Zol Backend services. These tests run against real infrastructure (PostgreSQL, services) rather than mocks.

## Overview

- **Location**: `tests/integration/` (root-level, not per-service)
- **Framework**: Vitest with custom helpers
- **Infrastructure**:
  - **Local**: Kubernetes (Kind cluster)
  - **CI**: GitHub Actions service containers

## Test Structure

```
tests/integration/
├── api/                  # API endpoint integration tests
│   ├── health.test.ts   # Health check endpoints
│   ├── datasets.test.ts # Dataset CRUD operations
│   └── security.test.ts # CORS, rate limiting, security headers
├── database/            # Database integration tests
│   ├── connection.test.ts  # PostgreSQL connectivity
│   └── datasets.test.ts    # Dataset table operations
└── helpers/             # Test utilities
    ├── api-client.ts    # HTTP client for API testing
    ├── db-client.ts     # PostgreSQL client wrapper
    └── test-config.ts   # Environment-based configuration
```

## Local Development

### Prerequisites

1. **Kind cluster** with super-zol namespace
2. **PostgreSQL** deployed in the cluster
3. **kaggle-data-api** service deployed
4. **Port forwarding** for API and database access

### Setup (First Time)

```bash
# 1. Create Kind cluster and deploy infrastructure
cd infrastructure/local-env
make init-kind
make deploy-postgres
make deploy-all

# 2. Build and deploy kaggle-data-api service
cd ../../
pnpm nx build kaggle-data-api
docker build -t kaggle-data-api:local -f services/kaggle-data-api/Dockerfile .
kind load docker-image kaggle-data-api:local --name super-zol

# 3. Deploy service with Helm
cd services/kaggle-data-api
helm upgrade --install kaggle-data-api ./helm \
  -f ./helm/values-local.yaml \
  -n super-zol \
  --set image.tag=local \
  --wait

# 4. Apply database migrations
kubectl apply -f helm/migrations/migration-configmap.yaml -n super-zol
kubectl apply -f helm/migrations/migration-job.yaml -n super-zol
kubectl wait --for=condition=complete --timeout=60s job/kaggle-data-api-migrations -n super-zol
```

### Port Forwarding

In separate terminal windows, set up port forwarding:

```bash
# Terminal 1: API service
kubectl port-forward -n super-zol svc/kaggle-data-api 3001:80

# Terminal 2: PostgreSQL
kubectl port-forward -n super-zol svc/postgresql 5432:5432
```

### Running Tests

With port forwarding active:

```bash
# Run all integration tests
just test-integration

# Or directly with vitest
pnpm vitest run --config vitest.integration.config.ts

# Watch mode (useful during development)
pnpm vitest --config vitest.integration.config.ts
```

### Environment Variables (Optional)

Override default configuration:

```bash
# API configuration
export API_BASE_URL=http://localhost:3001

# Database configuration
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=kaggle_data
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres

# Then run tests
just test-integration
```

## CI Environment

Integration tests in CI use GitHub Actions service containers:

- **PostgreSQL**: Runs as a service container
- **API Service**: Built and started in the workflow
- **Configuration**: Managed via environment variables

### Workflow

See [.github/workflows/integration.yml](../../.github/workflows/integration.yml)

**Steps:**

1. Start PostgreSQL service container
2. Build kaggle-data-api
3. Apply database migrations
4. Start API service in background
5. Run integration tests
6. Report results

### Running Locally in CI Mode

```bash
# Simulate CI environment
CI=true just test-integration-ci
```

## Writing Integration Tests

### API Tests

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { ApiClient } from '../helpers/api-client.js';
import { getTestConfig } from '../helpers/test-config.js';

describe('My API Tests', () => {
  let apiClient: ApiClient;

  beforeAll(() => {
    const config = getTestConfig();
    apiClient = new ApiClient({ baseUrl: config.api.baseUrl });
  });

  it('should test endpoint', async () => {
    const response = await apiClient.get('/my-endpoint');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('field');
  });
});
```

### Database Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DbClient } from '../helpers/db-client.js';
import { getTestConfig } from '../helpers/test-config.js';

describe('My Database Tests', () => {
  let dbClient: DbClient;

  beforeAll(() => {
    const config = getTestConfig();
    dbClient = new DbClient(config.database);
  });

  afterAll(async () => {
    await dbClient.close();
  });

  it('should query data', async () => {
    const result = await dbClient.queryOne('SELECT * FROM my_table WHERE id = $1', [1]);
    expect(result).toBeTruthy();
  });
});
```

## Troubleshooting

### Tests Fail to Connect to API

**Error**: `fetch failed` or connection refused

**Solutions:**

1. Verify port forwarding is active: `lsof -i :3001`
2. Check API pod status: `kubectl get pods -n super-zol -l app=kaggle-data-api`
3. Check API logs: `kubectl logs -n super-zol -l app=kaggle-data-api`

### Tests Fail to Connect to Database

**Error**: `Connection refused` or `ECONNREFUSED`

**Solutions:**

1. Verify PostgreSQL port forwarding: `lsof -i :5432`
2. Check PostgreSQL pod: `kubectl get pods -n super-zol -l app=postgresql`
3. Test connection: `psql -h localhost -U postgres -d kaggle_data`

### Migrations Not Applied

**Error**: `relation "datasets" does not exist`

**Solutions:**

1. Check migration job: `kubectl get jobs -n super-zol`
2. View migration logs: `kubectl logs -n super-zol job/kaggle-data-api-migrations`
3. Re-apply migrations:
   ```bash
   kubectl delete job kaggle-data-api-migrations -n super-zol
   kubectl apply -f services/kaggle-data-api/helm/migrations/migration-job.yaml -n super-zol
   ```

### Kind Cluster Not Found

**Error**: `No kind clusters found`

**Solutions:**

1. Create cluster: `cd infrastructure/local-env && make init-kind`
2. Verify: `kind get clusters`

## Best Practices

1. **Test Isolation**: Integration tests should not modify shared state
2. **Timeouts**: Use appropriate timeouts for network operations (default: 5s)
3. **Cleanup**: Always close database connections in `afterAll`
4. **Sequential Execution**: Integration tests run sequentially to avoid conflicts
5. **Environment-Aware**: Use `getTestConfig()` for proper environment detection

## Comparison with Shell Scripts

The existing shell script at `services/kaggle-data-api/tests/integration.test.sh` performs **end-to-end deployment testing** (Docker build, Helm deploy, K8s validation).

These Vitest integration tests focus on **application logic testing** (API endpoints, database operations) and run faster with better developer experience.

**Both are valuable:**

- **Vitest tests**: Fast feedback during development, detailed test output, TypeScript
- **Shell script**: Complete deployment validation, infrastructure verification
