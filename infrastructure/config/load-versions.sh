#!/usr/bin/env bash

# Version Loading Helper
# Source this file to load versions from versions.yaml
#
# Usage:
#   source "$(dirname "$0")/../../config/load-versions.sh"
#   echo "PostgreSQL version: $POSTGRESQL_VERSION"

set -euo pipefail

VERSIONS_FILE="${VERSIONS_FILE:-$(dirname "${BASH_SOURCE[0]}")/versions.yaml}"

# Check if yq is available for YAML parsing
if command -v yq >/dev/null 2>&1; then
    # Use yq for parsing (preferred method)
    export POSTGRESQL_VERSION=$(yq eval '.bitnami.postgresql.chart_version' "$VERSIONS_FILE")
    export REDIS_VERSION=$(yq eval '.bitnami.redis.chart_version' "$VERSIONS_FILE")
    export INGRESS_NGINX_VERSION=$(yq eval '.kubernetes.ingress_nginx.version' "$VERSIONS_FILE")
    export INGRESS_NGINX_MANIFEST=$(yq eval '.kubernetes.ingress_nginx.manifest_url' "$VERSIONS_FILE")
    export KIND_NODE_IMAGE=$(yq eval '.kubernetes.kind.node_image' "$VERSIONS_FILE")
    export BUSYBOX_IMAGE=$(yq eval '.images.busybox' "$VERSIONS_FILE")
else
    # Fallback: Use grep and sed (works without yq)
    # Note: This is less robust but covers basic use cases

    # Extract PostgreSQL version
    export POSTGRESQL_VERSION=$(grep -A1 "postgresql:" "$VERSIONS_FILE" | grep "chart_version:" | sed -E 's/.*chart_version: *([^ #]+).*/\1/')

    # Extract Redis version
    export REDIS_VERSION=$(grep -A1 "redis:" "$VERSIONS_FILE" | grep "chart_version:" | sed -E 's/.*chart_version: *([^ #]+).*/\1/')

    # Extract Ingress Nginx version
    export INGRESS_NGINX_VERSION=$(grep -A2 "ingress_nginx:" "$VERSIONS_FILE" | grep "version:" | sed -E 's/.*version: *([^ #]+).*/\1/')

    # Extract Ingress Nginx manifest URL
    export INGRESS_NGINX_MANIFEST=$(grep -A2 "ingress_nginx:" "$VERSIONS_FILE" | grep "manifest_url:" | sed -E 's/.*manifest_url: *(.*)/\1/')

    # Extract Kind node image
    export KIND_NODE_IMAGE=$(grep "node_image:" "$VERSIONS_FILE" | sed -E 's/.*node_image: *([^ #]+).*/\1/')

    # Extract Busybox image
    export BUSYBOX_IMAGE=$(grep "busybox:" "$VERSIONS_FILE" | sed -E 's/.*busybox: *([^ #]+).*/\1/')
fi

# Validate that required versions were loaded
if [ -z "$POSTGRESQL_VERSION" ] || [ -z "$REDIS_VERSION" ]; then
    echo "Error: Failed to load versions from $VERSIONS_FILE" >&2
    exit 1
fi

# Export a flag to indicate versions are loaded
export VERSIONS_LOADED=1
