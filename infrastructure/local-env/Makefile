.PHONY: help setup deploy clean init-postgres init-redis init-monitoring init-all clean-all reset-data logs-api logs-postgres logs-redis

# Default target
.DEFAULT_GOAL := help

# Cluster name
CLUSTER_NAME ?= super-zol
NAMESPACE ?= super-zol

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Install required tools (kind, helm, kubectl)
	@echo "🔧 Checking and installing required tools..."
	@command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Please install Docker first."; exit 1; }
	@command -v kind >/dev/null 2>&1 || { echo "📦 Installing kind..."; brew install kind || { echo "❌ Failed to install kind. Please install manually."; exit 1; }; }
	@command -v helm >/dev/null 2>&1 || { echo "📦 Installing helm..."; brew install helm || { echo "❌ Failed to install helm. Please install manually."; exit 1; }; }
	@command -v kubectl >/dev/null 2>&1 || { echo "📦 Installing kubectl..."; brew install kubectl || { echo "❌ Failed to install kubectl. Please install manually."; exit 1; }; }
	@echo "✅ All required tools are installed!"

deploy: ## Create kind cluster with ingress
	@echo "🚀 Creating kind cluster..."
	@./scripts/init-kind.sh
	@echo "🌐 Installing nginx ingress controller..."
	@./scripts/init-nginx.sh
	@echo "✅ Local environment deployed!"
	@echo "📝 Run 'make init-all' to install infrastructure components"

clean: ## Delete kind cluster
	@echo "🗑️  Deleting kind cluster..."
	@kind delete cluster --name $(CLUSTER_NAME) || true
	@echo "✅ Cluster deleted!"

init-postgres: ## Deploy PostgreSQL
	@echo "🐘 Deploying PostgreSQL..."
	@./scripts/init-postgres.sh
	@echo "✅ PostgreSQL deployed!"

init-redis: ## Deploy Redis
	@echo "📮 Deploying Redis..."
	@./scripts/init-redis.sh
	@echo "✅ Redis deployed!"

init-monitoring: ## Deploy monitoring stack (Prometheus + Grafana)
	@echo "📊 Deploying monitoring stack..."
	@./scripts/init-monitoring.sh || echo "⚠️  Monitoring setup is optional and may not be fully configured"
	@echo "✅ Monitoring stack deployed!"

init-kaggle-pvc: ## Create Kaggle data PVC
	@echo "💾 Creating Kaggle data PVC..."
	@kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@helm upgrade --install kaggle-data-pvc ../helm/infrastructure/kaggle-data-pvc \
		-f ../helm/infrastructure/kaggle-data-pvc/values-local.yaml \
		-n $(NAMESPACE) || echo "⚠️  PVC setup pending - will be created in Step 0.4"
	@echo "✅ Kaggle data PVC created!"

init-all: init-postgres init-redis ## Initialize all infrastructure components
	@echo "✅ All infrastructure components initialized!"

clean-all: clean ## Delete cluster and remove all data
	@echo "🗑️  Removing all data..."
	@docker volume prune -f || true
	@echo "✅ All data removed!"

reset-data: ## Clear Kaggle data PVC
	@echo "🗑️  Clearing Kaggle data..."
	@kubectl delete pvc -n $(NAMESPACE) -l app=kaggle-data || echo "⚠️  No Kaggle data PVC found"
	@echo "✅ Kaggle data cleared! Run 'make init-kaggle-pvc' to recreate."

logs-api: ## Tail API logs
	@kubectl logs -n $(NAMESPACE) -l app=kaggle-data-api -f --tail=100 || echo "⚠️  API not deployed yet"

logs-postgres: ## Tail PostgreSQL logs
	@kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/name=postgresql -f --tail=100

logs-redis: ## Tail Redis logs
	@kubectl logs -n $(NAMESPACE) -l app.kubernetes.io/name=redis -f --tail=100

status: ## Show cluster status
	@echo "📊 Cluster Status:"
	@echo ""
	@echo "Nodes:"
	@kubectl get nodes
	@echo ""
	@echo "Namespaces:"
	@kubectl get namespaces
	@echo ""
	@echo "Pods in $(NAMESPACE):"
	@kubectl get pods -n $(NAMESPACE) || echo "⚠️  Namespace $(NAMESPACE) not found"
	@echo ""
	@echo "Services in $(NAMESPACE):"
	@kubectl get services -n $(NAMESPACE) || echo "⚠️  Namespace $(NAMESPACE) not found"
