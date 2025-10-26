#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="${NAMESPACE:-monitoring}"

echo "📊 Deploying monitoring stack (Prometheus + Grafana)..."
echo "⚠️  This is an optional component and may require additional configuration"

# Create monitoring namespace
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# Add prometheus-community repo
if ! helm repo list | grep -q "^prometheus-community"; then
    echo "📦 Adding prometheus-community helm repository..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
fi

# Update helm repos
helm repo update

# Install kube-prometheus-stack
echo "📦 Installing kube-prometheus-stack..."
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
    --namespace "${NAMESPACE}" \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
    --set grafana.adminPassword=admin \
    --wait || {
        echo "⚠️  Monitoring installation failed or timed out"
        echo "This is optional - you can continue without monitoring"
        exit 0
    }

echo "✅ Monitoring stack deployed!"
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/kube-prometheus-stack-grafana 3000:80"
echo "  Username: admin"
echo "  Password: admin"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/kube-prometheus-stack-prometheus 9090:9090"
