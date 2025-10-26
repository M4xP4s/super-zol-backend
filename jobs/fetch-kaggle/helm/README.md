## fetch-kaggle Helm Chart

Helm chart for the `fetch-kaggle` batch workload using the shared job library.

### Prerequisites

- Helm 3.9+
- Kubernetes cluster (kind/minikube/remote)
- Kaggle PVC installed: `infrastructure/helm/infrastructure/kaggle-data-pvc`

### Dependency

This chart depends on the local library chart `library-charts/job`.

Build chart dependencies once after generation or updates:

```
helm dependency build infrastructure/helm/fetch-kaggle
```

### Values

- `type`: `job` or `cronjob` (default: `cronjob`)
- `image.repository`: container image repository
- `cronJob.schedule`: cron expression for execution (default: `0 2 * * *`)
- `env`: environment variables
- `volumes`/`volumeMounts`: includes Kaggle data PVC

Defaults in `values.yaml` mount the `kaggle-data-pvc` at `/data/kaggle` and set `KAGGLE_DATA_ROOT`.

### Lint

```
helm lint infrastructure/helm/fetch-kaggle
```

If you see a dependency error, run `helm dependency build` first.

### Install (dry run)

```
helm install fetch-kaggle infrastructure/helm/fetch-kaggle \
  --namespace default \
  --dry-run --debug
```
