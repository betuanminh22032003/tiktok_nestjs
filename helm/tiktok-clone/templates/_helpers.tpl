{{- /*
  _init_containers.tpl - Reusable init container definitions for TikTok Clone services

  This file provides helper templates for common init containers used across services.
  Include this in your service YAML using: {{ include "tiktok-clone.init-containers" . }}
*/ -}}

{{- define "tiktok-clone.wait-for-postgres" -}}
- name: wait-for-postgres
  image: busybox:1.36
  command:
    - sh
    - -c
    - |
      echo "🔄 Waiting for PostgreSQL to be ready..."
      until nc -z {{ .Values.postgresql.service | default "postgres" }} {{ .Values.postgresql.port | default 5432 }}; do
        echo "⏳ PostgreSQL not ready - sleeping 2s"
        sleep 2
      done
      echo "✅ PostgreSQL is ready!"
  resources:
    requests:
      memory: "32Mi"
      cpu: "10m"
    limits:
      memory: "64Mi"
      cpu: "50m"
{{- end -}}

{{- define "tiktok-clone.wait-for-redis" -}}
- name: wait-for-redis
  image: busybox:1.36
  command:
    - sh
    - -c
    - |
      echo "🔄 Waiting for Redis to be ready..."
      until nc -z {{ .Values.redis.service | default "redis" }} {{ .Values.redis.port | default 6379 }}; do
        echo "⏳ Redis not ready - sleeping 2s"
        sleep 2
      done
      echo "✅ Redis is ready!"
  resources:
    requests:
      memory: "32Mi"
      cpu: "10m"
    limits:
      memory: "64Mi"
      cpu: "50m"
{{- end -}}

{{- define "tiktok-clone.wait-for-kafka" -}}
- name: wait-for-kafka
  image: busybox:1.36
  command:
    - sh
    - -c
    - |
      echo "🔄 Waiting for Kafka to be ready..."
      until nc -z {{ .Values.kafka.service | default "kafka" }} {{ .Values.kafka.port | default 9092 }}; do
        echo "⏳ Kafka not ready - sleeping 2s"
        sleep 2
      done
      echo "✅ Kafka is ready!"
  resources:
    requests:
      memory: "32Mi"
      cpu: "10m"
    limits:
      memory: "64Mi"
      cpu: "50m"
{{- end -}}

{{- define "tiktok-clone.wait-for-migration" -}}
{{- if .Values.migration.enabled }}
- name: wait-for-migration
  image: "{{ .Values.migration.image.repository }}:{{ .Values.migration.image.tag }}"
  command:
    - sh
    - -c
    - |
      echo "🔄 Checking migration status..."
      # Check if migration job completed successfully
      # This runs the version check to ensure schema is up-to-date
      node dist/scripts/migrations/check-version.js
  env:
    - name: CHECK_SERVICE
      value: {{ .serviceName | default "all" | quote }}
    - name: AUTH_DB_HOST
      valueFrom:
        configMapKeyRef:
          name: tiktok-db-config
          key: DB_HOST
    - name: AUTH_DB_PORT
      valueFrom:
        configMapKeyRef:
          name: tiktok-db-config
          key: DB_PORT
    - name: AUTH_DB_USERNAME
      valueFrom:
        configMapKeyRef:
          name: tiktok-db-config
          key: DB_USER
    - name: AUTH_DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: tiktok-db-secrets
          key: DB_PASSWORD
    - name: AUTH_DB_NAME
      value: {{ .Values.migration.databases.auth | default "tiktok_auth" | quote }}
  resources:
    requests:
      memory: "64Mi"
      cpu: "50m"
    limits:
      memory: "128Mi"
      cpu: "100m"
{{- end -}}
{{- end -}}

{{- /* Combined init containers for standard service */ -}}
{{- define "tiktok-clone.standard-init-containers" -}}
initContainers:
  {{- include "tiktok-clone.wait-for-postgres" . | nindent 2 }}
  {{- include "tiktok-clone.wait-for-redis" . | nindent 2 }}
{{- end -}}

{{- /* Init containers for services that need Kafka */ -}}
{{- define "tiktok-clone.kafka-init-containers" -}}
initContainers:
  {{- include "tiktok-clone.wait-for-postgres" . | nindent 2 }}
  {{- include "tiktok-clone.wait-for-redis" . | nindent 2 }}
  {{- include "tiktok-clone.wait-for-kafka" . | nindent 2 }}
{{- end -}}
