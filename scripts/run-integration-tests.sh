#!/usr/bin/env bash

# Integration Tests with Docker Compose
# Simple script to run integration tests using docker-compose

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

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
    docker-compose -f docker-compose.integration.yml down -v 2>/dev/null || true
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
    docker-compose -f docker-compose.integration.yml up -d || {
        log_error "Failed to start docker-compose services"
        exit 1
    }

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    timeout 60 bash -c 'until docker-compose -f docker-compose.integration.yml ps | grep -q "healthy.*healthy"; do sleep 2; done' || {
        log_error "Services failed to become healthy"
        docker-compose -f docker-compose.integration.yml ps
        docker-compose -f docker-compose.integration.yml logs
        exit 1
    }
    log_success "Services are healthy"

    # Apply migrations
    log_info "Applying database migrations..."
    docker-compose -f docker-compose.integration.yml exec -T postgres psql -U test_user -d test_db < services/kaggle-data-api/helm/migrations/001-create-datasets-table.sql || {
        log_error "Failed to apply migrations"
        exit 1
    }
    docker-compose -f docker-compose.integration.yml exec -T postgres psql -U test_user -d test_db < services/kaggle-data-api/helm/migrations/002-seed-mock-data.sql || {
        log_error "Failed to seed mock data"
        exit 1
    }
    log_success "Migrations applied"

    # Run integration tests
    log_info "Running integration tests..."
    export API_BASE_URL="http://localhost:3001"
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
        docker-compose -f docker-compose.integration.yml logs kaggle-data-api
        exit 1
    fi
}

main
