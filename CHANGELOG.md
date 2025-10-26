# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Phase 0: Infrastructure Foundation (In Progress - Step 0.4 Pending)

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

**Remaining:** Step 0.4 - Create Shared PVC for Kaggle Data

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
