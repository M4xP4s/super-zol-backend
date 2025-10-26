{{/*
Expand the name of the chart.
*/}}
{{- define "job.name" -}}
{{- include "common.name" . }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "job.fullname" -}}
{{- include "common.fullname" . }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "job.chart" -}}
{{- include "common.chart" .Chart }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "job.labels" -}}
{{- include "common.labels" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "job.selectorLabels" -}}
{{- include "common.selectorLabels" . }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "job.serviceAccountName" -}}
{{- include "common.serviceAccountName" . }}
{{- end }}

{{/*
Return the proper image name
*/}}
{{- define "job.image" -}}
{{- include "common.image" . }}
{{- end }}
