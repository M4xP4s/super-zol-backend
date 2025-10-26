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

# Run integration tests (assumes services are running)
test-integration:
    pnpm exec vitest tests/integration --run

# Run integration tests with watch mode
test-integration-watch:
    pnpm exec vitest tests/integration

# Start integration test services (PostgreSQL + kaggle-data-api)
integ-setup:
    docker-compose -f docker-compose.integration.yml up -d
    @echo "⏳ Waiting for services to be healthy..."
    @sleep 2
    @docker-compose -f docker-compose.integration.yml ps

# Stop integration test services
integ-down:
    docker-compose -f docker-compose.integration.yml down

# View integration test service logs
integ-logs:
    docker-compose -f docker-compose.integration.yml logs -f

# Run full integration test cycle: setup → test → teardown
integ-test-full:
    @echo "🚀 Starting integration test services..."
    @docker-compose -f docker-compose.integration.yml up -d
    @echo "⏳ Waiting for services to be healthy..."
    @sleep 3
    @echo "🧪 Running integration tests..."
    @pnpm exec vitest tests/integration --run; TEST_RESULT=$$?
    @echo "🧹 Cleaning up services..."
    @docker-compose -f docker-compose.integration.yml down
    @exit $$TEST_RESULT

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
    @PROJECTS=$$(pnpm nx show projects --withTarget bundle --sep=,); \
    if [ -z "$$PROJECTS" ]; then \
        echo "ℹ️  No projects with a bundle target found."; \
        exit 0; \
    fi; \
    pnpm nx run-many -t bundle --projects="$$PROJECTS"

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
    just quick-commit "{{message}}"
