# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Phase 2: Kaggle Data API Service (2025-10-26)

Complete Fastify-based RESTful API service for Kaggle dataset access:

- **kaggle-data-api Service** - Production-ready API with comprehensive features
  - RESTful endpoints for API info and health checks
  - Fastify 4.x with AutoLoad for plugins and routes
  - Environment-aware CORS configuration (strict in production, permissive in development)
  - Rate limiting (100 req/min production, 1000 req/min development)
  - Security headers via @fastify/helmet (XSS, Frame Options, Content-Type-Options)
  - OpenAPI/Swagger documentation at `/docs`
  - Comprehensive health check system:
    - `/health` - Basic health status
    - `/health/live` - Liveness probe for Kubernetes
    - `/health/ready` - Readiness probe with database/redis checks

- **Testing Infrastructure** - Organized, comprehensive test suite
  - 23 tests across 8 test suites covering all functionality
  - Modular test organization: routes, plugins, security, errors, swagger
  - Coverage: 94.67% statements, 81.25% branches, 87.5% functions
  - Tests for error handling (404s, invalid methods, security headers)
  - CORS preflight request validation
  - Rate limit header verification

- **Docker Configuration** - Optimized containerization
  - Multi-stage Dockerfile with bundling enabled
  - All dependencies bundled in main.js (no runtime path resolution issues)
  - Non-root user (UID 1001) for security
  - Wget-based health check for Kubernetes probes
  - Minimal Alpine-based image (~200MB)

- **Helm Chart** - Kubernetes deployment ready
  - Uses library chart pattern from Phase 0
  - Configured health probes (liveness, readiness, startup)
  - Resource limits: 500m CPU / 512Mi memory
  - Autoscaling support (disabled by default)
  - Environment-specific values files (local, dev, production)

- **Documentation**
  - `DEPENDENCY_VERSIONS.md` - Explains Fastify 4.x plugin compatibility
  - Inline code comments documenting configuration choices
  - README with installation and usage instructions

**Plugin Architecture:**

- `@fastify/cors` (v9.0.1) - Environment-aware CORS with origin restrictions
- `@fastify/helmet` (v11.1.1) - Security headers (XSS, frame options, etc.)
- `@fastify/rate-limit` (v9.1.0) - API abuse protection with rate limiting
- `@fastify/sensible` (v5.2.0) - Useful utilities and error handling
- `@fastify/swagger` (v8.0.0) - OpenAPI specification generation
- `@fastify/swagger-ui` (v3.0.0) - Interactive API documentation

**Quality Metrics:**

- 23/23 tests passing
- 94.67% statement coverage (above 90% threshold)
- Zero TypeScript errors
- Helm chart passes `helm lint`
- Docker image builds successfully
- All CI checks passing

**Security Features:**

- Environment-aware CORS (production requires explicit origin whitelist)
- Rate limiting to prevent API abuse
- Security headers via Helmet (XSS, clickjacking protection)
- Non-root container user
- No unused dependencies (removed ioredis, pg)

- Add `TECH_STACK.md` documenting the full repository tech stack
- Expanded `TECH_STACK.md` with Methodologies & Practices (TDD, Hexagonal architecture, quality gates)
- Helm chart generator scripts:
  - `scripts/new-service-chart.sh` to scaffold service charts under `services/<name>/helm`
  - `scripts/new-job-chart.sh` to scaffold job charts under `jobs/<name>/helm` (supports Job and CronJob)
- New `jobs/fetch-kaggle/helm` chart using the job library with:
  - Cron schedule at 02:00
  - `KAGGLE_DATA_ROOT` env var
  - PVC mount for `kaggle-data-pvc`

### Changed

- README: link `TECH_STACK.md` for easier discovery
- Moved service/job-specific Helm charts into their respective project directories (`services/*/helm`, `jobs/*/helm`) instead of `infrastructure/helm/*`.
- Library charts: fixed `common.chart` helper and checksum annotations to hash values directly (works when used as dependency).

### Added

#### Phase 0: Infrastructure Foundation ✅ COMPLETED

Infrastructure setup for production-ready Kubernetes deployment with reusable Helm library charts:

- **Helm Library Charts** - Reusable chart templates for services and jobs
  - `infrastructure/helm/library-charts/service/` - Service deployment template with:
    - Deployment with best practices (health probes, security contexts, resource limits)
    - Service, Ingress, ConfigMap, Secret templates
    - HorizontalPodAutoscaler and PodDisruptionBudget support
    - ServiceAccount with configurable annotations
  - `infrastructure/helm/library-charts/job/` - Job and CronJob template with:
    - Job template with backoff limits and deadlines
    - CronJob template with scheduling and concurrency policies
    - Configurable restart policies and resource limits
  - All charts pass `helm lint` validation
  - Follows Kubernetes best practices and security guidelines

- **Local Kubernetes Environment** - Complete development environment using Kind
  - Makefile with commands: setup, deploy, init-all, clean, status, logs
  - kind-config.yaml with 3-node cluster (1 control-plane + 2 workers)
  - Scripts for cluster initialization:
    - init-kind.sh - Create kind cluster with proper networking
    - init-nginx.sh - Install nginx-ingress controller
    - init-postgres.sh - Deploy PostgreSQL with Bitnami chart
    - init-redis.sh - Deploy Redis with Bitnami chart
    - init-monitoring.sh - Optional Prometheus + Grafana
  - Helm values for local development (PostgreSQL and Redis)
  - Comprehensive integration tests verifying:
    - Required tools installation
    - Cluster creation and health
    - Ingress controller deployment
    - PostgreSQL and Redis connectivity
    - Service DNS resolution
    - Helm chart validation
  - Detailed README with quickstart, troubleshooting, and operations guide

- **Kaggle Data PVC** - Persistent Volume Claim for shared dataset storage
  - Helm chart in `infrastructure/helm/infrastructure/kaggle-data-pvc/`
  - ReadWriteMany access for multi-pod shared storage
  - Environment-specific values (local: 5Gi, production: 20Gi)
  - Support for multiple cloud providers (AWS gp3, GCP pd-ssd, Azure managed-premium)
  - Directory structure: `/data/kaggle/{raw,processed,archive}/`
  - Integration with Makefile via `make init-kaggle-pvc`
  - Comprehensive README with installation, configuration, and troubleshooting guides
  - Passes helm lint validation

**Phase 0 Status:** All 4 steps completed successfully
**Total Deliverables:** 3 Helm library charts, 1 PVC chart, local environment with integration tests

- **Phase 0 Code Review Improvements** - Enhanced code quality following comprehensive review
  - **Code Duplication Elimination** (30% → 0%)
    - Created `infrastructure/helm/library-charts/common/` shared library chart
    - Extracted 69 lines of duplicated helper functions from service and job charts
    - Service and job charts now depend on common chart via Chart.yaml dependencies
    - Reduced maintenance burden and improved consistency across charts
  - **Test Coverage Improvements** (65% → 90%)
    - Added JSON Schema validation (`values.schema.json`) for service and job library charts
    - Schema validates required fields, types, ranges, and enum values at deploy time
    - Made integration tests fully idempotent with cleanup functions and EXIT trap
    - Tests can now be run multiple times without side effects or manual cleanup
    - Added comprehensive test documentation in `infrastructure/local-env/tests/README.md`
  - **Configuration Management**
    - Centralized all version configuration in `infrastructure/config/versions.yaml`
    - Created `load-versions.sh` helper script for shell script version loading
    - Pinned ingress-nginx to v1.11.2 (previously floating 'main' branch)
    - Updated all init scripts to source versions from central config
    - Single source of truth for PostgreSQL (15.5.38), Redis (20.5.0), and ingress versions
    - Added comprehensive version management documentation with upgrade procedures
    - Supports both `yq` parsing and fallback `grep`+`sed` when yq unavailable

### Changed

- **CLI commands refactoring** - Reduced nested conditionals across all CLI command files
  - Applied advanced TypeScript patterns: comma operator, early returns, function extraction
  - Reduced code by 30-43% per file while maintaining 100% test coverage
  - Improved readability with direct Command chaining and ternary operators
  - Files refactored: auth.ts, all.ts, profile.ts, download.ts, inventory.ts
  - All 166 tests passing with identical behavior

- **Documentation reorganization** - Improved README structure and created focused documentation files
  - Created [CONTRIBUTING.md](CONTRIBUTING.md) - Comprehensive contributor guidelines with git workflow, commit conventions, and PR process
  - Created [DEVELOPMENT.md](DEVELOPMENT.md) - Complete development guide with all commands, workflows, debugging tips, and troubleshooting
  - Restructured [README.md](README.md) - Now more welcoming, scannable, and navigation-focused with clear signposting to other docs
  - Updated [CLAUDE.md](CLAUDE.md) - Streamlined to focus on AI-specific workflows while referencing detailed docs
  - Improved discoverability of sub-project documentation (fetch-kaggle, shared-util)
  - Better separation of concerns: developer guides, contributor guidelines, technical deep-dives, and project management docs

#### Epic 1: Kaggle Dataset Download & Processing Pipeline (Completed)

Complete TypeScript implementation of Kaggle dataset operations in `jobs/fetch-kaggle` with:

- **Authentication system** - Support for env vars and kaggle.json with interactive setup
- **Download workflow** - Dataset fetching, file processing, manifest generation, validation
- **Inventory analysis** - Pattern detection, chain/file type distribution reports
- **Schema profiling** - CSV parsing, column statistics, representative file selection
- **CLI interface** - Commands for auth, download, inventory, profile, and all-in-one workflows
- **Comprehensive test suite** - 166 tests with 94%+ statement coverage, 83%+ branch coverage
- **Developer infrastructure** - Quick-commit script, automated PR workflow, extensive documentation

**Technical Stack:**

- Hexagonal Architecture (core/domain/ports/adapters)
- Native ESM with TypeScript 5.6 strict mode
- Vitest for testing with 90% coverage gates
- Nx monorepo with affected builds and caching
- Git hooks for quality gates (lint-staged, pre-push checks)

**Quality Metrics:**

- 166 tests, 100% pass rate
- 94.68% statement coverage, 83.45% branch coverage, 100% function coverage
- Zero TypeScript errors, zero ESLint warnings
- All CI checks passing

### Infrastructure

- **Nx monorepo** - TypeScript workspace with services, libs, jobs structure
- **Developer tooling** - ESLint 9, Prettier, Husky hooks, lint-staged
- **CI/CD** - GitHub Actions workflow with affected tests/builds
- **Documentation** - CLAUDE.md, ARCHITECTURE.md, TIME_SAVE.md, comprehensive READMEs

### Security

- All secrets managed via environment variables
- `.env` gitignored, credentials never committed
- Secure Kaggle API token handling

---

## Future Work

The road ahead includes:

- Data transformation and validation pipelines
- Database integration and ORM setup
- API endpoints for dataset operations
- Scheduling and job orchestration
- Monitoring and observability
- Production deployment configuration

### Removed

- Removed temporary mock services `api-gateway` and `worker`
- Purged all references from configs, docs, and scripts
