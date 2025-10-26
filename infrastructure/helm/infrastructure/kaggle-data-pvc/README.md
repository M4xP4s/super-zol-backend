# Kaggle Data PVC Helm Chart

Persistent Volume Claim for shared Kaggle dataset storage.

## Overview

This chart creates a PersistentVolumeClaim (PVC) that provides shared storage for:

- **fetch-kaggle job**: Writes downloaded CSV files
- **kaggle-data-api service**: Reads CSV files for ETL processing

## Features

- **ReadWriteMany access**: Multiple pods can read and write simultaneously
- **Environment-specific values**: Separate configurations for local, staging, and production
- **Configurable storage class**: Supports different cloud providers
- **Size management**: Adjustable storage size based on data volume

## Installation

### Local Development

```bash
# Install with local values
helm install kaggle-data-pvc ./infrastructure/helm/infrastructure/kaggle-data-pvc \
  -f ./infrastructure/helm/infrastructure/kaggle-data-pvc/values-local.yaml \
  -n super-zol --create-namespace

# Or use the Makefile
cd infrastructure/local-env
make init-kaggle-pvc
```

### Production

```bash
# Install with production values
helm install kaggle-data-pvc ./infrastructure/helm/infrastructure/kaggle-data-pvc \
  -f ./infrastructure/helm/infrastructure/kaggle-data-pvc/values-production.yaml \
  -n super-zol --create-namespace
```

## Configuration

### Storage Class

Different storage classes for different environments:

| Environment      | Storage Class            | Notes                |
| ---------------- | ------------------------ | -------------------- |
| **Local (kind)** | `standard`               | Default kind storage |
| **AWS**          | `gp3`, `io1`, `io2`      | EBS volumes          |
| **GCP**          | `standard-rwo`, `pd-ssd` | Persistent disks     |
| **Azure**        | `managed-premium`        | Managed disks        |

### Access Modes

- **ReadWriteMany** (default): Required for shared access between fetch-kaggle and API service
- **ReadWriteOnce**: Single pod access (not recommended)
- **ReadOnlyMany**: Read-only shared access

### Storage Size

Recommended sizes based on data volume:

- **Local dev**: 5Gi (recent data only)
- **Staging**: 10Gi (last few months)
- **Production**: 20Gi+ (full history + buffer)

## Values

### Default Values (`values.yaml`)

```yaml
storage:
  storageClassName: standard
  accessMode: ReadWriteMany
  size: 10Gi

labels:
  app: kaggle-data
  component: storage

annotations: {}
selector: {}
volumeMode: Filesystem
```

### Local Values (`values-local.yaml`)

```yaml
storage:
  storageClassName: standard
  accessMode: ReadWriteMany
  size: 5Gi # Smaller for local dev
```

### Production Values (`values-production.yaml`)

```yaml
storage:
  storageClassName: gp3 # AWS example
  accessMode: ReadWriteMany
  size: 20Gi # Production size with buffer
```

## Directory Structure

The PVC is mounted in pods at `/data/kaggle` with the following structure:

```
/data/kaggle/
├── raw/                 # Raw downloaded CSV files
│   └── YYYYMMDD/       # Date-based directories
│       ├── manifest.json
│       ├── full_catalog_*.csv
│       └── ... (other CSV files)
├── processed/          # Transformed/validated data (future)
│   └── YYYYMMDD/
└── archive/            # Historical backups (future)
    └── YYYYMMDD.tar.gz
```

## Usage in Pods

### fetch-kaggle Job

```yaml
volumeMounts:
  - name: kaggle-data
    mountPath: /data/kaggle
    subPath: raw # Optional: mount only raw directory

volumes:
  - name: kaggle-data
    persistentVolumeClaim:
      claimName: kaggle-data-pvc
```

### kaggle-data-api Service

```yaml
volumeMounts:
  - name: kaggle-data
    mountPath: /data/kaggle
    readOnly: true # API only reads data

volumes:
  - name: kaggle-data
    persistentVolumeClaim:
      claimName: kaggle-data-pvc
```

## Verification

### Check PVC Status

```bash
# Get PVC status
kubectl get pvc -n super-zol kaggle-data-pvc

# Describe PVC
kubectl describe pvc -n super-zol kaggle-data-pvc

# Check bound PV
kubectl get pv
```

### Test Write/Read

```bash
# Create a test pod to write data
kubectl run -n super-zol test-writer --image=busybox --restart=Never --rm -it \
  --overrides='{
    "spec": {
      "containers": [{
        "name": "test",
        "image": "busybox",
        "command": ["sh", "-c", "echo test > /data/test.txt && cat /data/test.txt"],
        "volumeMounts": [{
          "name": "data",
          "mountPath": "/data"
        }]
      }],
      "volumes": [{
        "name": "data",
        "persistentVolumeClaim": {
          "claimName": "kaggle-data-pvc"
        }
      }]
    }
  }'

# Create another pod to read the same data
kubectl run -n super-zol test-reader --image=busybox --restart=Never --rm -it \
  --overrides='{
    "spec": {
      "containers": [{
        "name": "test",
        "image": "busybox",
        "command": ["cat", "/data/test.txt"],
        "volumeMounts": [{
          "name": "data",
          "mountPath": "/data"
        }]
      }],
      "volumes": [{
        "name": "data",
        "persistentVolumeClaim": {
          "claimName": "kaggle-data-pvc"
        }
      }]
    }
  }'
```

## Troubleshooting

### PVC Stuck in Pending

```bash
# Check events
kubectl describe pvc -n super-zol kaggle-data-pvc

# Common causes:
# 1. No storage class available
kubectl get storageclass

# 2. Insufficient storage in cluster
kubectl get nodes -o wide

# 3. ReadWriteMany not supported by storage class
# Solution: Use NFS or cloud provider that supports RWX
```

### Cannot Write to Volume

```bash
# Check pod security context
kubectl get pod <pod-name> -n super-zol -o yaml | grep -A 10 securityContext

# Ensure volume permissions
kubectl exec -n super-zol <pod-name> -- ls -la /data/kaggle
```

### Data Not Persisting

```bash
# Verify PV is bound
kubectl get pv

# Check PV reclaim policy (should be Retain or Recycle)
kubectl get pv <pv-name> -o yaml | grep reclaimPolicy
```

## Upgrading

```bash
# Upgrade with new values
helm upgrade kaggle-data-pvc ./infrastructure/helm/infrastructure/kaggle-data-pvc \
  -f ./infrastructure/helm/infrastructure/kaggle-data-pvc/values-production.yaml \
  -n super-zol

# Note: Cannot change storage size while PVC is bound
# To increase size, you need to:
# 1. Delete PVC (backup data first!)
# 2. Reinstall with new size
# OR use volume expansion if supported by storage class
```

## Deletion

```bash
# Uninstall chart
helm uninstall kaggle-data-pvc -n super-zol

# Delete PVC manually if needed
kubectl delete pvc -n super-zol kaggle-data-pvc

# Note: This will delete all data in the volume!
# Always backup important data before deletion
```

## References

- [Kubernetes Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [Volume Access Modes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes)
