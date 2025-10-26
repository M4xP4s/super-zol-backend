{{/*
Expand the name of the chart.
*/}}
{{- define "service.name" -}}
{{- include "common.name" . }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "service.fullname" -}}
{{- include "common.fullname" . }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "service.chart" -}}
{{- include "common.chart" .Chart }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "service.labels" -}}
{{- include "common.labels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "service.selectorLabels" -}}
{{- include "common.selectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "service.serviceAccountName" -}}
{{- include "common.serviceAccountName" . }}
{{- end }}

{{/*
Return the proper image name
*/}}
{{- define "service.image" -}}
{{- include "common.image" . }}
{{- end }}
