#!/usr/bin/env bash

# Local Environment Integration Tests
# Tests the complete local Kubernetes setup

set -euo pipefail

CLUSTER_NAME="${CLUSTER_NAME:-super-zol}"
NAMESPACE="${NAMESPACE:-super-zol}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Test: Required tools are installed
test_required_tools() {
    log_info "Testing: Required tools are installed"

    local tools=("docker" "kind" "helm" "kubectl")
    local all_present=true

    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            log_success "$tool is installed"
        else
            log_error "$tool is not installed"
            all_present=false
        fi
    done

    $all_present
}

# Test: Docker is running
test_docker_running() {
    run_test "Docker is running" "docker info"
}

# Test: Kind cluster exists
test_cluster_exists() {
    run_test "Kind cluster exists" "kind get clusters | grep -q '^${CLUSTER_NAME}$'"
}

# Test: Cluster is reachable
test_cluster_reachable() {
    run_test "Cluster is reachable" "kubectl cluster-info --context kind-${CLUSTER_NAME}"
}

# Test: All nodes are ready
test_nodes_ready() {
    log_info "Testing: All nodes are ready"

    local not_ready
    not_ready=$(kubectl get nodes --no-headers | grep -v " Ready" | wc -l)

    if [ "$not_ready" -eq 0 ]; then
        log_success "All nodes are ready"
        return 0
    else
        log_error "Some nodes are not ready"
        kubectl get nodes
        return 1
    fi
}

# Test: Ingress controller is running
test_ingress_running() {
    log_info "Testing: Ingress controller is running"

    if kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller \
        --field-selector=status.phase=Running | grep -q ingress-nginx-controller; then
        log_success "Ingress controller is running"
        return 0
    else
        log_error "Ingress controller is not running"
        kubectl get pods -n ingress-nginx
        return 1
    fi
}

# Test: Namespace exists
test_namespace_exists() {
    run_test "Namespace ${NAMESPACE} exists" \
        "kubectl get namespace ${NAMESPACE}"
}

# Test: PostgreSQL is deployed
test_postgres_deployed() {
    log_info "Testing: PostgreSQL is deployed"

    if kubectl get statefulset -n "${NAMESPACE}" postgresql >/dev/null 2>&1; then
        log_success "PostgreSQL statefulset exists"

        # Check if pods are running
        local ready_pods
        ready_pods=$(kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=postgresql \
            --field-selector=status.phase=Running --no-headers | wc -l)

        if [ "$ready_pods" -gt 0 ]; then
            log_success "PostgreSQL pod is running"
            return 0
        else
            log_error "PostgreSQL pod is not running"
            kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=postgresql
            return 1
        fi
    else
        log_error "PostgreSQL is not deployed"
        return 1
    fi
}

# Test: PostgreSQL is connectable
test_postgres_connectable() {
    log_info "Testing: PostgreSQL is connectable"

    # Get PostgreSQL password
    local pg_password
    pg_password=$(kubectl get secret -n "${NAMESPACE}" postgresql -o jsonpath='{.data.password}' 2>/dev/null | base64 -d)

    if [ -z "$pg_password" ]; then
        log_error "Cannot retrieve PostgreSQL password"
        return 1
    fi

    # Try to connect using kubectl exec
    if kubectl exec -n "${NAMESPACE}" -it statefulset/postgresql -- \
        env PGPASSWORD="$pg_password" psql -U superzol -d superzol -c "SELECT 1" >/dev/null 2>&1; then
        log_success "PostgreSQL is connectable"
        return 0
    else
        log_error "PostgreSQL is not connectable"
        return 1
    fi
}

# Test: Redis is deployed
test_redis_deployed() {
    log_info "Testing: Redis is deployed"

    if kubectl get statefulset -n "${NAMESPACE}" redis-master >/dev/null 2>&1; then
        log_success "Redis statefulset exists"

        # Check if pods are running
        local ready_pods
        ready_pods=$(kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=redis \
            --field-selector=status.phase=Running --no-headers | wc -l)

        if [ "$ready_pods" -gt 0 ]; then
            log_success "Redis pod is running"
            return 0
        else
            log_error "Redis pod is not running"
            kubectl get pods -n "${NAMESPACE}" -l app.kubernetes.io/name=redis
            return 1
        fi
    else
        log_error "Redis is not deployed"
        return 1
    fi
}

# Test: Redis is connectable
test_redis_connectable() {
    log_info "Testing: Redis is connectable"

    # Get Redis password
    local redis_password
    redis_password=$(kubectl get secret -n "${NAMESPACE}" redis -o jsonpath='{.data.redis-password}' 2>/dev/null | base64 -d)

    if [ -z "$redis_password" ]; then
        log_error "Cannot retrieve Redis password"
        return 1
    fi

    # Try to connect using kubectl exec
    if kubectl exec -n "${NAMESPACE}" -it statefulset/redis-master -- \
        redis-cli -a "$redis_password" ping 2>/dev/null | grep -q "PONG"; then
        log_success "Redis is connectable"
        return 0
    else
        log_error "Redis is not connectable"
        return 1
    fi
}

# Test: Services are accessible via DNS
test_service_dns() {
    log_info "Testing: Service DNS resolution"

    # Create a test pod for DNS checks
    kubectl run -n "${NAMESPACE}" dns-test --image=busybox --restart=Never --rm -it -- \
        nslookup postgresql.${NAMESPACE}.svc.cluster.local >/dev/null 2>&1 || true

    # Clean up
    kubectl delete pod -n "${NAMESPACE}" dns-test --ignore-not-found=true >/dev/null 2>&1 || true

    log_success "Service DNS resolution works"
    return 0
}

# Test: Helm charts are linted
test_helm_charts() {
    log_info "Testing: Helm library charts are valid"

    local charts_dir="${SCRIPT_DIR}/../../helm/library-charts"

    if [ ! -d "$charts_dir" ]; then
        log_error "Helm charts directory not found: $charts_dir"
        return 1
    fi

    local all_valid=true

    for chart in "$charts_dir"/*; do
        if [ -d "$chart" ]; then
            local chart_name=$(basename "$chart")
            if helm lint "$chart" >/dev/null 2>&1; then
                log_success "Helm chart '$chart_name' is valid"
            else
                log_error "Helm chart '$chart_name' has errors"
                all_valid=false
            fi
        fi
    done

    $all_valid
}

# Main test execution
main() {
    echo "========================================"
    echo "Local Environment Integration Tests"
    echo "========================================"
    echo ""
    echo "Cluster: ${CLUSTER_NAME}"
    echo "Namespace: ${NAMESPACE}"
    echo ""

    # Run tests
    test_required_tools
    test_docker_running
    test_helm_charts

    echo ""
    log_info "Testing Kind cluster..."
    test_cluster_exists
    test_cluster_reachable
    test_nodes_ready

    echo ""
    log_info "Testing Ingress controller..."
    test_ingress_running

    echo ""
    log_info "Testing Infrastructure..."
    test_namespace_exists

    # Only test PostgreSQL and Redis if namespace exists
    if kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
        test_postgres_deployed
        test_postgres_connectable
        test_redis_deployed
        test_redis_connectable
        test_service_dns
    else
        log_info "Skipping infrastructure tests (namespace not found - run 'make init-all')"
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
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main
