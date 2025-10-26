#!/usr/bin/env bash

# Integration Tests Runner
# Automatically sets up Kind cluster and services if not running
# Then runs integration tests

set -euo pipefail

NAMESPACE="${NAMESPACE:-super-zol}"
SERVICE_NAME="kaggle-data-api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if Kind cluster exists
check_kind_cluster() {
    if kind get clusters 2>/dev/null | grep -q "super-zol"; then
        log_success "Kind cluster 'super-zol' exists"
        return 0
    else
        log_warning "Kind cluster 'super-zol' not found"
        return 1
    fi
}

# Create Kind cluster
create_kind_cluster() {
    log_info "Creating Kind cluster..."
    cd "${PROJECT_ROOT}/infrastructure/local-env"
    make deploy
    log_success "Kind cluster created"
}

# Check if namespace exists
check_namespace() {
    if kubectl get namespace "${NAMESPACE}" &>/dev/null; then
        log_success "Namespace '${NAMESPACE}' exists"
        return 0
    else
        log_warning "Namespace '${NAMESPACE}' not found"
        return 1
    fi
}

# Create namespace
create_namespace() {
    log_info "Creating namespace '${NAMESPACE}'..."
    kubectl create namespace "${NAMESPACE}"
    log_success "Namespace created"
}

# Check if PostgreSQL is deployed
check_postgres() {
    if kubectl get statefulset postgresql -n "${NAMESPACE}" &>/dev/null; then
        # Check if ready
        READY=$(kubectl get statefulset postgresql -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [ "$READY" -gt 0 ]; then
            log_success "PostgreSQL is running"
            return 0
        else
            log_warning "PostgreSQL exists but not ready"
            return 1
        fi
    else
        log_warning "PostgreSQL not deployed"
        return 1
    fi
}

# Deploy PostgreSQL
deploy_postgres() {
    log_info "Deploying PostgreSQL..."
    cd "${PROJECT_ROOT}/infrastructure/local-env"
    make init-postgres

    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready --timeout=120s pod -l app.kubernetes.io/name=postgresql -n "${NAMESPACE}" || {
        log_error "PostgreSQL failed to become ready"
        kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=postgresql
        return 1
    }
    log_success "PostgreSQL deployed and ready"
}

# Check if kaggle-data-api is deployed
check_api_service() {
    if kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}" &>/dev/null; then
        READY=$(kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        if [ "$READY" -gt 0 ]; then
            log_success "kaggle-data-api is running"
            return 0
        else
            log_warning "kaggle-data-api exists but not ready"
            return 1
        fi
    else
        log_warning "kaggle-data-api not deployed"
        return 1
    fi
}

# Build and deploy kaggle-data-api
deploy_api_service() {
    log_info "Building kaggle-data-api..."
    cd "${PROJECT_ROOT}"

    # Build the service
    pnpm nx build kaggle-data-api || {
        log_error "Failed to build kaggle-data-api"
        return 1
    }

    # Build Docker image
    log_info "Building Docker image..."
    docker build -t kaggle-data-api:local -f services/kaggle-data-api/Dockerfile . || {
        log_error "Failed to build Docker image"
        return 1
    }

    # Load image into Kind cluster
    log_info "Loading image into Kind cluster..."
    kind load docker-image kaggle-data-api:local --name super-zol || {
        log_error "Failed to load image into Kind"
        return 1
    }

    # Deploy with Helm
    log_info "Deploying with Helm..."
    cd "${PROJECT_ROOT}/services/kaggle-data-api"
    helm upgrade --install kaggle-data-api ./helm \
        -f ./helm/values-local.yaml \
        -n "${NAMESPACE}" \
        --set image.tag=local \
        --wait --timeout 3m || {
        log_error "Failed to deploy with Helm"
        return 1
    }

    log_success "kaggle-data-api deployed"
}

# Apply database migrations
apply_migrations() {
    log_info "Checking database migrations..."

    cd "${PROJECT_ROOT}/services/kaggle-data-api"

    # Check if migration job already completed
    if kubectl get job kaggle-data-api-migrations -n "${NAMESPACE}" &>/dev/null; then
        STATUS=$(kubectl get job kaggle-data-api-migrations -n "${NAMESPACE}" -o jsonpath='{.status.succeeded}' 2>/dev/null || echo "0")
        if [ "$STATUS" -gt 0 ]; then
            log_success "Database migrations already applied"
            return 0
        else
            log_info "Deleting failed migration job..."
            kubectl delete job kaggle-data-api-migrations -n "${NAMESPACE}"
        fi
    fi

    log_info "Applying database migrations..."
    kubectl apply -f helm/migrations/migration-configmap.yaml -n "${NAMESPACE}"
    kubectl apply -f helm/migrations/migration-job.yaml -n "${NAMESPACE}"

    # Wait for migration job to complete
    kubectl wait --for=condition=complete --timeout=60s job/kaggle-data-api-migrations -n "${NAMESPACE}" || {
        log_error "Database migrations failed"
        kubectl logs -n "${NAMESPACE}" job/kaggle-data-api-migrations --tail=50
        return 1
    }

    log_success "Database migrations applied"
}

# Setup port forwarding
setup_port_forwarding() {
    log_info "Setting up port forwarding..."

    # Kill any existing port-forward processes
    pkill -f "kubectl port-forward.*${SERVICE_NAME}" 2>/dev/null || true
    pkill -f "kubectl port-forward.*postgresql" 2>/dev/null || true
    sleep 1

    # Port forward API service
    kubectl port-forward -n "${NAMESPACE}" svc/kaggle-data-api 3001:80 >/dev/null 2>&1 &
    API_PF_PID=$!
    echo $API_PF_PID > /tmp/integration-test-api-pf.pid

    # Port forward PostgreSQL
    kubectl port-forward -n "${NAMESPACE}" svc/postgresql 5432:5432 >/dev/null 2>&1 &
    DB_PF_PID=$!
    echo $DB_PF_PID > /tmp/integration-test-db-pf.pid

    # Wait for port forwards to be ready
    sleep 3

    # Verify API is accessible
    if curl -f http://localhost:3001/health/live >/dev/null 2>&1; then
        log_success "Port forwarding ready (API: 3001, PostgreSQL: 5432)"
    else
        log_warning "API port forwarding may not be ready, waiting longer..."
        sleep 5
        if curl -f http://localhost:3001/health/live >/dev/null 2>&1; then
            log_success "Port forwarding ready"
        else
            log_error "Failed to connect to API via port forward"
            return 1
        fi
    fi
}

# Cleanup port forwarding
cleanup_port_forwarding() {
    log_info "Cleaning up port forwarding..."

    if [ -f /tmp/integration-test-api-pf.pid ]; then
        kill $(cat /tmp/integration-test-api-pf.pid) 2>/dev/null || true
        rm /tmp/integration-test-api-pf.pid
    fi

    if [ -f /tmp/integration-test-db-pf.pid ]; then
        kill $(cat /tmp/integration-test-db-pf.pid) 2>/dev/null || true
        rm /tmp/integration-test-db-pf.pid
    fi

    pkill -f "kubectl port-forward.*${SERVICE_NAME}" 2>/dev/null || true
    pkill -f "kubectl port-forward.*postgresql" 2>/dev/null || true
}

# Trap cleanup on exit
trap cleanup_port_forwarding EXIT

# Main execution
main() {
    echo "========================================"
    echo "Integration Tests Setup & Execution"
    echo "========================================"
    echo ""

    # 1. Check/Create Kind cluster
    if ! check_kind_cluster; then
        create_kind_cluster
    fi

    # 2. Check/Create namespace
    if ! check_namespace; then
        create_namespace
    fi

    # 3. Check/Deploy PostgreSQL
    if ! check_postgres; then
        deploy_postgres
    fi

    # 4. Check/Deploy kaggle-data-api
    if ! check_api_service; then
        deploy_api_service
    fi

    # 5. Apply migrations
    apply_migrations

    # 6. Setup port forwarding
    setup_port_forwarding

    # 7. Run integration tests
    echo ""
    echo "========================================"
    echo "Running Integration Tests"
    echo "========================================"
    echo ""

    cd "${PROJECT_ROOT}"

    # Set environment variables for tests
    export API_BASE_URL="http://localhost:3001"
    export POSTGRES_HOST="localhost"
    export POSTGRES_PORT="5432"
    export POSTGRES_DB="kaggle_data"
    export POSTGRES_USER="postgres"
    export POSTGRES_PASSWORD="postgres"

    # Run tests
    if pnpm vitest run --config vitest.integration.config.ts; then
        echo ""
        log_success "All integration tests passed!"
        exit 0
    else
        echo ""
        log_error "Some integration tests failed"
        exit 1
    fi
}

# Run main function
main
