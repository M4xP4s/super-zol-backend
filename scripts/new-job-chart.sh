#!/usr/bin/env bash
set -euo pipefail

if [[ ${1:-} == "" ]]; then
  echo "Usage: $0 <job-name> [--type job|cronjob]" >&2
  exit 1
fi

NAME="$1"
TYPE="job"

if [[ ${2:-} == "--type" ]]; then
  TYPE="${3:-job}"
fi

if [[ "$TYPE" != "job" && "$TYPE" != "cronjob" ]]; then
  echo "Error: --type must be 'job' or 'cronjob'" >&2
  exit 1
fi

CHARTS_ROOT="infrastructure/helm"
CHART_DIR="${CHARTS_ROOT}/${NAME}"

if [[ -d "$CHART_DIR" ]]; then
  echo "Error: Chart directory already exists: $CHART_DIR" >&2
  exit 1
fi

mkdir -p "$CHART_DIR/templates"

# Chart.yaml
cat >"$CHART_DIR/Chart.yaml" <<EOF
apiVersion: v2
name: ${NAME}
description: Helm chart for ${NAME} job (uses library-charts/job)
type: application
version: 0.1.0
appVersion: "1.0.0"
dependencies:
  - name: job
    version: 0.1.0
    repository: "file://../library-charts/job"
EOF

# values.yaml (base)
cat >"$CHART_DIR/values.yaml" <<EOF
# Base values for job chart

type: ${TYPE}

image:
  repository: ghcr.io/your-org/your-repo/${NAME}
  pullPolicy: IfNotPresent
  tag: "latest"

serviceAccount:
  create: true

job:
  backoffLimit: 3
  activeDeadlineSeconds: 3600
  completions: 1
  parallelism: 1

cronJob:
  schedule: '0 2 * * *'
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  startingDeadlineSeconds: 300
  suspend: false

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

restartPolicy: OnFailure

env: []
envFrom: []

configMap:
  enabled: false
  data: {}

secrets:
  enabled: false
  data: {}

volumeMounts: []
volumes: []
EOF

# values-local.yaml
cat >"$CHART_DIR/values-local.yaml" <<'EOF'
image:
  pullPolicy: IfNotPresent
  tag: "latest"
EOF

# values-dev.yaml
cat >"$CHART_DIR/values-dev.yaml" <<'EOF'
image:
  tag: "dev"
resources:
  requests:
    cpu: 200m
    memory: 256Mi
EOF

# values-production.yaml
cat >"$CHART_DIR/values-production.yaml" <<'EOF'
image:
  pullPolicy: IfNotPresent
  tag: "v0.1.0"
resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 1000m
    memory: 1024Mi
EOF

# templates/manifest.yaml
cat >"$CHART_DIR/templates/manifest.yaml" <<'EOF'
{{/* Render standard job resources from library */}}
{{ include "job.secret" . }}
{{ include "job.configmap" . }}
{{ include "job.job" . }}
{{ include "job.cronjob" . }}
EOF

echo "✅ Created job chart at ${CHART_DIR}"
echo "ℹ️  Next: helm lint ${CHART_DIR}"

