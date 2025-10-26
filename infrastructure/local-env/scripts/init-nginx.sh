#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load centralized version configuration
source "${SCRIPT_DIR}/../../config/load-versions.sh"

echo "🌐 Installing nginx-ingress controller (version ${INGRESS_NGINX_VERSION})..."

# Install nginx ingress controller using kubectl with pinned version
kubectl apply -f "${INGRESS_NGINX_MANIFEST}"

# Wait for ingress controller to be ready
echo "⏳ Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

echo "✅ Nginx ingress controller is ready!"
kubectl get pods -n ingress-nginx
