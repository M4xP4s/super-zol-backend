# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
