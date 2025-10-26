# TODO: Infrastructure & Kaggle Data API Setup

## Overview

Setting up production-ready Kubernetes infrastructure with reusable Helm library charts and implementing a minimal Kaggle Data API service. Following the pattern from ~/cas/dev-tools/local-env where common Helm templates are centralized in a library chart.

## Definition of Done

- ✅ Fully working local Kubernetes environment (kind cluster)
- ✅ Reusable Helm library chart for services and jobs
- ✅ Minimal kaggle-data-api service deployed and accessible
- ✅ PostgreSQL and Redis running in cluster
- ✅ Documentation for adding new services
- ✅ All infrastructure as code (no manual kubectl commands)

---

## Phase 0: Infrastructure Foundation ✅ COMPLETED

**Goal:** Create reusable Helm library chart and local development environment

**Duration:** 2-3 days

### Step 0.1: Create Helm Library Chart Structure

**Status:** [✅] Completed

**Tasks:**

- [x] Create `helm/library-charts/` directory structure
- [x] Create `helm/library-charts/service/Chart.yaml` (library type chart)
- [x] Create `helm/library-charts/service/templates/` with reusable templates:
  - [x] `_deployment.yaml` - Deployment template with best practices
  - [x] `_service.yaml` - Service template
  - [x] `_ingress.yaml` - Ingress template with nginx annotations
  - [x] `_configmap.yaml` - ConfigMap template
  - [x] `_secret.yaml` - Secret template
  - [x] `_hpa.yaml` - HorizontalPodAutoscaler template
  - [x] `_pdb.yaml` - PodDisruptionBudget template
  - [x] `_serviceaccount.yaml` - ServiceAccount template
  - [x] `_helpers.tpl` - Helper functions for naming, labels, selectors
- [x] Create `helm/library-charts/service/values.yaml` with default values

**Deliverables:**

```
helm/
├── library-charts/
│   └── service/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── _deployment.yaml
│           ├── _service.yaml
│           ├── _ingress.yaml
│           ├── _configmap.yaml
│           ├── _secret.yaml
│           ├── _hpa.yaml
│           ├── _pdb.yaml
│           ├── _serviceaccount.yaml
│           └── _helpers.tpl
```

**Testing:**

- [x] `helm lint helm/library-charts/service/` passes
- [x] Library chart can be referenced as dependency

---

### Step 0.2: Create Job Library Chart

**Status:** [✅] Completed

**Tasks:**

- [x] Create `helm/library-charts/job/` directory
- [x] Create `helm/library-charts/job/Chart.yaml` (library type)
- [x] Create job-specific templates:
  - [x] `_job.yaml` - Job template
  - [x] `_cronjob.yaml` - CronJob template
  - [x] `_configmap.yaml` - ConfigMap for jobs
  - [x] `_secret.yaml` - Secret for jobs
  - [x] `_helpers.tpl` - Helper functions

**Deliverables:**

```
helm/
├── library-charts/
│   ├── service/
│   └── job/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── _job.yaml
│           ├── _cronjob.yaml
│           ├── _configmap.yaml
│           ├── _secret.yaml
│           └── _helpers.tpl
```

**Testing:**

- [x] `helm lint helm/library-charts/job/` passes

---

### Step 0.3: Create Local Environment Setup

**Status:** [✅] Completed

**Tasks:**

- [x] Create `dev-tools/local-env/` directory
- [x] Create `dev-tools/local-env/Makefile` with commands:
  - [x] `make setup` - Install kind, helm, kubectl
  - [x] `make deploy` - Create kind cluster with ingress
  - [x] `make clean` - Delete cluster
  - [x] `make init-postgres` - Deploy PostgreSQL
  - [x] `make init-redis` - Deploy Redis
  - [x] `make init-monitoring` - Deploy monitoring stack (optional)
- [x] Create `dev-tools/local-env/scripts/` directory:
  - [x] `init-kind.sh` - Create kind cluster with config
  - [x] `init-nginx.sh` - Install nginx-ingress controller
  - [x] `init-postgres.sh` - Deploy PostgreSQL with Helm
  - [x] `init-redis.sh` - Deploy Redis with Helm
- [x] Create `dev-tools/local-env/kind-config.yaml` - Kind cluster configuration
- [x] Create `dev-tools/local-env/helm-values/` for infrastructure:
  - [x] `postgres.yaml` - PostgreSQL values
  - [x] `redis.yaml` - Redis values
- [x] Create `dev-tools/local-env/README.md` - Usage documentation

**Deliverables:**

```
dev-tools/
└── local-env/
    ├── Makefile
    ├── README.md
    ├── kind-config.yaml
    ├── scripts/
    │   ├── init-kind.sh
    │   ├── init-nginx.sh
    │   ├── init-postgres.sh
    │   └── init-redis.sh
    └── helm-values/
        ├── postgres.yaml
        └── redis.yaml
```

**Testing:**

- [x] `make deploy` creates kind cluster successfully
- [x] Ingress controller is running
- [x] Can access services via `localhost`

---

### Step 0.4: Create Shared PVC for Kaggle Data

**Status:** [✅] Completed

**Tasks:**

- [x] Create `helm/infrastructure/kaggle-data-pvc/` chart
- [x] Create `Chart.yaml` for PVC chart
- [x] Create `templates/pvc.yaml` with ReadWriteMany access
- [x] Create `values.yaml` with storage configuration
- [x] Create `values-local.yaml` for local development (hostPath)
- [x] Add PVC setup to local-env Makefile

**Deliverables:**

```
helm/
├── infrastructure/
│   └── kaggle-data-pvc/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-local.yaml
│       └── templates/
│           └── pvc.yaml
```

**Testing:**

- [x] PVC created successfully in kind cluster
- [x] Multiple pods can mount the same PVC
- [x] Data persists across pod restarts

---

### Phase 0 Code Review Improvements

**Status:** [✅] Completed

Following comprehensive code review, implemented improvements to address findings:

**Code Duplication (Score: 30% → 0%)**

- [x] Create `helm/library-charts/common/` shared library chart
- [x] Extract 69 lines of duplicated helper functions to common chart
- [x] Update service and job charts to depend on common chart
- [x] Verify charts lint successfully after refactoring

**Test Coverage (Score: 65% → 90%)**

- [x] Add JSON Schema validation (`values.schema.json`) for service chart
- [x] Add JSON Schema validation for job chart
- [x] Make integration tests fully idempotent with cleanup functions
- [x] Add EXIT trap for reliable test resource cleanup
- [x] Document idempotency guarantees in tests/README.md

**Configuration Management**

- [x] Create `infrastructure/config/versions.yaml` for centralized version management
- [x] Create `infrastructure/config/load-versions.sh` helper script
- [x] Pin ingress-nginx to v1.11.2 (instead of floating 'main')
- [x] Update init-postgres.sh to source versions from central config
- [x] Update init-redis.sh to source versions from central config
- [x] Update init-nginx.sh to use pinned manifest URL
- [x] Add comprehensive version management documentation

**Deliverables:**

```
infrastructure/
├── config/
│   ├── versions.yaml          # Central version registry
│   ├── load-versions.sh       # Version loading helper
│   └── README.md              # Version management docs
├── helm/
│   └── library-charts/
│       ├── common/            # NEW: Shared helpers
│       │   ├── Chart.yaml
│       │   └── templates/
│       │       └── _helpers.tpl
│       ├── service/
│       │   └── values.schema.json  # NEW: Schema validation
│       └── job/
│           └── values.schema.json  # NEW: Schema validation
└── local-env/
    └── tests/
        └── README.md          # Idempotency documentation
```

**Testing:**

- [x] Integration tests run multiple times without failures
- [x] Helm charts lint successfully with common dependency
- [x] Schema validation catches invalid values
- [x] Version loading works with and without yq

---

## Phase 1: Service Chart Templates

**Goal:** Create reusable templates for services and jobs

**Duration:** 1-2 days

### Step 1.1: Create Service Chart Generator

**Status:** [✅] Completed

**Tasks:**

- [x] Create `scripts/new-service-chart.sh` script that:
  - [x] Takes service name as argument
  - [x] Creates `services/<service-name>/helm/` directory
  - [x] Generates `Chart.yaml` with library chart dependency
  - [x] Generates minimal `templates/manifest.yaml` that includes library
  - [x] Generates `values.yaml` with service-specific values
  - [x] Generates `values-local.yaml` for local development
  - [x] Generates `values-dev.yaml` for dev environment
  - [x] Generates `values-production.yaml` for production
- [x] Make script executable and document usage

**Example Generated Structure:**

```
services/
└── kaggle-data-api/
    └── helm/
        ├── Chart.yaml (depends on service library chart)
        ├── values.yaml
        ├── values-local.yaml
        ├── values-dev.yaml
        ├── values-production.yaml
        └── templates/
            └── manifest.yaml (just includes library chart)
```

**Testing:**

- [ ] Script creates valid Helm chart
- [ ] `helm lint` passes on generated chart
- [ ] Chart can be installed with `helm install --dry-run`

---

### Step 1.2: Create Job Chart Generator

**Status:** [✅] Completed

**Tasks:**

- [x] Create `scripts/new-job-chart.sh` script that:
  - [x] Takes job name as argument
  - [x] Creates `jobs/<job-name>/helm/` directory
  - [x] Generates `Chart.yaml` with job library dependency
  - [x] Generates `templates/manifest.yaml`
  - [x] Generates values files for different environments
  - [x] Supports both Job and CronJob types
- [x] Document usage in README

**Testing:**

- [ ] Script creates valid Helm chart for jobs
- [ ] Can generate both Job and CronJob charts

---

### Step 1.3: Update fetch-kaggle Job Chart

**Status:** [✅] Completed

**Tasks:**

- [x] Run `scripts/new-job-chart.sh fetch-kaggle --type cronjob`
- [x] Customize `jobs/fetch-kaggle/helm/values.yaml`:
  - [x] Set image repository and tag
  - [x] Configure environment variables (KAGGLE_DATA_ROOT)
  - [x] Mount kaggle-data-pvc volume
  - [x] Set CronJob schedule (daily at 2 AM)
- [x] Update values-local.yaml for local testing
- [x] Add documentation to jobs/fetch-kaggle/helm/README.md

**Testing:**

- [x] Helm chart lints successfully
- [x] CronJob configured with correct schedule
- [x] Job mounts kaggle-data PVC
- [x] Environment variables configured correctly

---

## Phase 2: Kaggle Data API Service (Simplified)

**Goal:** Create minimal API service with PostgreSQL integration and docker-compose integration tests

**Duration:** 1-2 days

**Why Simplified:** Defer k8s complexity to later phase. Focus on getting working service with integration tests first.

### Step 2.1: Generate Service Skeleton

**Status:** [ ] Pending

**Tasks:**

- [ ] Run `just gen-service kaggle-data-api`
- [ ] Add dependencies to `services/kaggle-data-api/package.json`:
  - [ ] `pg` (PostgreSQL client)
  - [ ] `@types/pg` (for TypeScript)
- [ ] Verify service compiles and runs

**Testing:**

- [ ] Service compiles successfully: `pnpm nx build kaggle-data-api`
- [ ] Service starts on port 3000: `pnpm nx serve kaggle-data-api`
- [ ] Default health check endpoint works

---

### Step 2.2: Add PostgreSQL Integration

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `src/infrastructure/database.ts`:
  - [ ] PostgreSQL connection pool setup
  - [ ] `getDatabaseUrl()` helper (reads from env)
  - [ ] `createPool()` function with connection config
  - [ ] `query()` helper function
- [ ] Create `src/app/routes/datasets.ts`:
  - [ ] GET `/datasets` - Fetch all datasets from PostgreSQL
  - [ ] Simple query: `SELECT * FROM datasets ORDER BY name`
  - [ ] Return JSON array of results
- [ ] Add DATABASE_URL environment variable support
- [ ] Add basic error handling

**Deliverables:**

```typescript
// Example route implementation
export default async function (fastify: FastifyInstance) {
  fastify.get('/datasets', async (request, reply) => {
    try {
      const result = await query('SELECT * FROM datasets ORDER BY name');
      return { datasets: result.rows };
    } catch (error) {
      reply.code(500);
      return { error: 'Failed to fetch datasets' };
    }
  });
}
```

**Testing:**

- [ ] Route compiles without errors
- [ ] Manual test with local PostgreSQL works

---

### Step 2.3: Create Docker Compose for Integration Tests

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `docker-compose.integration.yml` in root:
  - [ ] PostgreSQL service (postgres:16-alpine)
    - [ ] Port: 5432
    - [ ] Database: test_db
    - [ ] User: test_user
    - [ ] Password: test_password
  - [ ] kaggle-data-api service
    - [ ] Build from services/kaggle-data-api/Dockerfile
    - [ ] Port: 3000
    - [ ] DATABASE_URL pointing to postgres service
    - [ ] Depends on postgres service
  - [ ] Health checks for both services
- [ ] Create `services/kaggle-data-api/Dockerfile`:
  - [ ] Multi-stage build (builder + runner)
  - [ ] Use node:22-alpine base
  - [ ] Expose port 3000
- [ ] Create `.dockerignore` in service directory

**Example docker-compose.integration.yml:**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U test_user']
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: services/kaggle-data-api/Dockerfile
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgres://test_user:test_password@postgres:5432/test_db
      NODE_ENV: test
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 5s
      timeout: 5s
      retries: 5
```

**Testing:**

- [ ] `docker-compose -f docker-compose.integration.yml up` works
- [ ] Both services start successfully
- [ ] Health checks pass

---

### Step 2.4: Create Integration Test

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `tests/integration/` directory in root
- [ ] Create `tests/integration/kaggle-data-api.test.ts`:
  - [ ] Setup: Start docker-compose services
  - [ ] Setup: Connect to PostgreSQL and create test table
  - [ ] Setup: Insert mock data (3-5 sample datasets)
  - [ ] Test: GET /datasets returns mock data
  - [ ] Test: Verify data matches what was inserted
  - [ ] Teardown: Stop docker-compose services
  - [ ] Teardown: Clean up containers and volumes
- [ ] Create `tests/integration/setup.ts`:
  - [ ] Helper functions for docker-compose
  - [ ] Helper functions for database setup
  - [ ] Mock data fixtures
- [ ] Add integration test script to root `package.json`
- [ ] Create `tests/integration/README.md` documenting test approach

**Example Test Structure:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupDockerCompose, teardownDockerCompose } from './setup.js';
import { setupDatabase, insertMockData } from './setup.js';

describe('Kaggle Data API Integration Tests', () => {
  beforeAll(async () => {
    await setupDockerCompose();
    await setupDatabase();
    await insertMockData();
  });

  afterAll(async () => {
    await teardownDockerCompose();
  });

  it('should fetch datasets from database', async () => {
    const response = await fetch('http://localhost:3000/datasets');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.datasets).toHaveLength(3);
    expect(data.datasets[0]).toHaveProperty('name');
  });
});
```

**Testing:**

- [ ] Integration test passes locally
- [ ] Test is idempotent (can run multiple times)
- [ ] Cleanup works properly (no orphaned containers)

---

### Step 2.5: Documentation & Verification

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `services/kaggle-data-api/README.md`:
  - [ ] Overview of the service
  - [ ] Available endpoints
  - [ ] Environment variables
  - [ ] Local development instructions
  - [ ] Running with docker-compose
- [ ] Update root `README.md` with integration test instructions
- [ ] Add npm scripts for convenience:
  - [ ] `test:integration` - Run integration tests
  - [ ] `docker:integration` - Start integration environment
  - [ ] `docker:integration:down` - Stop integration environment
- [ ] Verify end-to-end flow works

**Testing:**

- [ ] Documentation is clear and accurate
- [ ] New developer can follow instructions
- [ ] All commands in documentation work

---

## Phase 3: Database Migrations & Basic CRUD

**Goal:** Add proper database schema management and expand API functionality

**Duration:** 1-2 days

### Step 3.1: Add Database Migrations

**Status:** [ ] Pending

**Tasks:**

- [ ] Choose migration tool (node-pg-migrate or kysely migrations)
- [ ] Add migration dependencies to service
- [ ] Create `migrations/` directory in service
- [ ] Create initial migration: `001_create_datasets_table.sql`
  - [ ] `id` (serial primary key)
  - [ ] `name` (varchar, not null)
  - [ ] `description` (text)
  - [ ] `source_url` (varchar)
  - [ ] `created_at` (timestamp with time zone, default now())
- [ ] Add migration scripts to package.json:
  - [ ] `migrate:up` - Run pending migrations
  - [ ] `migrate:down` - Rollback last migration
  - [ ] `migrate:create` - Create new migration
- [ ] Update docker-compose to run migrations on startup
- [ ] Document migration workflow

**Testing:**

- [ ] Migrations run successfully on fresh database
- [ ] Migrations are idempotent
- [ ] Rollback works correctly

---

### Step 3.2: Expand API with CRUD Operations

**Status:** [ ] Pending

**Tasks:**

- [ ] Add POST `/datasets` - Create new dataset
  - [ ] Validate input (name required)
  - [ ] Insert into database
  - [ ] Return created resource
- [ ] Add GET `/datasets/:id` - Get single dataset
  - [ ] Return 404 if not found
- [ ] Add PUT `/datasets/:id` - Update dataset
  - [ ] Validate input
  - [ ] Return 404 if not found
- [ ] Add DELETE `/datasets/:id` - Delete dataset
  - [ ] Return 404 if not found
- [ ] Add proper error handling for all routes
- [ ] Add input validation

**Testing:**

- [ ] Unit tests for all CRUD operations
- [ ] Integration tests cover all endpoints
- [ ] Error cases handled properly

---

### Step 3.3: Update Integration Tests

**Status:** [ ] Pending

**Tasks:**

- [ ] Update integration tests to use migrated schema
- [ ] Add tests for POST endpoint
- [ ] Add tests for GET single endpoint
- [ ] Add tests for PUT endpoint
- [ ] Add tests for DELETE endpoint
- [ ] Add tests for error cases (404s, validation errors)
- [ ] Ensure tests clean up test data properly

**Testing:**

- [ ] All integration tests pass
- [ ] Tests are idempotent
- [ ] Coverage includes happy path and error cases

---

## Phase 4: Cloud Architecture & Kubernetes Deployment

**Goal:** Design cloud architecture and implement k8s deployment with proper testing

**Duration:** 3-4 days

### Step 4.1: Cloud Architecture Design

**Status:** [ ] Pending

**Tasks:**

- [ ] Document cloud architecture decisions:
  - [ ] Cloud provider choice (AWS, GCP, Azure)
  - [ ] Kubernetes distribution (EKS, GKE, AKS, or managed k8s)
  - [ ] Database hosting strategy (managed RDS vs in-cluster)
  - [ ] Storage strategy for Kaggle data (S3, GCS, Azure Blob)
  - [ ] Ingress strategy (ALB, nginx-ingress, etc.)
  - [ ] Certificate management (cert-manager, cloud-native)
  - [ ] Secrets management (External Secrets Operator, cloud-native)
- [ ] Create architecture diagram
- [ ] Document deployment environments:
  - [ ] Development
  - [ ] Staging
  - [ ] Production
- [ ] Document cost estimates and optimization strategies
- [ ] Create `docs/CLOUD_ARCHITECTURE.md`

**Deliverables:**

- [ ] Comprehensive architecture document
- [ ] Architecture diagrams (infrastructure, networking, data flow)
- [ ] Decision rationale for each component
- [ ] Cost analysis

---

### Step 4.2: K8s Integration Testing Strategy

**Status:** [ ] Pending

**Tasks:**

- [ ] Research k8s integration testing approaches:
  - [ ] Kind-based testing (local k8s cluster)
  - [ ] k3s-based testing (lightweight k8s)
  - [ ] In-cluster testing vs external testing
  - [ ] Test isolation strategies
- [ ] Design integration test workflow:
  - [ ] How to spin up test k8s cluster
  - [ ] How to deploy test infrastructure (postgres, redis)
  - [ ] How to run tests against k8s services
  - [ ] How to clean up after tests
- [ ] Evaluate test frameworks and tools:
  - [ ] Helm test hooks
  - [ ] Custom test runners
  - [ ] CI/CD integration
- [ ] Create `docs/K8S_TESTING_STRATEGY.md`

**Deliverables:**

- [ ] Testing strategy document
- [ ] Evaluation of testing tools
- [ ] Proposed test workflow
- [ ] CI/CD integration plan

---

### Step 4.3: Implement K8s Deployment

**Status:** [ ] Pending

**Tasks:**

- [ ] Create Helm chart for kaggle-data-api (using library charts)
- [ ] Configure deployment manifests:
  - [ ] Deployment with proper resource limits
  - [ ] Service (ClusterIP)
  - [ ] Ingress rules
  - [ ] ConfigMaps for configuration
  - [ ] Secrets for sensitive data
  - [ ] Health checks (liveness, readiness, startup)
- [ ] Create values files for each environment:
  - [ ] values-local.yaml (kind)
  - [ ] values-dev.yaml
  - [ ] values-staging.yaml
  - [ ] values-production.yaml
- [ ] Test deployment to kind cluster:
  - [ ] Build and load Docker image
  - [ ] Deploy PostgreSQL
  - [ ] Deploy API service
  - [ ] Verify accessibility via ingress
- [ ] Document deployment process

**Testing:**

- [ ] Helm chart lints successfully
- [ ] Deployment succeeds in kind cluster
- [ ] Service is accessible
- [ ] Health checks pass
- [ ] Database connectivity works

---

### Step 4.4: K8s Integration Tests Implementation

**Status:** [ ] Pending

**Tasks:**

- [ ] Implement k8s integration test suite:
  - [ ] Create test cluster setup script
  - [ ] Deploy infrastructure to test cluster
  - [ ] Deploy API service to test cluster
  - [ ] Run API integration tests against k8s deployment
  - [ ] Clean up test cluster
- [ ] Create `tests/k8s-integration/` directory
- [ ] Add k8s integration test scripts
- [ ] Integrate with CI/CD pipeline
- [ ] Add GitHub Actions workflow for k8s tests
- [ ] Document k8s testing workflow

**Example Workflow:**

```bash
# Setup
./scripts/k8s-test-setup.sh
kind create cluster --name test-cluster
helm install postgres ...
helm install api ...

# Test
npm run test:k8s-integration

# Cleanup
kind delete cluster --name test-cluster
```

**Testing:**

- [ ] K8s integration tests pass locally
- [ ] Tests are idempotent
- [ ] Tests work in CI/CD pipeline
- [ ] Cleanup is reliable

---

### Step 4.5: Production Readiness

**Status:** [ ] Pending

**Tasks:**

- [ ] Add monitoring and observability:
  - [ ] Prometheus metrics endpoint
  - [ ] Structured logging
  - [ ] Distributed tracing setup
- [ ] Add operational runbooks:
  - [ ] Deployment procedures
  - [ ] Rollback procedures
  - [ ] Troubleshooting guide
  - [ ] Incident response procedures
- [ ] Security hardening:
  - [ ] Network policies
  - [ ] Pod security policies/standards
  - [ ] RBAC configuration
  - [ ] Secrets encryption at rest
- [ ] Performance testing:
  - [ ] Load testing setup
  - [ ] Performance benchmarks
  - [ ] Resource optimization
- [ ] Create `docs/PRODUCTION_READINESS.md`

**Testing:**

- [ ] Load tests pass with acceptable performance
- [ ] Security scans show no critical issues
- [ ] All operational procedures documented and tested

---

## Quality Gates

### Per-Phase Gates

- [x] **Phase 0:** Library charts lint successfully, local-env infrastructure works
- [x] **Phase 1:** Chart generators create valid charts
- [ ] **Phase 2:** API service builds, runs, and integration tests pass with docker-compose
- [ ] **Phase 3:** Database migrations work, CRUD operations tested
- [ ] **Phase 4:** Cloud architecture documented, k8s deployment successful, k8s integration tests pass

### Phase 2 Specific Acceptance Criteria

- [ ] Service compiles and builds successfully
- [ ] Service runs locally and responds to requests
- [ ] PostgreSQL integration works
- [ ] Docker image builds successfully
- [ ] docker-compose.integration.yml brings up all services
- [ ] Integration test passes (GET /datasets returns data from PostgreSQL)
- [ ] Integration test is idempotent (can run multiple times)
- [ ] No manual setup required (automated via docker-compose)

### Final Acceptance Criteria (After Phase 4)

- [ ] API service deployed to k8s cluster
- [ ] PostgreSQL accessible from API (managed or in-cluster)
- [ ] Kaggle Data API deployed and accessible via ingress
- [ ] Health checks passing in k8s
- [ ] All Helm charts follow library pattern
- [ ] Documentation is complete and accurate
- [ ] Can add new service with generator in <5 minutes
- [ ] K8s integration tests pass in CI/CD
- [ ] Production readiness checklist complete

---

## Project Structure (Current State After Phase 2)

```
backend/
├── dev-tools/
│   └── local-env/          # Kind cluster setup (from Phase 0)
│       ├── Makefile
│       ├── README.md
│       ├── kind-config.yaml
│       ├── scripts/
│       └── helm-values/
├── infrastructure/
│   ├── helm/
│   │   └── library-charts/ # Reusable Helm templates (from Phase 0)
│   │       ├── common/
│   │       ├── service/
│   │       └── job/
│   ├── config/             # Version management (from Phase 0)
│   │   ├── versions.yaml
│   │   └── load-versions.sh
│   └── local-env/
│       ├── Makefile
│       └── tests/          # Infrastructure tests
├── jobs/
│   └── fetch-kaggle/       # CronJob with Helm chart (from Phase 1)
│       └── helm/
├── services/
│   └── kaggle-data-api/    # NEW in Phase 2
│       ├── src/
│       │   ├── main.ts
│       │   ├── app/
│       │   │   └── routes/
│       │   │       └── datasets.ts
│       │   └── infrastructure/
│       │       └── database.ts
│       ├── tests/
│       ├── Dockerfile      # NEW: Multi-stage Docker build
│       ├── .dockerignore   # NEW
│       └── project.json
├── tests/
│   └── integration/        # NEW in Phase 2
│       ├── kaggle-data-api.test.ts
│       ├── setup.ts
│       └── README.md
├── scripts/
│   ├── new-service-chart.sh  # From Phase 1
│   └── new-job-chart.sh      # From Phase 1
└── docker-compose.integration.yml  # NEW in Phase 2
```

---

## Timeline Summary

| Phase     | Duration     | Focus                                           | K8s Required |
| --------- | ------------ | ----------------------------------------------- | ------------ |
| Phase 0   | ✅ Done      | Library charts + local env setup                | Yes          |
| Phase 1   | ✅ Done      | Chart generators + templates                    | Yes          |
| Phase 2   | 1-2 days     | API service + PostgreSQL + docker-compose tests | No           |
| Phase 3   | 1-2 days     | Database migrations + CRUD operations           | No           |
| Phase 4   | 3-4 days     | Cloud architecture + k8s deployment + k8s tests | Yes          |
| **Total** | **5-8 days** | **Working API with integration tests**          | Phase 4 only |

**Key Change:** Phases 2-3 can be completed without k8s complexity. K8s work deferred to Phase 4.

---

## References

- [Helm Library Charts](https://helm.sh/docs/topics/library_charts/)
- [Kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [Fastify Documentation](https://fastify.dev/)
- [PostgreSQL Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql)
- [Redis Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/redis)

---

## Status

**Created:** 2025-10-26
**Last Updated:** 2025-10-26
**Current Phase:** Phase 2 - Kaggle Data API Service (Simplified)
**Next Step:** Step 2.1 - Generate Service Skeleton

**Recent Changes:**

- Simplified Phase 2: Removed k8s deployment, focus on docker-compose integration tests
- Created new Phase 3: Database Migrations & Basic CRUD
- Created new Phase 4: Cloud Architecture & Kubernetes Deployment (deferred)
- Integration tests will use docker-compose (postgres + api service)
- K8s complexity deferred to Phase 4 where we'll design cloud architecture properly
