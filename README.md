# Super Zol Backend

> A production-ready TypeScript monorepo for data pipeline operations, built with Nx, Fastify, and Vitest.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-green)](https://nodejs.org/)
[![Nx](https://img.shields.io/badge/Nx-22.0.2-purple)](https://nx.dev)
[![Vitest](https://img.shields.io/badge/Vitest-Latest-yellow)](https://vitest.dev/)

## What is Super Zol?

Super Zol is a modern, scalable backend system designed for data pipeline operations. It currently features a complete Kaggle dataset processing pipeline with plans for extensive data transformation, validation, and API capabilities.

**Current Features**:

- 🔐 Kaggle API authentication and dataset discovery
- 📦 Dataset download and processing workflows
- 📊 Schema profiling and inventory analysis
- 🏗️ Hexagonal architecture with clean separation of concerns
- ✅ Comprehensive test coverage (94%+, 166 tests)

## Quick Start

### Prerequisites

- **Node.js** ≥22 ([nvm](https://github.com/nvm-sh/nvm) recommended)
- **pnpm** ≥10 (installed automatically)
- **[Just](https://github.com/casey/just)** (optional, but recommended)

### Get Running in 2 Minutes

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env

# 3. Start infrastructure (optional)
just infra-up

# 4. Run quality checks
just check

# 5. Start a service
just serve-api
```

That's it! 🎉

## Project Structure

```
backend/
├── services/          # Deployable backend services
│   └── kaggle-data-api/   # Fastify REST API
├── libs/              # Shared internal libraries
│   └── shared-util/   # Common utilities
├── jobs/              # Scheduled tasks and batch jobs
│   └── fetch-kaggle/  # Kaggle dataset operations
└── scripts/           # Development and deployment scripts
```

### Component Documentation

Each major component has its own README with detailed information:

- **[services/kaggle-data-api](services/kaggle-data-api/README.md)** - Phase 2 API service with PostgreSQL integration
  - [Security Analysis](SECURITY_ANALYSIS.md) - Security enhancements and testing
  - Docker-based deployment with health checks
  - REST API for dataset queries
- **[jobs/fetch-kaggle](jobs/fetch-kaggle/README.md)** - Kaggle dataset pipeline architecture and usage
  - [Architecture Overview](jobs/fetch-kaggle/ARCHITECTURE.md) - Hexagonal architecture deep-dive
  - [Testing Guide](jobs/fetch-kaggle/TESTING.md) - Test strategy and TDD approach
  - [CLI Reference](jobs/fetch-kaggle/src/cli/README.md) - Command-line interface documentation
- **[libs/shared-util](libs/shared-util/README.md)** - Shared utility functions

## Documentation

### For Developers

| Document                                         | Purpose                                                           | Audience                       |
| ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------ |
| **[DEVELOPMENT.md](DEVELOPMENT.md)**             | Complete command reference, workflows, and debugging tips         | Developers (read this first!)  |
| **[CONTRIBUTING.md](CONTRIBUTING.md)**           | Git workflow, commit conventions, PR process                      | Contributors                   |
| **[ARCHITECTURE.md](ARCHITECTURE.md)**           | Technical deep-dive: TypeScript configs, testing setup, git hooks | Architects & senior developers |
| **[SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md)** | Security enhancements, testing, and best practices                | Security-conscious developers  |

### For Project Management

| Document                         | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| **[TODO.md](TODO.md)**           | Current roadmap, completed work, and upcoming epics |
| **[CHANGELOG.md](CHANGELOG.md)** | Detailed change history                             |

### For AI Assistants

| Document                   | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| **[CLAUDE.md](CLAUDE.md)** | Claude Code-specific guidance and workflows         |
| **[AGENTS.md](AGENTS.md)** | Guidelines for AI agents working with this codebase |

## Essential Commands

Most common tasks (see [DEVELOPMENT.md](DEVELOPMENT.md) for complete reference):

```bash
# Quality checks
just check              # Run all checks (lint + typecheck + test)

# Development

# Testing
just test               # Run all tests
just test-watch <name>  # Watch mode for specific project

# Code quality
just lint               # Lint all code
just format             # Format all code
just typecheck          # Type check all TypeScript

# Building
just build              # Build all projects
just build-prod         # Build for production

# Infrastructure
just infra-up           # Start Docker services
just infra-down         # Stop Docker services

# Visualization
just graph              # View dependency graph

# Quick workflows
./scripts/quick-commit.sh "feat: add feature"  # Format, commit, test, push
just merge-to-main                             # Automated PR workflow
```

**Don't have Just?** Install with `brew install just` or see alternatives in [DEVELOPMENT.md](DEVELOPMENT.md#prerequisites).

## Tech Stack

For the complete stack inventory and methodologies, see [TECH_STACK.md](TECH_STACK.md).

| Category            | Technology     | Why?                                    |
| ------------------- | -------------- | --------------------------------------- |
| **Runtime**         | Node.js 22     | Latest LTS with modern features         |
| **Package Manager** | pnpm 10        | Fast, efficient, strict                 |
| **Build System**    | Nx 22.0.2      | Monorepo management, smart caching, MCP |
| **Language**        | TypeScript 5.9 | Type safety, latest features            |
| **API Framework**   | Fastify 5      | Fast, low overhead, extensive plugins   |
| **Testing**         | Vitest         | Native ESM, fast, modern                |
| **Linting**         | ESLint 9       | Code quality enforcement                |
| **Formatting**      | Prettier       | Consistent code style                   |

## Key Features

### 🚀 Performance

- **Smart caching**: Nx caches build/test results for instant rebuilds
- **Affected-only**: Only test/build what changed
- **Parallel execution**: Run tasks concurrently across projects

### ✅ Quality Gates

- **Pre-commit**: ESLint + Prettier on changed files (1-5s)
- **Pre-push**: TypeScript + Tests + Builds on affected projects (30-120s)
- **Commit format**: Conventional Commits enforced
- **Test coverage**: 90% minimum threshold

### 🏗️ Architecture

- **Hexagonal/Clean Architecture**: Clear separation of concerns
- **Deterministic structure**: Generators ensure consistency
- **Strong typing**: Strict TypeScript with no implicit any
- **Pure ESM**: Modern module system throughout

### 🛠️ Developer Experience

- **Automated workflows**: Quick commit and PR automation scripts
- **Fast feedback**: Watch mode for instant test results
- **Clear documentation**: Comprehensive guides for all aspects
- **Git hooks**: Automated quality checks at every stage

## Development Workflow

### Solo Development (Quick Iteration)

```bash
# Make changes, then:
./scripts/quick-commit.sh "feat(api): add endpoint"
```

Automatically formats, commits, tests, and pushes to main.

### Collaborative Development (Feature Branches)

```bash
# Create branch and make changes
git checkout -b feat/my-feature

# Commit your work
git commit -m "feat(api): add authentication"

# Automated PR workflow
just merge-to-main
```

Automatically creates PR, waits for CI, merges, and cleans up.

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete workflow details.

## Current Status

### ✅ Completed

- **Epic 1: Kaggle Dataset Pipeline** - Full TypeScript implementation with 166 tests and 94%+ coverage
  - Authentication system (env vars, kaggle.json, interactive setup)
  - Download workflow (fetch, process, manifest, validate)
  - Inventory analysis (pattern detection, distribution reports)
  - Schema profiling (CSV parsing, column statistics)
  - CLI interface with comprehensive commands

### 🔜 Upcoming

- **Epic 2**: Data transformation and validation pipelines
- **Epic 3**: Database integration and persistence layer
- **Epic 4**: API services and endpoints
- **Epic 5**: Job scheduling and orchestration
- **Epic 6**: Monitoring, logging, and observability
- **Epic 7**: Production deployment and infrastructure

See [TODO.md](TODO.md) for detailed roadmap.

## Contributing

We welcome contributions! Here's how to get started:

1. **Read the docs**: [CONTRIBUTING.md](CONTRIBUTING.md) and [DEVELOPMENT.md](DEVELOPMENT.md)
2. **Set up your environment**: Follow [Quick Start](#quick-start)
3. **Find an issue**: Check GitHub issues or discuss new features
4. **Make your changes**: Follow our coding standards
5. **Submit a PR**: Use our automated workflow

See [CONTRIBUTING.md](CONTRIBUTING.md) for complete guidelines.

## Testing

We take testing seriously:

- **Framework**: Vitest (fast, modern, ESM-native)
- **Coverage**: 90% minimum threshold enforced
- **Organization**: Separate `tests/` directory for clarity
- **Strategy**: Unit, integration, and E2E tests

```bash
# Run all tests
just test

# Watch mode for TDD
just test-watch kaggle-data-api

# Coverage report
just test-coverage
```

See component-specific testing docs for detailed strategies.

## Troubleshooting

### Common Issues

**Nx cache issues?**

```bash
just clean  # or: pnpm nx reset
```

**Dependency problems?**

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Port already in use?**

```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill process
```

See [DEVELOPMENT.md#troubleshooting](DEVELOPMENT.md#troubleshooting) for more solutions.

## Resources

### Official Documentation

- [Nx Documentation](https://nx.dev) - Monorepo build system
- [Fastify Documentation](https://fastify.dev) - Web framework
- [Vitest Documentation](https://vitest.dev) - Testing framework
- [TypeScript Documentation](https://www.typescriptlang.org) - Language

### Project Documentation

- [Architecture Deep-Dive](ARCHITECTURE.md)
- [Development Guide](DEVELOPMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Project Roadmap](TODO.md)
- [Change Log](CHANGELOG.md)

## License

[Add your license here]

## Questions or Issues?

- 💬 **Questions?** Open a [GitHub Discussion](https://github.com/yourusername/super-zol/discussions)
- 🐛 **Bug found?** Open an [Issue](https://github.com/yourusername/super-zol/issues)
- 💡 **Feature idea?** Start a [Discussion](https://github.com/yourusername/super-zol/discussions)

---

**Ready to dive in?** Start with [DEVELOPMENT.md](DEVELOPMENT.md) for complete development workflows and command reference.
