#!/usr/bin/env bash
set -euo pipefail

if [[ ${1:-} == "" ]]; then
  echo "Usage: $0 <service-name>" >&2
  exit 1
fi

NAME="$1"
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
description: Helm chart for ${NAME} service (uses library-charts/service)
type: application
version: 0.1.0
appVersion: "1.0.0"
dependencies:
  - name: service
    version: 0.1.0
    repository: "file://../library-charts/service"
EOF

# values.yaml (base)
cat >"$CHART_DIR/values.yaml" <<'EOF'
# Base values for service chart

replicaCount: 1

image:
  repository: ghcr.io/your-org/your-repo/your-service
  pullPolicy: IfNotPresent
  tag: "latest"

serviceAccount:
  create: true

service:
  enabled: true
  type: ClusterIP
  port: 80
  targetPort: 3000
  annotations: {}

ingress:
  enabled: false
  className: nginx
  annotations: {}
  hosts:
    - host: service.localhost
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

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

livenessProbe:
  enabled: false
  httpGet:
    path: /health/live
    port: 3000

readinessProbe:
  enabled: false
  httpGet:
    path: /health/ready
    port: 3000

startupProbe:
  enabled: false
  httpGet:
    path: /health/live
    port: 3000
EOF

# values-local.yaml
cat >"$CHART_DIR/values-local.yaml" <<'EOF'
image:
  pullPolicy: IfNotPresent
  tag: "latest"

ingress:
  enabled: true
  hosts:
    - host: service.localhost
      paths:
        - path: /
          pathType: Prefix
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
{{/* Render standard service resources from library */}}
{{ include "service.secret" . }}
{{ include "service.configmap" . }}
{{ include "service.deployment" . }}
{{ include "service.service" . }}
{{ include "service.ingress" . }}
EOF

echo "✅ Created service chart at ${CHART_DIR}"
echo "ℹ️  Next: helm lint ${CHART_DIR}"

