# Local Kubernetes Environment

Complete local development environment for Super Zol using Kind (Kubernetes in Docker).

## Prerequisites

- **Docker** - Running and configured
- **kind** - Kubernetes in Docker (installed via `make setup`)
- **helm** - Helm package manager (installed via `make setup`)
- **kubectl** - Kubernetes CLI (installed via `make setup`)

## Quick Start

```bash
# 1. Install required tools
make setup

# 2. Create kind cluster with ingress
make deploy

# 3. Initialize infrastructure
make init-all

# 4. Check status
make status
```

## Available Commands

### Setup & Deployment

- `make setup` - Install required tools (kind, helm, kubectl)
- `make deploy` - Create kind cluster with nginx ingress
- `make clean` - Delete kind cluster
- `make clean-all` - Delete cluster and remove all data

### Infrastructure

- `make init-all` - Initialize all infrastructure (PostgreSQL + Redis)
- `make init-postgres` - Deploy PostgreSQL only
- `make init-redis` - Deploy Redis only
- `make init-monitoring` - Deploy Prometheus + Grafana (optional)
- `make init-kaggle-pvc` - Create Kaggle data PVC (available after Step 0.4)

### Operations

- `make status` - Show cluster and services status
- `make reset-data` - Clear Kaggle data PVC
- `make logs-api` - Tail API logs
- `make logs-postgres` - Tail PostgreSQL logs
- `make logs-redis` - Tail Redis logs

## Architecture

### Cluster Configuration

The kind cluster is configured with:

- 1 control-plane node
- 2 worker nodes
- Ingress controller on port 80/443

### Infrastructure Components

1. **PostgreSQL** (Bitnami Chart)
   - Database: `superzol`
   - Username: `superzol`
   - Password: stored in secret
   - Port: 5432
   - Storage: 5Gi persistent volume

2. **Redis** (Bitnami Chart)
   - Standalone architecture
   - Port: 6379
   - Password: stored in secret
   - Persistence: disabled for local dev

3. **Nginx Ingress Controller**
   - Handles HTTP/HTTPS routing
   - Accessible on localhost:80/443

## Directory Structure

```
infrastructure/local-env/
├── Makefile              # Main commands
├── kind-config.yaml      # Kind cluster configuration
├── scripts/              # Setup scripts
│   ├── init-kind.sh      # Create kind cluster
│   ├── init-nginx.sh     # Install nginx ingress
│   ├── init-postgres.sh  # Deploy PostgreSQL
│   ├── init-redis.sh     # Deploy Redis
│   └── init-monitoring.sh # Deploy monitoring (optional)
├── helm-values/          # Helm value files
│   ├── postgres.yaml     # PostgreSQL configuration
│   └── redis.yaml        # Redis configuration
└── tests/                # Integration tests
    └── integration.test.sh # Local environment tests
```

## Accessing Services

### PostgreSQL

```bash
# Get password
kubectl get secret -n super-zol postgresql -o jsonpath='{.data.password}' | base64 -d

# Port forward to local machine
kubectl port-forward -n super-zol svc/postgresql 5432:5432

# Connect with psql
psql -h localhost -p 5432 -U superzol -d superzol
```

### Redis

```bash
# Get password
kubectl get secret -n super-zol redis -o jsonpath='{.data.redis-password}' | base64 -d

# Port forward to local machine
kubectl port-forward -n super-zol svc/redis-master 6379:6379

# Connect with redis-cli
redis-cli -h localhost -p 6379 -a <password>
```

### Grafana (if monitoring enabled)

```bash
# Port forward
kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80

# Access: http://localhost:3000
# Username: admin
# Password: admin
```

## Testing

Run integration tests to verify the environment:

```bash
./tests/integration.test.sh
```

Tests verify:

- Kind cluster creation
- Nginx ingress controller
- PostgreSQL deployment and connectivity
- Redis deployment and connectivity
- Service discovery
- Health checks

## Troubleshooting

### Cluster won't start

```bash
# Delete and recreate
make clean
make deploy
```

### Pods stuck in Pending

```bash
# Check pod events
kubectl describe pod <pod-name> -n super-zol

# Check node resources
kubectl top nodes
```

### Can't connect to services

```bash
# Verify service is running
kubectl get pods -n super-zol

# Check service endpoints
kubectl get endpoints -n super-zol

# View logs
make logs-postgres  # or logs-redis
```

### Ingress not working

```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Verify ingress resources
kubectl get ingress -n super-zol
```

## Cleanup

```bash
# Remove cluster but keep Docker volumes
make clean

# Remove everything including data
make clean-all
```

## Next Steps

After setting up the local environment:

1. Deploy the Kaggle Data API service
2. Configure ingress for API access
3. Load sample data
4. Test API endpoints

## Resources

- [Kind Documentation](https://kind.sigs.k8s.io/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
