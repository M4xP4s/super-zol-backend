# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

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
