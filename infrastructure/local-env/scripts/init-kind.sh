#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLUSTER_NAME="${CLUSTER_NAME:-super-zol}"
CONFIG_FILE="${SCRIPT_DIR}/../kind-config.yaml"

echo "🚀 Creating kind cluster: ${CLUSTER_NAME}"

# Check if cluster already exists
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "⚠️  Cluster ${CLUSTER_NAME} already exists"
    read -p "Do you want to delete and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting existing cluster..."
        kind delete cluster --name "${CLUSTER_NAME}"
    else
        echo "✅ Using existing cluster"
        exit 0
    fi
fi

# Create cluster
echo "📦 Creating new cluster with config: ${CONFIG_FILE}"
kind create cluster --config "${CONFIG_FILE}"

# Wait for cluster to be ready
echo "⏳ Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=180s

echo "✅ Cluster ${CLUSTER_NAME} is ready!"
kubectl cluster-info --context "kind-${CLUSTER_NAME}"
