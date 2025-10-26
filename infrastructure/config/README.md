# Infrastructure Configuration

Centralized configuration management for all infrastructure dependencies.

## Overview

This directory contains version pinning and configuration management for:

- Kubernetes cluster components (Kind, Ingress)
- Helm charts (PostgreSQL, Redis, etc.)
- Container images (Busybox, application images)
- Monitoring tools (Prometheus, Grafana - TBD)

## Files

### versions.yaml

Central version registry for all infrastructure components.

**Structure:**

```yaml
kubernetes:
  kind:
    node_image: kindest/node:v1.31.0
  ingress_nginx:
    version: v1.11.2
    manifest_url: https://...

bitnami:
  postgresql:
    chart_version: 15.5.38
  redis:
    chart_version: 20.5.0

images:
  busybox: busybox:1.36
```

### load-versions.sh

Shell script helper to load versions from `versions.yaml` into environment variables.

**Exported Variables:**

- `$POSTGRESQL_VERSION` - PostgreSQL Helm chart version
- `$REDIS_VERSION` - Redis Helm chart version
- `$INGRESS_NGINX_VERSION` - Ingress-nginx controller version
- `$INGRESS_NGINX_MANIFEST` - Ingress-nginx manifest URL
- `$KIND_NODE_IMAGE` - Kind node image tag
- `$BUSYBOX_IMAGE` - Busybox container image
- `$VERSIONS_LOADED` - Flag indicating versions are loaded (value: 1)

## Usage

### In Shell Scripts

```bash
#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load versions
source "${SCRIPT_DIR}/../../config/load-versions.sh"

# Use version variables
echo "Deploying PostgreSQL version: ${POSTGRESQL_VERSION}"
helm upgrade --install postgresql bitnami/postgresql \
    --version "${POSTGRESQL_VERSION}" \
    ...
```

### In Makefiles

```makefile
# Load versions as Make variables
include infrastructure/config/versions.mk

deploy-postgres:
	helm install postgresql bitnami/postgresql --version $(POSTGRESQL_VERSION)
```

### Manual Version Check

```bash
# Source the loader
source infrastructure/config/load-versions.sh

# Check versions
echo "PostgreSQL: $POSTGRESQL_VERSION"
echo "Redis: $REDIS_VERSION"
echo "Ingress: $INGRESS_NGINX_VERSION"
```

## Version Update Process

### 1. Check for Updates

```bash
# Check Helm chart versions
helm search repo bitnami/postgresql --versions | head
helm search repo bitnami/redis --versions | head

# Check ingress-nginx releases
# https://github.com/kubernetes/ingress-nginx/releases
```

### 2. Update versions.yaml

Edit `versions.yaml` with new version numbers:

```yaml
bitnami:
  postgresql:
    chart_version: 15.6.0 # Updated from 15.5.38
```

### 3. Test in Local Environment

```bash
# Test the upgrade
cd infrastructure/local-env
make clean
make deploy
make init-postgres
make test
```

### 4. Document Changes

Update `CHANGELOG.md` with version changes:

```markdown
### Changed

- PostgreSQL Helm chart upgraded from 15.5.38 to 15.6.0
  - See: https://github.com/bitnami/charts/releases/tag/postgresql-15.6.0
  - Breaking changes: None
  - Security fixes: CVE-2024-XXXXX
```

### 5. Commit and Tag

```bash
git add infrastructure/config/versions.yaml CHANGELOG.md
git commit -m "chore(infra): upgrade PostgreSQL chart to 15.6.0"

# Optional: Create version tag for infrastructure
git tag infra-v0.2.0
```

## Version Pinning Philosophy

### Why Pin Versions?

1. **Reproducibility**: Ensure consistent deployments across environments
2. **Stability**: Prevent unexpected breaking changes from automatic updates
3. **Security**: Control when and how security updates are applied
4. **Testing**: Validate upgrades in lower environments before production

### What to Pin

- ✅ Helm chart versions (exact version numbers)
- ✅ Container image tags (specific versions, not `latest`)
- ✅ Kubernetes manifest URLs (specific release tags)
- ✅ CLI tool versions (in documentation)

### What NOT to Pin

- ❌ Development dependencies that auto-update safely
- ❌ Internal library versions (managed by package managers)

## Dependencies

### Required

- **bash** - Shell script execution
- **kubectl** - Kubernetes cluster management
- **helm** - Helm chart management

### Optional

- **yq** - YAML parsing (recommended for robust parsing)
  - Install: `brew install yq` (macOS) or `snap install yq` (Linux)
  - Fallback: Uses `grep` + `sed` if `yq` not available

## Troubleshooting

### Version Loading Fails

```bash
# Check if versions.yaml exists
ls -la infrastructure/config/versions.yaml

# Test version loading
source infrastructure/config/load-versions.sh
echo $POSTGRESQL_VERSION

# If empty, check YAML syntax
cat infrastructure/config/versions.yaml | yq eval .
```

### Version Mismatch

```bash
# Check what's actually deployed
helm list -A

# Compare with versions.yaml
source infrastructure/config/load-versions.sh
echo "Expected PostgreSQL: $POSTGRESQL_VERSION"
helm list -n super-zol -o json | jq -r '.[] | select(.name=="postgresql") | .app_version'
```

### Manual Override

You can override versions for testing:

```bash
# Override for single command
POSTGRESQL_VERSION=15.6.0 ./scripts/init-postgres.sh

# Override for session
export POSTGRESQL_VERSION=15.6.0
./scripts/init-postgres.sh
```

## Future Enhancements

- [ ] Add version compatibility matrix
- [ ] Automated version update checker (Renovate/Dependabot)
- [ ] Version diff tool for comparing environments
- [ ] Helm chart values schema validation
- [ ] Automated rollback on failed upgrades
