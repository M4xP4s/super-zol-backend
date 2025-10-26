#!/usr/bin/env bash

set -euo pipefail

echo "🌐 Installing nginx-ingress controller..."

# Install nginx ingress controller using kubectl
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
echo "⏳ Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

echo "✅ Nginx ingress controller is ready!"
kubectl get pods -n ingress-nginx
