# Integration Tests for Kaggle Data API

This document describes the integration testing strategy for the kaggle-data-api service, including database integration, Kubernetes deployment, and end-to-end testing.

## Overview

The integration test suite validates the complete deployment of the kaggle-data-api service in a Kubernetes environment with PostgreSQL database connectivity.

## Prerequisites

- **Kind Cluster**: Local Kubernetes cluster (`super-zol`)
- **PostgreSQL**: Deployed in the `super-zol` namespace
- **Docker**: For building service images
- **kubectl, helm**: For K8s operations

## Running Integration Tests

### Quick Start

```bash
# From the repository root
./services/kaggle-data-api/tests/integration.test.sh
```

### Manual Setup

If you need to run the steps manually:

```bash
# 1. Build the service
pnpm nx build kaggle-data-api

# 2. Build Docker image
docker build -t kaggle-data-api:local -f services/kaggle-data-api/Dockerfile .

# 3. Load image into kind cluster
kind load docker-image kaggle-data-api:local --name super-zol

# 4. Apply database migrations
kubectl apply -f services/kaggle-data-api/helm/migrations/migration-configmap.yaml -n super-zol
kubectl apply -f services/kaggle-data-api/helm/migrations/migration-job.yaml -n super-zol
kubectl wait --for=condition=complete --timeout=60s job/kaggle-data-api-migrations -n super-zol

# 5. Deploy service with Helm
helm upgrade --install kaggle-data-api services/kaggle-data-api/helm \
  -f services/kaggle-data-api/helm/values-local.yaml \
  -n super-zol \
  --set image.tag=local \
  --wait

# 6. Wait for pods to be ready
kubectl wait --for=condition=ready --timeout=60s pod -l app=kaggle-data-api -n super-zol

# 7. Port forward for testing
kubectl port-forward -n super-zol svc/kaggle-data-api 3001:80 &

# 8. Run API tests
curl http://localhost:3001/health
curl http://localhost:3001/datasets
curl http://localhost:3001/datasets/1
```

## Test Coverage

The integration test suite validates:

### 1. Build & Deployment

- ✅ Service builds successfully
- ✅ Docker image builds
- ✅ Image loads into kind cluster
- ✅ Helm deployment succeeds
- ✅ Pods become ready

### 2. Database Integration

- ✅ Migration job completes successfully
- ✅ Mock data is seeded (10 datasets)
- ✅ Service connects to PostgreSQL
- ✅ Health check verifies database connectivity

### 3. API Endpoints

- ✅ `/health` - Basic health check
- ✅ `/health/live` - Liveness probe
- ✅ `/health/ready` - Readiness probe with DB check
- ✅ `/` - API info endpoint
- ✅ `/v1/info` - Detailed version info
- ✅ `/docs` - Swagger UI
- ✅ `/datasets` - List all datasets
- ✅ `/datasets/:id` - Get specific dataset
- ✅ `/datasets?limit=5&offset=0` - Pagination

### 4. Database Operations

- ✅ Query returns mock data
- ✅ Pagination works correctly
- ✅ Dataset count matches expected (10)
- ✅ Individual dataset fetch works
- ✅ 404 error for non-existent datasets

### 5. Security & Performance

- ✅ CORS headers present
- ✅ Rate limiting headers present
- ✅ Helmet security headers applied

### 6. Observability

- ✅ No errors in pod logs
- ✅ Structured logging works

## Database Migrations

### Migration Files

Migrations are stored in:

```
services/kaggle-data-api/migrations/
├── 001_create_datasets_table.sql
└── run-migrations.sh
```

### Running Migrations Manually

```bash
# Apply ConfigMap and Job
kubectl apply -f services/kaggle-data-api/helm/migrations/migration-configmap.yaml -n super-zol
kubectl apply -f services/kaggle-data-api/helm/migrations/migration-job.yaml -n super-zol

# Watch migration progress
kubectl logs -f job/kaggle-data-api-migrations -n super-zol

# Verify data
kubectl exec -it -n super-zol statefulset/postgresql -- \
  psql -U superzol -d superzol -c "SELECT COUNT(*) FROM datasets;"
```

### Mock Data

The migration creates 10 mock datasets:

1. Titanic
2. House Prices
3. Digit Recognizer
4. NLP Getting Started
5. Spaceship Titanic
6. Store Sales Time Series
7. Contradictory Watson
8. Playground Series
9. Dogs vs. Cats
10. Tabular Playground

## Testing Database Connectivity

### Health Check

```bash
# Via kubectl port-forward
kubectl port-forward -n super-zol svc/kaggle-data-api 3001:80 &
curl http://localhost:3001/health/ready

# Expected response
{
  "status": "ready",
  "checks": {
    "database": "healthy"
  }
}
```

### Direct Database Access

```bash
# Get PostgreSQL password
PG_PASSWORD=$(kubectl get secret -n super-zol postgresql -o jsonpath='{.data.password}' | base64 -d)

# Port forward PostgreSQL
kubectl port-forward -n super-zol svc/postgresql 5432:5432 &

# Connect with psql
PGPASSWORD=$PG_PASSWORD psql -h localhost -p 5432 -U superzol -d superzol

# Query datasets
SELECT * FROM datasets LIMIT 5;
```

## Troubleshooting

### Migration Job Fails

```bash
# Check job status
kubectl get job -n super-zol kaggle-data-api-migrations

# View logs
kubectl logs -n super-zol job/kaggle-data-api-migrations

# Delete and retry
kubectl delete job -n super-zol kaggle-data-api-migrations
kubectl apply -f services/kaggle-data-api/helm/migrations/migration-job.yaml -n super-zol
```

### Service Won't Start

```bash
# Check pod status
kubectl get pods -n super-zol -l app=kaggle-data-api

# View events
kubectl describe pod -n super-zol -l app=kaggle-data-api

# Check logs
POD=$(kubectl get pod -n super-zol -l app=kaggle-data-api -o jsonpath='{.items[0].metadata.name}')
kubectl logs -n super-zol $POD

# Common issues:
# 1. Database connection failure → Check PostgreSQL is running
# 2. Image not found → Run kind load docker-image again
# 3. Env vars missing → Check helm values-local.yaml
```

### Database Connection Fails

```bash
# Verify PostgreSQL is running
kubectl get pods -n super-zol -l app.kubernetes.io/name=postgresql

# Test connection from a debug pod
kubectl run debug --rm -it --image=postgres:16-alpine -n super-zol -- sh
# Inside the pod:
PGPASSWORD=<password> psql -h postgresql.super-zol.svc.cluster.local -U superzol -d superzol
```

### Health Check Returns 503

```bash
# This means database is unreachable
# Check PostgreSQL status
kubectl get pods -n super-zol -l app.kubernetes.io/name=postgresql

# Check service endpoints
kubectl get endpoints -n super-zol postgresql

# Verify secrets exist
kubectl get secret -n super-zol postgresql
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Kind Cluster
        run: |
          make deploy  # From infrastructure/local-env
          make init-postgres

      - name: Run Integration Tests
        run: ./services/kaggle-data-api/tests/integration.test.sh

      - name: Cleanup
        if: always()
        run: make clean
```

## Performance Benchmarks

Expected performance characteristics:

- **Pod Startup**: < 30 seconds
- **Migration Job**: < 60 seconds
- **Health Check Response**: < 100ms
- **Dataset List Query**: < 200ms
- **Single Dataset Query**: < 50ms

## Next Steps

1. **Add Redis Integration**: Cache frequently accessed datasets
2. **Add Authentication**: JWT-based API authentication
3. **Add Monitoring**: Prometheus metrics and Grafana dashboards
4. **Add Load Tests**: k6 or Locust performance testing
5. **Add Chaos Tests**: Test resilience with chaos engineering

## Resources

- [Fastify Documentation](https://www.fastify.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kubernetes Testing Best Practices](https://kubernetes.io/docs/tasks/debug/)
- [Helm Testing](https://helm.sh/docs/topics/chart_tests/)
