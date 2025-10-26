# Kaggle Data Storage Migration Guide

## Overview

This guide outlines the steps to migrate Kaggle dataset storage from job-local directory to a shared volume accessible by both the fetch-kaggle job and the future API service.

## Current State

**Location**: `jobs/fetch-kaggle/data/kaggle_raw/YYYYMMDD/`

**Issues**:

- Data is local to the fetch-kaggle job
- Not accessible by other services
- Harder to manage in Kubernetes (each job pod has its own storage)
- No separation between raw and processed data

## Target State

**Location**: `/data/kaggle/`

**Structure**:

```
/data/kaggle/
├── raw/                    # Raw CSV files from Kaggle
│   └── YYYYMMDD/
│       ├── *.csv
│       └── download_manifest.json
├── processed/              # Transformed/validated data
│   └── YYYYMMDD/
│       ├── load_summary.json
│       └── validation_report.json
└── archive/                # Historical backups
    └── YYYYMMDD.tar.gz
```

**Benefits**:

- Shared access between services
- Clear separation of raw vs processed data
- Easier to mount as Kubernetes PVC
- Supports archival and cleanup policies

## Migration Steps

### Step 1: Update Configuration

**File**: `jobs/fetch-kaggle/src/infrastructure/config.ts`

```typescript
// BEFORE:
export const KAGGLE_CONFIG = {
  datasetId: 'erlichsefi/israeli-supermarkets-2024',
  datasetUrl: 'https://www.kaggle.com/datasets/erlichsefi/israeli-supermarkets-2024',
  dataRoot: join(JOB_ROOT, 'data', 'kaggle_raw'),
  reportsDir: join(JOB_ROOT, 'data', 'reports'),
  metadataDir: join(JOB_ROOT, 'data', 'metadata'),
} as const;

// AFTER:
const SHARED_DATA_ROOT = process.env.KAGGLE_DATA_ROOT || '/data/kaggle';

export const KAGGLE_CONFIG = {
  datasetId: 'erlichsefi/israeli-supermarkets-2024',
  datasetUrl: 'https://www.kaggle.com/datasets/erlichsefi/israeli-supermarkets-2024',
  dataRoot: join(SHARED_DATA_ROOT, 'raw'),
  reportsDir: join(SHARED_DATA_ROOT, 'reports'),
  metadataDir: join(SHARED_DATA_ROOT, 'metadata'),
  processedDir: join(SHARED_DATA_ROOT, 'processed'),
  archiveDir: join(SHARED_DATA_ROOT, 'archive'),
} as const;
```

### Step 2: Update Docker Compose

**File**: `docker-compose.yml` (create if doesn't exist)

```yaml
version: '3.8'

services:
  fetch-kaggle:
    build:
      context: .
      dockerfile: jobs/fetch-kaggle/Dockerfile
    environment:
      - KAGGLE_DATA_ROOT=/data/kaggle
    volumes:
      - kaggle_data:/data/kaggle
    command: ['node', 'dist/jobs/fetch-kaggle/src/cli/index.js', 'download']

volumes:
  kaggle_data:
    driver: local
```

### Step 3: Create Kubernetes PVC

**File**: `k8s/kaggle-data-pvc.yaml` (create new file)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: kaggle-data-pvc
  namespace: super-zol
  labels:
    app: kaggle-data
spec:
  accessModes:
    - ReadWriteMany # Multiple pods can read/write
  resources:
    requests:
      storage: 10Gi
  storageClassName: '' # Use default storage class
```

**Apply**:

```bash
kubectl apply -f k8s/kaggle-data-pvc.yaml
```

### Step 4: Update CronJob (if using Kubernetes CronJob for fetch-kaggle)

**File**: `k8s/fetch-kaggle-cronjob.yaml`

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: fetch-kaggle
  namespace: super-zol
spec:
  schedule: '0 2 * * *' # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: fetch-kaggle
              image: registry.example.com/fetch-kaggle:latest
              env:
                - name: KAGGLE_DATA_ROOT
                  value: '/data/kaggle'
              volumeMounts:
                - name: kaggle-data
                  mountPath: /data/kaggle
          volumes:
            - name: kaggle-data
              persistentVolumeClaim:
                claimName: kaggle-data-pvc
          restartPolicy: OnFailure
```

### Step 5: Update Tests

**File**: `jobs/fetch-kaggle/tests/integration/download-flow.test.ts`

```typescript
// BEFORE:
const testDataRoot = join(__dirname, '../fixtures/tmp');

// AFTER:
const testDataRoot = process.env.KAGGLE_DATA_ROOT || join(__dirname, '../fixtures/tmp');
```

### Step 6: Create Directory Structure Utility

**File**: `jobs/fetch-kaggle/src/lib/utils/storage.ts` (create new)

```typescript
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

/**
 * Initialize Kaggle data storage directories
 */
export async function initializeStorageDirectories(rootDir: string): Promise<void> {
  const directories = [
    join(rootDir, 'raw'),
    join(rootDir, 'processed'),
    join(rootDir, 'reports'),
    join(rootDir, 'metadata'),
    join(rootDir, 'archive'),
  ];

  for (const dir of directories) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Get date-specific directory path
 */
export function getDateDirectory(rootDir: string, date: string, type: 'raw' | 'processed'): string {
  return join(rootDir, type, date);
}
```

### Step 7: Update CLI to Initialize Directories

**File**: `jobs/fetch-kaggle/src/cli/index.ts`

```typescript
import { initializeStorageDirectories } from '../lib/utils/storage.js';
import { KAGGLE_CONFIG } from '../infrastructure/config.js';

async function main(): Promise<void> {
  const program = new Command();

  // Initialize storage directories on startup
  const dataRoot = process.env.KAGGLE_DATA_ROOT || KAGGLE_CONFIG.dataRoot;
  await initializeStorageDirectories(dataRoot);

  // ... rest of CLI setup
}
```

## Testing the Migration

### Local Testing (Development)

```bash
# 1. Set environment variable
export KAGGLE_DATA_ROOT=/tmp/kaggle-test

# 2. Run download command
pnpm nx run fetch-kaggle:cli -- download --dry-run

# 3. Verify directory structure
ls -la /tmp/kaggle-test/
# Should see: raw/ processed/ reports/ metadata/ archive/

# 4. Verify data location
ls -la /tmp/kaggle-test/raw/YYYYMMDD/
# Should see CSV files and manifest
```

### Docker Testing

```bash
# 1. Build image
docker build -t fetch-kaggle:test -f jobs/fetch-kaggle/Dockerfile .

# 2. Run with volume
docker run -v kaggle_data:/data/kaggle \
  -e KAGGLE_DATA_ROOT=/data/kaggle \
  fetch-kaggle:test download --dry-run

# 3. Inspect volume
docker volume inspect kaggle_data

# 4. Verify data
docker run -v kaggle_data:/data/kaggle \
  alpine ls -la /data/kaggle/raw
```

### Kubernetes Testing

```bash
# 1. Create PVC
kubectl apply -f k8s/kaggle-data-pvc.yaml

# 2. Create test pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: kaggle-data-test
  namespace: super-zol
spec:
  containers:
  - name: test
    image: alpine
    command: ["sleep", "3600"]
    volumeMounts:
    - name: data
      mountPath: /data/kaggle
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: kaggle-data-pvc
EOF

# 3. Write test data
kubectl exec -n super-zol kaggle-data-test -- \
  sh -c 'mkdir -p /data/kaggle/raw/20241026 && echo "test" > /data/kaggle/raw/20241026/test.txt'

# 4. Verify from another pod
kubectl run -n super-zol test-reader --rm -it --image=alpine -- \
  sh -c 'ls -la /data/kaggle/raw/20241026'

# 5. Cleanup
kubectl delete pod -n super-zol kaggle-data-test
```

## Rollback Plan

If migration causes issues:

### Step 1: Revert Configuration

```typescript
// Restore original config
export const KAGGLE_CONFIG = {
  dataRoot: join(JOB_ROOT, 'data', 'kaggle_raw'),
  // ... original values
};
```

### Step 2: Copy Data Back (if needed)

```bash
# From shared volume to local
cp -r /data/kaggle/raw/YYYYMMDD/ jobs/fetch-kaggle/data/kaggle_raw/
```

### Step 3: Revert Git Changes

```bash
git checkout HEAD -- jobs/fetch-kaggle/src/infrastructure/config.ts
```

## Data Migration Script

**File**: `scripts/migrate-kaggle-data.sh` (create new)

```bash
#!/bin/bash
set -e

# Migrate existing Kaggle data to new location

OLD_ROOT="jobs/fetch-kaggle/data/kaggle_raw"
NEW_ROOT="${KAGGLE_DATA_ROOT:-/data/kaggle/raw}"

echo "Migrating Kaggle data..."
echo "  From: $OLD_ROOT"
echo "  To:   $NEW_ROOT"

# Create new directory structure
mkdir -p "$NEW_ROOT"

# Copy data
if [ -d "$OLD_ROOT" ]; then
  echo "Copying data..."
  cp -r "$OLD_ROOT"/* "$NEW_ROOT/"
  echo "✓ Data copied"
else
  echo "⚠ No existing data found at $OLD_ROOT"
fi

# Verify
echo ""
echo "Verification:"
ls -lh "$NEW_ROOT"

echo ""
echo "✓ Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Update config to use $NEW_ROOT"
echo "  2. Test with: pnpm nx run fetch-kaggle:cli -- download --dry-run"
echo "  3. If successful, remove old data: rm -rf $OLD_ROOT"
```

**Usage**:

```bash
chmod +x scripts/migrate-kaggle-data.sh
export KAGGLE_DATA_ROOT=/data/kaggle/raw
./scripts/migrate-kaggle-data.sh
```

## Post-Migration Checklist

- [ ] Configuration updated (`config.ts`)
- [ ] Tests updated and passing
- [ ] Docker Compose configuration updated
- [ ] Kubernetes PVC created
- [ ] CronJob/Job manifests updated
- [ ] Data migrated successfully
- [ ] New location verified
- [ ] Old data backed up
- [ ] Documentation updated
- [ ] Team notified

## Environment Variables

| Variable           | Description                    | Default        | Required |
| ------------------ | ------------------------------ | -------------- | -------- |
| `KAGGLE_DATA_ROOT` | Root directory for Kaggle data | `/data/kaggle` | Yes      |
| `KAGGLE_USERNAME`  | Kaggle API username            | -              | Yes      |
| `KAGGLE_KEY`       | Kaggle API key                 | -              | Yes      |

## Storage Requirements

| Data Type      | Estimated Size | Retention |
| -------------- | -------------- | --------- |
| Raw CSV files  | ~50MB/day      | 90 days   |
| Processed data | ~20MB/day      | 90 days   |
| Reports        | ~1MB/day       | 365 days  |
| Metadata       | <1MB/day       | 365 days  |
| Archive        | Compressed     | 1 year    |

**Total**: ~10GB for 90 days of raw + processed data

**Recommendation**: Provision 20-50GB PVC to account for growth

## Troubleshooting

### Issue: Permission Denied

```bash
# Solution: Ensure correct ownership
chown -R 1000:1000 /data/kaggle

# In Kubernetes, set securityContext
securityContext:
  runAsUser: 1000
  fsGroup: 1000
```

### Issue: Directory Not Found

```bash
# Solution: Initialize directories
mkdir -p /data/kaggle/{raw,processed,reports,metadata,archive}
```

### Issue: PVC Not Binding

```bash
# Check PVC status
kubectl get pvc -n super-zol

# Describe for details
kubectl describe pvc kaggle-data-pvc -n super-zol

# Check storage classes
kubectl get storageclass
```

### Issue: Data Not Accessible from API Service

```bash
# Ensure both services mount the same PVC
# In deployment.yaml for both services:
volumeMounts:
- name: kaggle-data
  mountPath: /data/kaggle
volumes:
- name: kaggle-data
  persistentVolumeClaim:
    claimName: kaggle-data-pvc
```

## Next Steps

After completing migration:

1. ✅ Verify fetch-kaggle job works with new location
2. ✅ Update documentation
3. 🔜 Implement ETL service to read from shared volume
4. 🔜 Implement API service to serve data from database
5. 🔜 Set up cleanup/archival cron jobs

---

**Document Version**: 1.0.0
**Last Updated**: 2024-10-26
**Status**: Ready for Implementation
