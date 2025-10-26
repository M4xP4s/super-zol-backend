#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAMESPACE="${NAMESPACE:-super-zol}"
VALUES_FILE="${SCRIPT_DIR}/../helm-values/redis.yaml"

# Load centralized version configuration
source "${SCRIPT_DIR}/../../config/load-versions.sh"

echo "📮 Deploying Redis (version ${REDIS_VERSION})..."

# Create namespace if it doesn't exist
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# Add bitnami repo if not exists
if ! helm repo list | grep -q "^bitnami"; then
    echo "📦 Adding bitnami helm repository..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
fi

# Update helm repos
helm repo update

# Install or upgrade Redis
echo "📦 Installing Redis with Helm..."
helm upgrade --install redis bitnami/redis \
    --version "${REDIS_VERSION}" \
    -f "${VALUES_FILE}" \
    -n "${NAMESPACE}" \
    --wait

echo "✅ Redis deployed!"
echo ""
echo "Connection details:"
echo "  Host: redis-master.${NAMESPACE}.svc.cluster.local"
echo "  Port: 6379"
echo "  Password: (stored in secret)"
echo ""
echo "To get the password:"
echo "  kubectl get secret -n ${NAMESPACE} redis -o jsonpath='{.data.redis-password}' | base64 -d"
