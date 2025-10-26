# Local Environment Integration Tests

Comprehensive integration test suite for the local Kubernetes development environment.

## Overview

This test suite validates the complete local development stack:

- Docker and required tools
- Kind cluster setup
- Ingress controller
- PostgreSQL database
- Redis cache
- Service DNS resolution
- Helm chart validation

## Usage

### Running Tests

```bash
# From the local-env directory
make test

# Or run directly
./tests/integration.test.sh

# With custom cluster/namespace
CLUSTER_NAME=my-cluster NAMESPACE=my-namespace ./tests/integration.test.sh
```

### Prerequisites

The tests check for required tools automatically:

- Docker (running)
- kind
- kubectl
- helm

### Expected Output

```
========================================
Local Environment Integration Tests
========================================

Cluster: super-zol
Namespace: super-zol

[✓] docker is installed
[✓] kind is installed
[✓] helm is installed
[✓] kubectl is installed
[✓] Docker is running
...

========================================
Test Summary
========================================
Total tests run: 15
Tests passed: 15
Tests failed: 0

✓ All tests passed!
```

## Idempotency

The test suite is fully **idempotent** - it can be run multiple times without side effects:

### Cleanup Mechanisms

1. **Pre-run Cleanup**: Cleans up leftover test resources before starting
2. **Post-test Cleanup**: Each test cleans up its own resources
3. **Exit Trap**: Ensures cleanup even if tests fail or are interrupted

### Test Resource Management

- **DNS Test Pod**: Automatically deleted before and after each run
- **Wait Flags**: Uses `--wait=true` to ensure resources are fully deleted
- **Ignore Not Found**: Uses `--ignore-not-found=true` to handle missing resources gracefully

### Running Multiple Times

```bash
# Run tests multiple times - all should pass
./tests/integration.test.sh
./tests/integration.test.sh
./tests/integration.test.sh
```

## Test Coverage

### Infrastructure Tests

- ✅ Docker daemon accessibility
- ✅ Kind cluster existence and health
- ✅ Node readiness (all 3 nodes)
- ✅ Ingress controller deployment
- ✅ Namespace existence

### Database Tests

- ✅ PostgreSQL StatefulSet deployment
- ✅ PostgreSQL pod running and ready
- ✅ PostgreSQL connectivity (using credentials)
- ✅ Redis StatefulSet deployment
- ✅ Redis pod running and ready
- ✅ Redis connectivity (using credentials)

### Network Tests

- ✅ Service DNS resolution (cluster.local)
- ✅ Cross-namespace service discovery

### Chart Validation

- ✅ Helm library charts lint without errors
- ✅ Chart dependencies are valid
- ✅ Template rendering succeeds

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

## Troubleshooting

### Tests Fail on First Run

This is expected if infrastructure isn't deployed yet:

```bash
# Deploy infrastructure first
make deploy
make init-postgres
make init-redis

# Then run tests
make test
```

### DNS Test Failures

If DNS tests fail due to pod conflicts:

```bash
# Manual cleanup
kubectl delete pod -n super-zol dns-test --ignore-not-found

# Tests now handle this automatically
```

### Slow Test Execution

- Timeout values: 30s for pod operations
- DNS test includes 2s sleep for cleanup stabilization
- Total test runtime: ~30-60 seconds for full environment

## Adding New Tests

Follow the existing pattern:

```bash
test_my_new_feature() {
    log_info "Testing: My new feature"

    # Clean up any test resources first
    cleanup_my_resources || true

    # Perform test
    if my_test_command; then
        log_success "My new feature works"
        cleanup_my_resources  # Clean up after success
        return 0
    else
        log_error "My new feature failed"
        cleanup_my_resources  # Clean up after failure too
        return 1
    fi
}
```

### Best Practices

1. **Always clean up**: Before and after each test
2. **Use --ignore-not-found**: Handle missing resources gracefully
3. **Use --wait flags**: Ensure operations complete
4. **Set timeouts**: Prevent hanging on failures
5. **Return meaningful exit codes**: 0 for success, 1 for failure

## CI Integration

These tests are designed to run in CI pipelines:

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  run: |
    make deploy
    make init-all
    make test
```

The idempotent nature ensures tests can be re-run during debugging without manual cleanup.
