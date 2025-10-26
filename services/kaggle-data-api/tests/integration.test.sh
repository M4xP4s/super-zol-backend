#!/usr/bin/env bash

# Integration tests for kaggle-data-api service
# Tests the complete deployment in Kubernetes with PostgreSQL

set -euo pipefail

NAMESPACE="${NAMESPACE:-super-zol}"
SERVICE_NAME="kaggle-data-api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((TESTS_FAILED++))
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

run_test() {
    local test_name="$1"
    local test_cmd="$2"

    ((TESTS_RUN++))
    log_info "Running: $test_name"

    if eval "$test_cmd" > /dev/null 2>&1; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test resources..."
    kubectl port-forward -n "${NAMESPACE}" svc/kaggle-data-api 3001:80 >/dev/null 2>&1 &
    PF_PID=$!
    sleep 1
    kill $PF_PID 2>/dev/null || true
}

trap cleanup EXIT

# Main test execution
main() {
    echo "========================================"
    echo "Kaggle Data API Integration Tests"
    echo "========================================"
    echo ""
    echo "Namespace: ${NAMESPACE}"
    echo "Service: ${SERVICE_NAME}"
    echo ""

    # Step 1: Build and push Docker image
    log_step "Building Docker image..."
    if cd "${PROJECT_ROOT}" && pnpm nx build kaggle-data-api; then
        log_success "Service built successfully"
    else
        log_error "Failed to build service"
        exit 1
    fi

    if docker build -t kaggle-data-api:local -f services/kaggle-data-api/Dockerfile .; then
        log_success "Docker image built successfully"
    else
        log_error "Failed to build Docker image"
        exit 1
    fi

    # Load image into kind cluster
    log_step "Loading image into kind cluster..."
    if kind load docker-image kaggle-data-api:local --name super-zol; then
        log_success "Image loaded into kind cluster"
    else
        log_error "Failed to load image into kind"
        exit 1
    fi

    # Step 2: Apply database migrations
    log_step "Applying database migrations..."
    kubectl apply -f "${SCRIPT_DIR}/../helm/migrations/migration-configmap.yaml" -n "${NAMESPACE}"
    kubectl apply -f "${SCRIPT_DIR}/../helm/migrations/migration-job.yaml" -n "${NAMESPACE}"

    # Wait for migration job to complete
    log_info "Waiting for migrations to complete..."
    if kubectl wait --for=condition=complete --timeout=60s job/kaggle-data-api-migrations -n "${NAMESPACE}"; then
        log_success "Database migrations completed"
    else
        log_error "Database migrations failed"
        kubectl logs -n "${NAMESPACE}" job/kaggle-data-api-migrations
        exit 1
    fi

    # Step 3: Deploy service with Helm
    log_step "Deploying service with Helm..."
    helm upgrade --install kaggle-data-api "${SCRIPT_DIR}/../helm" \
        -f "${SCRIPT_DIR}/../helm/values-local.yaml" \
        -n "${NAMESPACE}" \
        --set image.tag=local \
        --wait --timeout 2m

    if [ $? -eq 0 ]; then
        log_success "Service deployed successfully"
    else
        log_error "Failed to deploy service"
        exit 1
    fi

    # Step 4: Wait for pods to be ready
    log_step "Waiting for pods to be ready..."
    if kubectl wait --for=condition=ready --timeout=60s pod -l app=kaggle-data-api -n "${NAMESPACE}"; then
        log_success "Pods are ready"
    else
        log_error "Pods failed to become ready"
        kubectl get pods -n "${NAMESPACE}" -l app=kaggle-data-api
        kubectl describe pod -n "${NAMESPACE}" -l app=kaggle-data-api
        exit 1
    fi

    # Step 5: Port forward for testing
    log_step "Setting up port forward..."
    kubectl port-forward -n "${NAMESPACE}" svc/kaggle-data-api 3001:80 >/dev/null 2>&1 &
    PF_PID=$!
    sleep 3  # Give port-forward time to establish

    # Step 6: Run API tests
    echo ""
    log_step "Running API endpoint tests..."

    # Test: Health check
    run_test "GET /health returns 200" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health | grep -q 200"

    # Test: Liveness probe
    run_test "GET /health/live returns 200" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health/live | grep -q 200"

    # Test: Readiness probe (should check database)
    run_test "GET /health/ready returns 200" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/health/ready | grep -q 200"

    # Test: Readiness probe returns database status
    log_info "Testing readiness probe database check..."
    READY_RESPONSE=$(curl -s http://localhost:3001/health/ready)
    if echo "$READY_RESPONSE" | grep -q '"database":"healthy"'; then
        log_success "Readiness probe reports healthy database"
    else
        log_error "Readiness probe does not report healthy database"
        echo "Response: $READY_RESPONSE"
    fi

    # Test: Root endpoint
    run_test "GET / returns API info" \
        "curl -s http://localhost:3001/ | grep -q 'Kaggle Data API'"

    # Test: API info endpoint
    run_test "GET /v1/info returns version" \
        "curl -s http://localhost:3001/v1/info | grep -q 'version'"

    # Test: Swagger UI
    run_test "GET /docs returns Swagger UI" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/docs | grep -q 200"

    # Step 7: Test database integration
    echo ""
    log_step "Running database integration tests..."

    # Test: GET /datasets returns data
    log_info "Testing GET /datasets..."
    DATASETS_RESPONSE=$(curl -s http://localhost:3001/datasets)

    if echo "$DATASETS_RESPONSE" | grep -q '"datasets"'; then
        log_success "GET /datasets returns datasets array"
    else
        log_error "GET /datasets does not return datasets array"
        echo "Response: $DATASETS_RESPONSE"
    fi

    # Test: Dataset count
    log_info "Testing dataset count..."
    DATASET_COUNT=$(echo "$DATASETS_RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    if [ "$DATASET_COUNT" -eq 10 ]; then
        log_success "Database contains 10 mock datasets"
    else
        log_error "Expected 10 datasets, found: $DATASET_COUNT"
    fi

    # Test: Verify specific dataset
    log_info "Testing GET /datasets/1..."
    DATASET_RESPONSE=$(curl -s http://localhost:3001/datasets/1)
    if echo "$DATASET_RESPONSE" | grep -q '"name":"titanic"'; then
        log_success "GET /datasets/1 returns Titanic dataset"
    else
        log_error "GET /datasets/1 does not return expected data"
        echo "Response: $DATASET_RESPONSE"
    fi

    # Test: Pagination
    log_info "Testing pagination..."
    PAGINATED_RESPONSE=$(curl -s "http://localhost:3001/datasets?limit=5&offset=0")
    PAGINATED_COUNT=$(echo "$PAGINATED_RESPONSE" | grep -o '"datasets":\[[^]]*' | grep -o '\{' | wc -l | xargs)
    if [ "$PAGINATED_COUNT" -le 5 ]; then
        log_success "Pagination works correctly (limit=5)"
    else
        log_error "Pagination returned more than 5 results"
    fi

    # Test: Not found
    run_test "GET /datasets/9999 returns 404" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/datasets/9999 | grep -q 404"

    # Step 8: Test CORS headers
    echo ""
    log_step "Testing CORS headers..."

    CORS_RESPONSE=$(curl -s -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        -I http://localhost:3001/)

    if echo "$CORS_RESPONSE" | grep -qi "access-control-allow-origin"; then
        log_success "CORS headers present"
    else
        log_error "CORS headers missing"
    fi

    # Step 9: Test rate limiting
    echo ""
    log_step "Testing rate limiting..."

    # Make multiple requests quickly
    for i in {1..5}; do
        curl -s http://localhost:3001/ >/dev/null
    done

    RATE_LIMIT_RESPONSE=$(curl -s -I http://localhost:3001/)
    if echo "$RATE_LIMIT_RESPONSE" | grep -qi "x-ratelimit"; then
        log_success "Rate limit headers present"
    else
        log_error "Rate limit headers missing"
    fi

    # Kill port-forward
    kill $PF_PID 2>/dev/null || true

    # Step 10: Check pod logs for errors
    echo ""
    log_step "Checking pod logs for errors..."

    POD_NAME=$(kubectl get pods -n "${NAMESPACE}" -l app=kaggle-data-api -o jsonpath='{.items[0].metadata.name}')
    LOG_ERRORS=$(kubectl logs -n "${NAMESPACE}" "$POD_NAME" --tail=50 | grep -i "error" | wc -l | xargs)

    if [ "$LOG_ERRORS" -eq 0 ]; then
        log_success "No errors in pod logs"
    else
        log_error "Found $LOG_ERRORS errors in pod logs"
        kubectl logs -n "${NAMESPACE}" "$POD_NAME" --tail=50 | grep -i "error"
    fi

    # Print summary
    echo ""
    echo "========================================"
    echo "Test Summary"
    echo "========================================"
    echo "Total tests run: $TESTS_RUN"
    echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All integration tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main
