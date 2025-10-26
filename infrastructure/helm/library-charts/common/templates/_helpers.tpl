{{/*
Expand the name of the chart.
Usage: {{ include "common.name" (dict "Chart" .Chart "Values" .Values) }}
*/}}
{{- define "common.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
Usage: {{ include "common.fullname" (dict "Chart" .Chart "Release" .Release "Values" .Values) }}
*/}}
{{- define "common.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
Usage: {{ include "common.chart" .Chart }}
*/}}
{{- define "common.chart" -}}
{{- /* Accepts a Chart metadata object: pass .Chart to this template */ -}}
{{- printf "%s-%s" .Name .Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
Usage: {{ include "common.labels" (dict "Chart" .Chart "Release" .Release "Values" .Values) }}
*/}}
{{- define "common.labels" -}}
helm.sh/chart: {{ include "common.chart" .Chart }}
{{ include "common.selectorLabels" (dict "Chart" .Chart "Release" .Release "Values" .Values) }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
Usage: {{ include "common.selectorLabels" (dict "Chart" .Chart "Release" .Release "Values" .Values) }}
*/}}
{{- define "common.selectorLabels" -}}
app.kubernetes.io/name: {{ include "common.name" (dict "Chart" .Chart "Values" .Values) }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
Usage: {{ include "common.serviceAccountName" (dict "Chart" .Chart "Release" .Release "Values" .Values) }}
*/}}
{{- define "common.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "common.fullname" (dict "Chart" .Chart "Release" .Release "Values" .Values)) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Return the proper image name
Usage: {{ include "common.image" (dict "Chart" .Chart "Values" .Values) }}
*/}}
{{- define "common.image" -}}
{{- $tag := .Values.image.tag | default .Chart.AppVersion -}}
{{- printf "%s:%s" .Values.image.repository $tag }}
{{- end }}
