# Kaggle Data API - Helm Chart

This directory contains the Helm chart and Kubernetes resources for deploying the kaggle-data-api service.

## Directory Structure

```
helm/
├── Chart.yaml              # Helm chart metadata
├── Chart.lock              # Dependency lock file
├── values.yaml             # Default values
├── values-local.yaml       # Local development values
├── values-dev.yaml         # Development environment values
├── values-production.yaml  # Production environment values
├── templates/              # Helm templates
│   └── manifest.yaml      # Service manifest
├── migrations/             # Database migrations
│   ├── migration-configmap.yaml  # Migration scripts as ConfigMap
│   └── migration-job.yaml        # K8s Job to run migrations
└── README.md              # This file
```

## Prerequisites

- Kubernetes cluster (local: kind, cloud: GKE/EKS/AKS)
- PostgreSQL deployed in the same namespace
- `kubectl`, `helm` installed

## Quick Start

### 1. Install PostgreSQL

If PostgreSQL is not already deployed:

```bash
# Using the local-env setup
cd infrastructure/local-env
make init-postgres
```

### 2. Run Database Migrations

Apply migrations before deploying the service:

```bash
# Apply migration ConfigMap and Job
kubectl apply -f migrations/migration-configmap.yaml -n super-zol
kubectl apply -f migrations/migration-job.yaml -n super-zol

# Wait for migration to complete
kubectl wait --for=condition=complete --timeout=60s job/kaggle-data-api-migrations -n super-zol

# Verify
kubectl logs -n super-zol job/kaggle-data-api-migrations
```

### 3. Build and Load Docker Image

```bash
# From repository root
pnpm nx build kaggle-data-api
docker build -t kaggle-data-api:local -f services/kaggle-data-api/Dockerfile .

# Load into kind cluster (for local development)
kind load docker-image kaggle-data-api:local --name super-zol
```

### 4. Deploy with Helm

```bash
# Install or upgrade
helm upgrade --install kaggle-data-api . \
  -f values-local.yaml \
  -n super-zol \
  --set image.tag=local \
  --wait

# Verify deployment
kubectl get pods -n super-zol -l app=kaggle-data-api
```

### 5. Test the Deployment

```bash
# Port forward to access the service
kubectl port-forward -n super-zol svc/kaggle-data-api 3001:80 &

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/datasets
curl http://localhost:3001/docs  # Swagger UI
```

## Configuration

### Environment-Specific Values

The chart includes three environment-specific value files:

#### Local Development (`values-local.yaml`)

- Image: `kaggle-data-api:local`
- Replicas: 1
- Ingress: `kaggle-api.localhost`
- Database: PostgreSQL in kind cluster
- CORS: Permissive (localhost origins)

#### Development (`values-dev.yaml`)

- Image: From container registry
- Replicas: 2
- Ingress: `kaggle-api-dev.yourdomain.com`
- Database: Dev PostgreSQL instance
- CORS: Dev frontend origins

#### Production (`values-production.yaml`)

- Image: Specific tagged version
- Replicas: 3+ (with autoscaling)
- Ingress: `kaggle-api.yourdomain.com`
- Database: Production PostgreSQL cluster
- CORS: Production origins only
- Resource limits enforced

### Key Configuration Options

```yaml
# Image configuration
image:
  repository: kaggle-data-api
  tag: '1.0.0'
  pullPolicy: IfNotPresent

# Replicas
replicaCount: 2

# Resources
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

# Health checks
healthCheck:
  liveness:
    path: /health/live
    initialDelaySeconds: 30
  readiness:
    path: /health/ready
    initialDelaySeconds: 10

# Database configuration
env:
  - name: DB_HOST
    value: postgresql.super-zol.svc.cluster.local
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgresql
        key: password

# Ingress
ingress:
  enabled: true
  hosts:
    - host: kaggle-api.localhost
      paths:
        - path: /
          pathType: Prefix
```

## Database Migrations

### Migration Structure

Migrations are stored as a Kubernetes ConfigMap and executed via a Job:

- **ConfigMap** (`migration-configmap.yaml`): Contains SQL scripts and runner script
- **Job** (`migration-job.yaml`): Runs migrations using PostgreSQL image

### Adding New Migrations

1. Create a new SQL file in `/services/kaggle-data-api/migrations/`:

   ```sql
   -- 002_add_users_table.sql
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) NOT NULL UNIQUE
   );
   ```

2. Update the ConfigMap in `migrations/migration-configmap.yaml`:

   ```yaml
   data:
     002_add_users_table.sql: |
       CREATE TABLE users ...
   ```

3. Apply the updated ConfigMap and re-run the job:
   ```bash
   kubectl delete job -n super-zol kaggle-data-api-migrations
   kubectl apply -f migrations/migration-configmap.yaml -n super-zol
   kubectl apply -f migrations/migration-job.yaml -n super-zol
   ```

### Migration Best Practices

- **Idempotent migrations**: Use `IF NOT EXISTS` / `IF EXISTS`
- **Version naming**: Use sequential numbering (`001_`, `002_`, etc.)
- **Test locally**: Run migrations on local PostgreSQL first
- **Backup production**: Always backup before running migrations in production
- **Rollback plan**: Have a rollback SQL script ready

## Upgrading the Chart

### Update Application Version

```bash
# Update image tag
helm upgrade kaggle-data-api . \
  -f values-local.yaml \
  --set image.tag=v1.1.0 \
  -n super-zol \
  --wait
```

### Update Configuration

```bash
# Edit values file, then upgrade
helm upgrade kaggle-data-api . \
  -f values-production.yaml \
  -n super-zol \
  --wait
```

### Dry Run

Always test changes with `--dry-run` first:

```bash
helm upgrade kaggle-data-api . \
  -f values-local.yaml \
  -n super-zol \
  --dry-run --debug
```

## Troubleshooting

### Pod Won't Start

```bash
# Check pod status
kubectl get pods -n super-zol -l app=kaggle-data-api

# View pod events
kubectl describe pod -n super-zol -l app=kaggle-data-api

# Check logs
kubectl logs -n super-zol -l app=kaggle-data-api --tail=100
```

### Health Check Failing

```bash
# Check readiness probe
kubectl logs -n super-zol -l app=kaggle-data-api | grep -i health

# Test database connectivity
kubectl exec -it -n super-zol deployment/kaggle-data-api -- \
  wget -O- http://localhost:3000/health/ready
```

### Migration Job Failed

```bash
# View job logs
kubectl logs -n super-zol job/kaggle-data-api-migrations

# Delete and retry
kubectl delete job -n super-zol kaggle-data-api-migrations
kubectl apply -f migrations/migration-job.yaml -n super-zol
```

## Uninstalling

```bash
# Remove Helm release
helm uninstall kaggle-data-api -n super-zol

# Optional: Clean up migrations
kubectl delete job -n super-zol kaggle-data-api-migrations
kubectl delete configmap -n super-zol kaggle-data-api-migrations
```

## CI/CD Integration

### Example GitHub Actions

```yaml
- name: Deploy to Kubernetes
  run: |
    helm upgrade --install kaggle-data-api ./services/kaggle-data-api/helm \
      -f ./services/kaggle-data-api/helm/values-production.yaml \
      --set image.tag=${{ github.sha }} \
      -n super-zol \
      --wait --timeout 5m
```

### Helm Hooks

The chart supports Helm hooks for advanced deployment scenarios:

- `pre-install`: Run before installation
- `post-install`: Run after installation
- `pre-upgrade`: Run before upgrade
- `post-upgrade`: Run after upgrade

Example hook annotation:

```yaml
metadata:
  annotations:
    'helm.sh/hook': pre-upgrade
    'helm.sh/hook-weight': '0'
```

## Resources

- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Fastify Production Deployment](https://www.fastify.io/docs/latest/Guides/Deployment/)
