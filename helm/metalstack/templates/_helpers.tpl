{{/*
Expand the name of the chart.
*/}}
{{- define "metalstack.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "metalstack.fullname" -}}
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
*/}}
{{- define "metalstack.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "metalstack.labels" -}}
helm.sh/chart: {{ include "metalstack.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: metalstack
{{- end }}

{{/*
Backend labels
*/}}
{{- define "metalstack.backend.labels" -}}
{{ include "metalstack.labels" . }}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-backend
app.kubernetes.io/component: backend
app.kubernetes.io/version: {{ .Values.backend.image.tag | default .Chart.AppVersion | quote }}
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "metalstack.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-backend
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "metalstack.frontend.labels" -}}
{{ include "metalstack.labels" . }}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-frontend
app.kubernetes.io/component: frontend
app.kubernetes.io/version: {{ .Values.frontend.image.tag | default .Chart.AppVersion | quote }}
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "metalstack.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-frontend
app.kubernetes.io/component: frontend
{{- end }}

{{/*
PostgreSQL labels
*/}}
{{- define "metalstack.postgres.labels" -}}
{{ include "metalstack.labels" . }}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-postgres
app.kubernetes.io/component: database
{{- end }}

{{/*
PostgreSQL selector labels
*/}}
{{- define "metalstack.postgres.selectorLabels" -}}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-postgres
app.kubernetes.io/component: database
{{- end }}

{{/*
Keycloak labels
*/}}
{{- define "metalstack.keycloak.labels" -}}
{{ include "metalstack.labels" . }}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-keycloak
app.kubernetes.io/component: auth
{{- end }}

{{/*
Keycloak selector labels
*/}}
{{- define "metalstack.keycloak.selectorLabels" -}}
app.kubernetes.io/name: {{ include "metalstack.fullname" . }}-keycloak
app.kubernetes.io/component: auth
{{- end }}

{{/*
Create the name of the namespace to use
*/}}
{{- define "metalstack.namespace" -}}
{{- default (printf "metalstack-%s" .Values.environment) .Values.namespaceOverride }}
{{- end }}
