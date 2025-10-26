# Super Zol Backend Monorepo - Task Runner
# Install Just: https://github.com/casey/just

# Default recipe to display help
default:
    @just --list

# Install dependencies
install:
    pnpm install

# Run all quality checks
check: lint typecheck test

# Lint all code
lint:
    pnpm nx run-many -t lint

# Type check all TypeScript
typecheck:
    pnpm exec tsc --noEmit

# Run all tests
test:
    pnpm nx run-many -t test

# Run tests with coverage
test-coverage:
    pnpm nx run-many -t test --coverage

# Run integration tests
test-integration:
    pnpm exec vitest tests/integration --run

# Run integration tests with watch mode
test-integration-watch:
    pnpm exec vitest tests/integration

# Build all projects
build:
    pnpm nx run-many -t build

# Build for production
build-prod:
    pnpm nx run-many -t build --configuration=production

# Format all code
format:
    pnpm nx format:write

# Clean all build outputs and caches
clean:
    rm -rf dist build coverage .nx node_modules/.cache
    pnpm nx reset

# Deep clean including node_modules
clean-all: clean
    rm -rf node_modules pnpm-lock.yaml

# Start API gateway service
serve-api:
    pnpm nx serve api-gateway

# Start worker service
serve-worker:
    pnpm nx serve worker

# Start all services
serve-all:
    pnpm nx run-many -t serve

# Run affected tests only (for CI)
affected-test:
    pnpm nx affected -t test --base=origin/main

# Run affected builds only (for CI)
affected-build:
    pnpm nx affected -t build --base=origin/main

# Run affected lint only (for CI)
affected-lint:
    pnpm nx affected -t lint --base=origin/main

# View dependency graph
graph:
    pnpm nx graph

# Show project details
show project:
    pnpm nx show project {{project}}

# Generate a new service (deterministic structure)
gen-service name:
    @./scripts/gen-service.sh {{name}}

# Generate a new library (deterministic structure)
gen-lib name:
    @./scripts/gen-lib.sh {{name}}

# Generate a new job (deterministic structure)
gen-job name:
    @./scripts/gen-job.sh {{name}}

# Start local infrastructure (database, redis, etc.)
infra-up:
    docker compose up -d

# Stop local infrastructure
infra-down:
    docker compose down

# View infrastructure logs
infra-logs:
    docker compose logs -f

# Setup development environment
dev-setup: install infra-up
    cp .env.example .env
    @echo "Development environment ready!"

# CI pipeline
ci: affected-lint affected-test affected-build

# Bundle a specific service/job with Docker image build
# Usage: just bundle kaggle-data-api
bundle service:
    @./scripts/bundle-docker.sh {{service}}

# Build and compile a service without Docker (esbuild only)
# Usage: just bundle-esbuild kaggle-data-api
bundle-esbuild service:
    pnpm nx build {{service}} --configuration=production
    @echo "✅ Bundle created: dist/services/{{service}}"

# Bundle all services with Docker images
bundle-all:
    @for service in api-gateway kaggle-data-api worker; do \
        echo ""; \
        ./scripts/bundle-docker.sh $$service; \
    done
    @echo ""
    @echo "✅ All services bundled successfully"

# Run a specific project's tests
test-project project:
    pnpm nx test {{project}}

# Run a specific project's linter
lint-project project:
    pnpm nx lint {{project}}

# Watch mode for tests
test-watch project:
    pnpm nx test {{project}} --watch

# Update all dependencies
update-deps:
    pnpm update --interactive --latest

# Audit dependencies for vulnerabilities
audit:
    pnpm audit

# Fix audit issues
audit-fix:
    pnpm audit --fix

# Create a tar.gz suitable for LLMs (excludes .gitignored files)
pack-for-llm:
    @./scripts/pack-for-llm.sh

# Automated PR workflow: push, create PR, wait for CI, merge to main
merge-to-main branch='':
    @./scripts/merge-to-main.sh {{branch}}

# Automated PR workflow with custom merge method (squash|merge|rebase)
merge-to-main-with method branch='':
    MERGE_METHOD={{method}} ./scripts/merge-to-main.sh {{branch}}

# Keep local branch after merge (don't auto-delete)
merge-to-main-keep branch='':
    DELETE_BRANCH=false ./scripts/merge-to-main.sh {{branch}}

# Quick commit to main: format, commit, affected checks, push
quick-commit message='':
    bash ./scripts/quick-commit.sh {{message}}

# Shorthand alias for quick-commit
qc message='':
    bash ./scripts/quick-commit.sh {{message}}
