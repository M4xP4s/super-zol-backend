#!/usr/bin/env bash

# Integration Tests with Docker Compose
# Simple script to run integration tests using docker-compose

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Prefer Docker Compose V2 (docker compose); fallback to docker-compose
DOCKER_COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
  else
    echo "Docker Compose not found. Please install Docker Compose V2."
    exit 1
  fi
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up docker-compose services..."
    cd "${PROJECT_ROOT}"
    ${DOCKER_COMPOSE} -f docker-compose.integration.yml down -v 2>/dev/null || true
}

trap cleanup EXIT

main() {
    cd "${PROJECT_ROOT}"

    echo "========================================"
    echo "Integration Tests with Docker Compose"
    echo "========================================"
    echo ""

    # Build the service
    log_info "Building kaggle-data-api service..."
    pnpm nx build kaggle-data-api || {
        log_error "Failed to build service"
        exit 1
    }
    log_success "Service built"

    # Start docker-compose services
    log_info "Starting PostgreSQL and API service..."
    ${DOCKER_COMPOSE} -f docker-compose.integration.yml up -d --build || {
        log_error "Failed to start docker-compose services"
        exit 1
    }

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    # Wait for postgres
    timeout 90 bash -c "until ${DOCKER_COMPOSE} -f docker-compose.integration.yml ps postgres | grep -q '(healthy)'; do sleep 2; done" || {
      log_error "PostgreSQL container failed to become healthy"
      ${DOCKER_COMPOSE} -f docker-compose.integration.yml ps
      ${DOCKER_COMPOSE} -f docker-compose.integration.yml logs postgres
      exit 1
    }
    # Wait for API
    timeout 120 bash -c "until ${DOCKER_COMPOSE} -f docker-compose.integration.yml ps kaggle-data-api | grep -q '(healthy)'; do sleep 2; done" || {
      log_error "API container failed to become healthy"
      ${DOCKER_COMPOSE} -f docker-compose.integration.yml ps
      ${DOCKER_COMPOSE} -f docker-compose.integration.yml logs kaggle-data-api
      exit 1
    }
    log_success "Services are healthy"

    # Apply migrations
    log_info "Applying database migrations..."
    ${DOCKER_COMPOSE} -f docker-compose.integration.yml exec -T postgres psql -U test_user -d test_db < services/kaggle-data-api/helm/migrations/001-create-datasets-table.sql || {
        log_error "Failed to apply migrations"
        exit 1
    }
    ${DOCKER_COMPOSE} -f docker-compose.integration.yml exec -T postgres psql -U test_user -d test_db < services/kaggle-data-api/helm/migrations/002-seed-mock-data.sql || {
        log_error "Failed to seed mock data"
        exit 1
    }
    log_success "Migrations applied"

    # Run integration tests
    log_info "Running integration tests..."
    export API_BASE_URL="http://localhost:3001"
    # Use CI config in tests so PG* env vars are respected
    export CI=true
    export PGHOST="localhost"
    export PGPORT="5432"
    export PGDATABASE="test_db"
    export PGUSER="test_user"
    export PGPASSWORD="test_password"

    if pnpm vitest run --config vitest.integration.config.ts; then
        log_success "All integration tests passed!"
        exit 0
    else
        log_error "Integration tests failed"
        ${DOCKER_COMPOSE} -f docker-compose.integration.yml logs kaggle-data-api
        exit 1
    fi
}

main
