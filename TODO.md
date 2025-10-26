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

## Phase 0: Infrastructure Foundation

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

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `helm/infrastructure/kaggle-data-pvc/` chart
- [ ] Create `Chart.yaml` for PVC chart
- [ ] Create `templates/pvc.yaml` with ReadWriteMany access
- [ ] Create `values.yaml` with storage configuration
- [ ] Create `values-local.yaml` for local development (hostPath)
- [ ] Add PVC setup to local-env Makefile

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

- [ ] PVC created successfully in kind cluster
- [ ] Multiple pods can mount the same PVC
- [ ] Data persists across pod restarts

---

## Phase 1: Service Chart Templates

**Goal:** Create reusable templates for services and jobs

**Duration:** 1-2 days

### Step 1.1: Create Service Chart Generator

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `scripts/new-service-chart.sh` script that:
  - [ ] Takes service name as argument
  - [ ] Creates `helm/<service-name>/` directory
  - [ ] Generates `Chart.yaml` with library chart dependency
  - [ ] Generates minimal `templates/manifest.yaml` that includes library
  - [ ] Generates `values.yaml` with service-specific values
  - [ ] Generates `values-local.yaml` for local development
  - [ ] Generates `values-dev.yaml` for dev environment
  - [ ] Generates `values-production.yaml` for production
- [ ] Make script executable and document usage

**Example Generated Structure:**

```
helm/
└── kaggle-data-api/
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

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `scripts/new-job-chart.sh` script that:
  - [ ] Takes job name as argument
  - [ ] Creates `helm/<job-name>/` directory
  - [ ] Generates `Chart.yaml` with job library dependency
  - [ ] Generates `templates/manifest.yaml`
  - [ ] Generates values files for different environments
  - [ ] Supports both Job and CronJob types
- [ ] Document usage in README

**Testing:**

- [ ] Script creates valid Helm chart for jobs
- [ ] Can generate both Job and CronJob charts

---

### Step 1.3: Update fetch-kaggle Job Chart

**Status:** [ ] Pending

**Tasks:**

- [ ] Run `scripts/new-job-chart.sh fetch-kaggle --type cronjob`
- [ ] Customize `helm/fetch-kaggle/values.yaml`:
  - [ ] Set image repository and tag
  - [ ] Configure environment variables (KAGGLE_DATA_ROOT)
  - [ ] Mount kaggle-data-pvc volume
  - [ ] Set CronJob schedule (daily at 2 AM)
- [ ] Update values-local.yaml for local testing
- [ ] Add documentation to helm/fetch-kaggle/README.md

**Testing:**

- [ ] Helm chart installs successfully
- [ ] CronJob created with correct schedule
- [ ] Job can access kaggle-data PVC
- [ ] Environment variables configured correctly

---

## Phase 2: Kaggle Data API Service

**Goal:** Implement minimal API service and deploy locally

**Duration:** 2-3 days

### Step 2.1: Generate Service Skeleton

**Status:** [ ] Pending

**Tasks:**

- [ ] Run `just gen-service kaggle-data-api`
- [ ] Add dependencies to `services/kaggle-data-api/package.json`:
  - [ ] `@fastify/cors`
  - [ ] `@fastify/helmet`
  - [ ] `@fastify/swagger`
  - [ ] `@fastify/swagger-ui`
  - [ ] `pg` (PostgreSQL client)
  - [ ] `ioredis` (Redis client)
- [ ] Update tsconfig for service
- [ ] Create basic directory structure:
  ```
  services/kaggle-data-api/
  ├── src/
  │   ├── main.ts
  │   ├── app/
  │   │   ├── app.ts
  │   │   ├── plugins/
  │   │   └── routes/
  │   └── infrastructure/
  │       └── config.ts
  └── tests/
  ```

**Testing:**

- [ ] Service compiles successfully
- [ ] Service starts on port 3000
- [ ] Basic health check endpoint works

---

### Step 2.2: Implement Minimal API Routes

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `src/app/routes/health.ts`:
  - [ ] GET `/health` - Basic health check
  - [ ] GET `/health/live` - Liveness probe
  - [ ] GET `/health/ready` - Readiness probe (checks DB)
- [ ] Create `src/app/routes/hello.ts`:
  - [ ] GET `/` - Returns "Hello from Kaggle Data API"
  - [ ] GET `/v1/info` - Returns API version and status
- [ ] Add Swagger documentation for all routes
- [ ] Configure CORS and security headers

**Deliverables:**

```typescript
// Example route
export default async function (fastify: FastifyInstance) {
  fastify.get('/', async () => ({
    message: 'Hello from Kaggle Data API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  }));
}
```

**Testing:**

- [ ] All routes return expected responses
- [ ] Swagger UI accessible at `/docs`
- [ ] Health checks work correctly

---

### Step 2.3: Create Helm Chart for API Service

**Status:** [ ] Pending

**Tasks:**

- [ ] Run `scripts/new-service-chart.sh kaggle-data-api`
- [ ] Customize `helm/kaggle-data-api/values.yaml`:
  - [ ] Set image repository and tag
  - [ ] Configure service port (80 -> 3000)
  - [ ] Set resource limits and requests
  - [ ] Configure health check endpoints
  - [ ] Add environment variables:
    - [ ] DATABASE_URL (from secret)
    - [ ] REDIS_URL (from secret)
    - [ ] NODE_ENV
- [ ] Customize `values-local.yaml`:
  - [ ] Set replicaCount: 1
  - [ ] Configure ingress path `/api`
  - [ ] Use local image or Docker Hub
  - [ ] Mount kaggle-data-pvc (read-only)
- [ ] Create `helm/kaggle-data-api/README.md` with:
  - [ ] Installation instructions
  - [ ] Configuration options
  - [ ] Environment-specific values

**Testing:**

- [ ] Helm chart lints successfully
- [ ] Dry-run installation works
- [ ] Chart generates valid Kubernetes manifests

---

### Step 2.4: Build Docker Image

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `services/kaggle-data-api/Dockerfile`:
  - [ ] Multi-stage build (builder + runner)
  - [ ] Use node:22-alpine base image
  - [ ] Copy only necessary files
  - [ ] Run as non-root user
  - [ ] Expose port 3000
- [ ] Create `.dockerignore` file
- [ ] Add build script to `project.json`:
  - [ ] `docker-build` target
  - [ ] `docker-push` target (optional)
- [ ] Build and tag image for local use

**Example Dockerfile:**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build kaggle-data-api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist/services/kaggle-data-api ./
EXPOSE 3000
CMD ["node", "main.js"]
```

**Testing:**

- [ ] Image builds successfully
- [ ] Image size is reasonable (<200MB)
- [ ] Container runs and responds to requests
- [ ] Health checks work in container

---

### Step 2.5: Deploy to Local Kubernetes

**Status:** [ ] Pending

**Tasks:**

- [ ] Load Docker image into kind cluster:
  - [ ] `kind load docker-image kaggle-data-api:local --name super-zol`
- [ ] Create namespace: `kubectl create namespace super-zol`
- [ ] Deploy PostgreSQL:
  - [ ] `make init-postgres` (from local-env)
- [ ] Deploy Redis:
  - [ ] `make init-redis` (from local-env)
- [ ] Create database secrets:
  - [ ] Create secret with DATABASE_URL
  - [ ] Create secret with REDIS_URL
- [ ] Install kaggle-data-pvc chart
- [ ] Install kaggle-data-api chart:
  ```bash
  helm install kaggle-data-api ./helm/kaggle-data-api \
    -f helm/kaggle-data-api/values-local.yaml \
    -n super-zol
  ```
- [ ] Verify deployment:
  - [ ] Pods are running
  - [ ] Service is created
  - [ ] Ingress is configured

**Testing:**

- [ ] API accessible via `http://localhost/api`
- [ ] Health checks pass
- [ ] Swagger UI accessible at `http://localhost/api/docs`
- [ ] Can connect to PostgreSQL
- [ ] Can connect to Redis

---

## Phase 3: Integration & Testing

**Goal:** Verify everything works end-to-end

**Duration:** 1 day

### Step 3.1: End-to-End Testing

**Status:** [ ] Pending

**Tasks:**

- [ ] Test API endpoints:
  - [ ] `curl http://localhost/api/health` returns 200
  - [ ] `curl http://localhost/api/` returns hello message
  - [ ] `curl http://localhost/api/v1/info` returns API info
- [ ] Test Swagger UI:
  - [ ] Open `http://localhost/api/docs` in browser
  - [ ] Try executing requests from Swagger UI
- [ ] Test database connection:
  - [ ] Add test endpoint that queries PostgreSQL
  - [ ] Verify connection works
- [ ] Test Redis connection:
  - [ ] Add test endpoint that uses Redis
  - [ ] Verify connection works

**Testing:**

- [ ] All endpoints respond correctly
- [ ] No errors in pod logs
- [ ] Database queries work
- [ ] Redis operations work

---

### Step 3.2: Documentation

**Status:** [ ] Pending

**Tasks:**

- [ ] Create `dev-tools/local-env/README.md` with:
  - [ ] Prerequisites (Docker, kind, helm, kubectl)
  - [ ] Quick start guide
  - [ ] Available make commands
  - [ ] Accessing services (URLs and ports)
  - [ ] Troubleshooting section
- [ ] Update main `README.md` with infrastructure info
- [ ] Create `helm/README.md` explaining library chart pattern
- [ ] Document how to add new services using generators

**Deliverables:**

- [ ] Complete getting started guide
- [ ] Architecture diagram showing components
- [ ] Examples of adding new services

---

### Step 3.3: Cleanup Scripts

**Status:** [ ] Pending

**Tasks:**

- [ ] Add cleanup commands to Makefile:
  - [ ] `make clean-all` - Delete cluster and volumes
  - [ ] `make reset-data` - Clear Kaggle data PVC
  - [ ] `make logs-api` - Tail API logs
  - [ ] `make logs-postgres` - Tail PostgreSQL logs
- [ ] Create helper scripts:
  - [ ] `scripts/port-forward.sh` - Port forward to services
  - [ ] `scripts/exec-pod.sh` - Exec into running pods
  - [ ] `scripts/dump-resources.sh` - Export all k8s resources

**Testing:**

- [ ] All cleanup commands work
- [ ] Helper scripts function correctly

---

## Phase 4: Optional Enhancements

**Goal:** Add-ons for better developer experience

**Duration:** 1-2 days (optional)

### Step 4.1: Add Monitoring (Optional)

**Status:** [ ] Pending (Optional)

**Tasks:**

- [ ] Add `make init-monitoring` to Makefile
- [ ] Deploy Prometheus + Grafana via Helm
- [ ] Configure ServiceMonitor for API
- [ ] Create basic Grafana dashboards

---

### Step 4.2: Add Database Migrations (Optional)

**Status:** [ ] Pending (Optional)

**Tasks:**

- [ ] Choose migration tool (Kysely migrations or node-pg-migrate)
- [ ] Create initial schema migration
- [ ] Add migration runner to API service
- [ ] Run migrations on startup or as init container

---

### Step 4.3: Add CI/CD for Helm Charts (Optional)

**Status:** [ ] Pending (Optional)

**Tasks:**

- [ ] Create GitHub Actions workflow for Helm charts
- [ ] Lint all charts on PR
- [ ] Test chart installation with kind
- [ ] Package and publish charts to registry

---

## Quality Gates

### Per-Phase Gates

- [ ] **Phase 0:** Library charts lint successfully, kind cluster deploys
- [ ] **Phase 1:** Chart generators create valid charts
- [ ] **Phase 2:** API service deploys and responds to requests
- [ ] **Phase 3:** All integration tests pass, documentation complete

### Final Acceptance Criteria

- [ ] Kind cluster runs with all infrastructure
- [ ] PostgreSQL and Redis accessible from API
- [ ] Kaggle Data API deployed and accessible via ingress
- [ ] Health checks passing
- [ ] Swagger documentation accessible
- [ ] All Helm charts follow library pattern
- [ ] Documentation is complete and accurate
- [ ] Can add new service with generator in <5 minutes

---

## Project Structure (Final State)

```
backend/
├── dev-tools/
│   └── local-env/
│       ├── Makefile
│       ├── README.md
│       ├── kind-config.yaml
│       ├── scripts/
│       │   ├── init-kind.sh
│       │   ├── init-nginx.sh
│       │   ├── init-postgres.sh
│       │   └── init-redis.sh
│       └── helm-values/
│           ├── postgres.yaml
│           └── redis.yaml
├── helm/
│   ├── library-charts/
│   │   ├── service/
│   │   │   ├── Chart.yaml
│   │   │   ├── values.yaml
│   │   │   └── templates/
│   │   └── job/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       └── templates/
│   ├── infrastructure/
│   │   └── kaggle-data-pvc/
│   ├── kaggle-data-api/
│   │   ├── Chart.yaml (depends on service library)
│   │   ├── values.yaml
│   │   ├── values-local.yaml
│   │   └── templates/
│   │       └── manifest.yaml (includes library)
│   └── fetch-kaggle/
│       ├── Chart.yaml (depends on job library)
│       ├── values.yaml
│       └── templates/
│           └── manifest.yaml
├── scripts/
│   ├── new-service-chart.sh
│   └── new-job-chart.sh
└── services/
    └── kaggle-data-api/
        ├── src/
        ├── tests/
        ├── Dockerfile
        └── project.json
```

---

## Timeline Summary

| Phase     | Duration      | Focus                            |
| --------- | ------------- | -------------------------------- |
| Phase 0   | 2-3 days      | Library charts + local env setup |
| Phase 1   | 1-2 days      | Chart generators + templates     |
| Phase 2   | 2-3 days      | API service + deployment         |
| Phase 3   | 1 day         | Integration + documentation      |
| Phase 4   | 1-2 days      | Optional enhancements            |
| **Total** | **7-11 days** | Full local environment + API     |

---

## References

- [Helm Library Charts](https://helm.sh/docs/topics/library_charts/)
- [Kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [Fastify Documentation](https://fastify.dev/)
- [PostgreSQL Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql)
- [Redis Helm Chart](https://github.com/bitnami/charts/tree/main/bitnami/redis)

---

**Created:** 2025-10-26
**Status:** Planning Phase
**Next Step:** Begin Phase 0 - Infrastructure Foundation
